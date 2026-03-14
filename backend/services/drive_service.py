import io
import json
import logging
import os
import time

logger = logging.getLogger(__name__)
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

from google.auth.exceptions import RefreshError
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload
from sqlalchemy.orm import Session

import config
from models.models import DriveAccount, File
from services.auth_service import decrypt_token

SCOPES = ["https://www.googleapis.com/auth/drive"]
PROFILE_FOLDER_NAME = "_DrivePool_"
CREDENTIALS_PATH = os.path.join(config.CONFIG_DIR, "credentials.json")


def _retry_on_rate_limit(fn, *args, **kwargs):
    delays = [1, 2, 4]
    for attempt, delay in enumerate(delays):
        try:
            return fn(*args, **kwargs)
        except HttpError as e:
            if e.resp.status == 429 and attempt < len(delays) - 1:
                time.sleep(delay)
            else:
                raise


def build_service(account: DriveAccount):
    if not account.refresh_token:
        raise ValueError(f"Account {account.account_index} is not connected (no refresh token)")
    refresh_token = decrypt_token(account.refresh_token)
    with open(CREDENTIALS_PATH) as f:
        client_config = json.load(f)
    web = client_config.get("web") or client_config.get("installed")
    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=web["client_id"],
        client_secret=web["client_secret"],
        scopes=SCOPES,
    )
    return build("drive", "v3", credentials=creds)


def get_oauth_flow(redirect_uri: str) -> Flow:
    flow = Flow.from_client_secrets_file(CREDENTIALS_PATH, scopes=SCOPES, redirect_uri=redirect_uri)
    return flow


def get_storage_quota(account: DriveAccount) -> dict:
    try:
        service = build_service(account)
        result = _retry_on_rate_limit(
            service.about().get(fields="storageQuota").execute
        )
        quota = result["storageQuota"]
        used = int(quota.get("usage", 0))
        limit = int(quota.get("limit", 15 * 1024 ** 3))
        return {
            "account_index": account.account_index,
            "email": account.email,
            "is_connected": account.is_connected,
            "used": used,
            "limit": limit,
            "free": max(0, limit - used),
        }
    except RefreshError:
        return {
            "account_index": account.account_index,
            "email": account.email,
            "is_connected": False,
            "used": 0,
            "limit": 0,
            "free": 0,
        }
    except Exception:
        return {
            "account_index": account.account_index,
            "email": account.email,
            "is_connected": account.is_connected,
            "used": 0,
            "limit": 0,
            "free": 0,
        }


def get_all_quotas(db: Session) -> list[dict]:
    accounts = db.query(DriveAccount).filter(DriveAccount.is_connected == True).all()
    results = []
    with ThreadPoolExecutor(max_workers=len(accounts) or 1) as executor:
        futures = {executor.submit(get_storage_quota, acc): acc for acc in accounts}
        for future in as_completed(futures):
            results.append(future.result())
    return sorted(results, key=lambda x: x["account_index"])


def pick_best_account(db: Session) -> Optional[int]:
    quotas = get_all_quotas(db)
    connected = [q for q in quotas if q["is_connected"] and q["free"] > 0]
    if not connected:
        return None
    return max(connected, key=lambda q: q["free"])["account_index"]


def upload_file(account: DriveAccount, file_stream: io.IOBase, filename: str, mime_type: str, parent_folder_id: str | None = None) -> dict:
    service = build_service(account)
    media = MediaIoBaseUpload(file_stream, mimetype=mime_type, resumable=True)
    file_metadata: dict = {"name": filename}
    if parent_folder_id:
        file_metadata["parents"] = [parent_folder_id]
    result = _retry_on_rate_limit(
        service.files()
        .create(body=file_metadata, media_body=media, fields="id,size,mimeType,thumbnailLink,parents")
        .execute
    )
    parent = result.get("parents", [None])[0] if result.get("parents") else None
    return {
        "drive_file_id": result["id"],
        "size": int(result.get("size", 0)),
        "mime_type": result.get("mimeType", mime_type),
        "thumbnail_link": result.get("thumbnailLink"),
        "parent_drive_file_id": parent,
    }


def get_file_metadata(account: DriveAccount, drive_file_id: str) -> dict:
    service = build_service(account)
    result = _retry_on_rate_limit(
        service.files()
        .get(fileId=drive_file_id, fields="id,name,size,mimeType,thumbnailLink,parents")
        .execute
    )
    return result


def download_file(account: DriveAccount, drive_file_id: str) -> bytes:
    service = build_service(account)
    request = service.files().get_media(fileId=drive_file_id)
    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = _retry_on_rate_limit(downloader.next_chunk)
    buffer.seek(0)
    return buffer.read()


def rename_file(account: DriveAccount, drive_file_id: str, new_name: str) -> dict:
    service = build_service(account)
    result = _retry_on_rate_limit(
        service.files()
        .update(fileId=drive_file_id, body={"name": new_name}, fields="id,name,thumbnailLink")
        .execute
    )
    return result


def move_file(account: DriveAccount, drive_file_id: str, new_parent_id: str, old_parent_id: str | None = None) -> None:
    service = build_service(account)

    try:
        meta = service.files().get(fileId=drive_file_id, fields="id,parents").execute()
    except Exception:
        meta = {}

    current_parents = meta.get("parents", [])

    if current_parents:
        remove_parents = ",".join(current_parents)
    elif old_parent_id:
        remove_parents = old_parent_id
    else:
        try:
            root_meta = service.files().get(fileId="root", fields="id").execute()
            remove_parents = root_meta.get("id")
        except Exception:
            remove_parents = None

    if remove_parents:
        _retry_on_rate_limit(
            service.files()
            .update(
                fileId=drive_file_id,
                addParents=new_parent_id,
                removeParents=remove_parents,
                fields="id",
            )
            .execute
        )
    else:
        raise ValueError("Cannot determine current parent folder — file may be shared from another account and cannot be moved")


def delete_drive_file(account: DriveAccount, drive_file_id: str) -> None:
    service = build_service(account)
    _retry_on_rate_limit(service.files().delete(fileId=drive_file_id).execute)


def trash_drive_file(account: DriveAccount, drive_file_id: str) -> None:
    service = build_service(account)
    _retry_on_rate_limit(
        service.files().update(fileId=drive_file_id, body={"trashed": True}).execute
    )


def list_trash_files(account: DriveAccount) -> list[dict]:
    service = build_service(account)
    items = []
    page_token = None
    while True:
        kwargs: dict = {
            "q": "'me' in owners and trashed = true",
            "pageSize": 1000,
            "fields": "nextPageToken, files(id, name, size, mimeType, trashedTime)",
        }
        if page_token:
            kwargs["pageToken"] = page_token
        result = _retry_on_rate_limit(service.files().list(**kwargs).execute)
        for f in result.get("files", []):
            items.append({
                "drive_file_id": f["id"],
                "file_name": f.get("name", ""),
                "account_index": account.account_index,
                "size": int(f.get("size") or 0),
                "mime_type": f.get("mimeType"),
                "trashed_at": f.get("trashedTime", ""),
            })
        page_token = result.get("nextPageToken")
        if not page_token:
            break
    return items


def restore_file(account: DriveAccount, drive_file_id: str) -> None:
    service = build_service(account)
    _retry_on_rate_limit(
        service.files().update(fileId=drive_file_id, body={"trashed": False}).execute
    )


def share_file(account: DriveAccount, drive_file_id: str) -> str:
    """Makes file readable by anyone with the link. Returns the shareable URL."""
    service = build_service(account)
    _retry_on_rate_limit(
        service.permissions().create(
            fileId=drive_file_id,
            body={"type": "anyone", "role": "reader"},
            fields="id",
        ).execute
    )
    meta = _retry_on_rate_limit(
        service.files().get(fileId=drive_file_id, fields="webViewLink").execute
    )
    return meta.get("webViewLink") or f"https://drive.google.com/file/d/{drive_file_id}/view?usp=sharing"


def unshare_file(account: DriveAccount, drive_file_id: str) -> None:
    """Removes public sharing (anyone with link) permission."""
    service = build_service(account)
    perms = _retry_on_rate_limit(
        service.permissions().list(fileId=drive_file_id, fields="permissions(id,type)").execute
    )
    anyone_id = next(
        (p["id"] for p in perms.get("permissions", []) if p.get("type") == "anyone"),
        None,
    )
    if anyone_id:
        _retry_on_rate_limit(
            service.permissions().delete(fileId=drive_file_id, permissionId=anyone_id).execute
        )


def get_or_create_profile_folder(account: DriveAccount) -> str:
    """Get the DrivePool internal folder ID, creating it if needed."""
    service = build_service(account)
    # Search for existing folder
    query = f"name='{PROFILE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    result = _retry_on_rate_limit(
        service.files().list(q=query, fields="files(id)").execute
    )
    existing = result.get("files", [])
    if existing:
        return existing[0]["id"]
    # Create it
    folder = _retry_on_rate_limit(
        service.files()
        .create(
            body={"name": PROFILE_FOLDER_NAME, "mimeType": "application/vnd.google-apps.folder"},
            fields="id",
        )
        .execute
    )
    return folder["id"]


def _parse_drive_time(s: str | None):
    from datetime import datetime
    if not s:
        return datetime.utcnow()
    return datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)


def list_shared_files(account: DriveAccount) -> list[dict]:
    service = build_service(account)
    items = []
    page_token = None
    while True:
        kwargs: dict = {
            "q": "not 'me' in owners and trashed = false",
            "pageSize": 1000,
            "fields": "nextPageToken, files(id, name, size, mimeType, createdTime, owners)",
        }
        if page_token:
            kwargs["pageToken"] = page_token
        result = _retry_on_rate_limit(service.files().list(**kwargs).execute)
        for f in result.get("files", []):
            owner = f.get("owners", [{}])[0].get("emailAddress") if f.get("owners") else None
            items.append({
                "drive_file_id": f["id"],
                "file_name": f.get("name", ""),
                "account_index": account.account_index,
                "size": int(f.get("size") or 0),
                "mime_type": f.get("mimeType"),
                "created_at": f.get("createdTime", ""),
                "shared_by": owner,
            })
        page_token = result.get("nextPageToken")
        if not page_token:
            break
    return items


def remove_shared_file(account: DriveAccount, drive_file_id: str) -> None:
    service = build_service(account)

    # Step 1: try full delete (succeeds if we are the owner)
    try:
        _retry_on_rate_limit(service.files().delete(fileId=drive_file_id).execute)
        logger.info("remove_shared_file: deleted file %s (owner)", drive_file_id)
        return
    except HttpError as e:
        logger.info("remove_shared_file: files.delete gave %s for %s, trying fallbacks", e.resp.status, drive_file_id)
        if e.resp.status not in (403, 404):
            raise

    # Step 2: trash it (succeeds for editors who are not the owner)
    try:
        _retry_on_rate_limit(
            service.files().update(fileId=drive_file_id, body={"trashed": True}).execute
        )
        logger.info("remove_shared_file: trashed file %s", drive_file_id)
        return
    except HttpError as e:
        logger.info("remove_shared_file: files.update(trashed) gave %s for %s", e.resp.status, drive_file_id)
        if e.resp.status not in (403,):
            raise

    # Step 3: delete our own permission directly using our permissionId from about().
    # Bypasses permissions.list which is blocked when the owner restricts visibility.
    try:
        about = _retry_on_rate_limit(service.about().get(fields="user(permissionId)").execute)
        user_perm_id = about["user"]["permissionId"]
        _retry_on_rate_limit(
            service.permissions().delete(fileId=drive_file_id, permissionId=user_perm_id).execute
        )
        logger.info("remove_shared_file: removed own permission %s from %s", user_perm_id, drive_file_id)
        return
    except HttpError as e:
        if e.resp.status == 404:
            raise ValueError(
                "This file is shared via link — Google Drive's API does not allow removing "
                "link-shared files from 'Shared with me'. Use the Google Drive web app to remove it."
            )
        logger.exception("remove_shared_file: all fallbacks failed for %s", drive_file_id)
        raise


def list_shared_folder_children(account: DriveAccount, folder_id: str) -> list[dict]:
    service = build_service(account)
    items = []
    page_token = None
    while True:
        kwargs: dict = {
            "q": f"'{folder_id}' in parents and trashed = false",
            "pageSize": 1000,
            "fields": "nextPageToken, files(id, name, size, mimeType, createdTime, owners)",
        }
        if page_token:
            kwargs["pageToken"] = page_token
        result = _retry_on_rate_limit(service.files().list(**kwargs).execute)
        for f in result.get("files", []):
            owner = f.get("owners", [{}])[0].get("emailAddress") if f.get("owners") else None
            items.append({
                "drive_file_id": f["id"],
                "file_name": f.get("name", ""),
                "account_index": account.account_index,
                "size": int(f.get("size") or 0),
                "mime_type": f.get("mimeType"),
                "created_at": f.get("createdTime", ""),
                "shared_by": owner,
            })
        page_token = result.get("nextPageToken")
        if not page_token:
            break
    return sorted(items, key=lambda x: (x["mime_type"] != "application/vnd.google-apps.folder", x["file_name"].lower()))


def list_all_files(account: DriveAccount) -> list[dict]:
    service = build_service(account)
    items = []
    page_token = None
    while True:
        kwargs: dict = {
            "q": "'me' in owners and trashed = false",
            "pageSize": 1000,
            "fields": "nextPageToken, files(id, name, size, mimeType, thumbnailLink, createdTime, parents)",
        }
        if page_token:
            kwargs["pageToken"] = page_token
        result = _retry_on_rate_limit(service.files().list(**kwargs).execute)
        items.extend(result.get("files", []))
        page_token = result.get("nextPageToken")
        if not page_token:
            break
    return items


def sync_files_from_drives(db: Session) -> int:
    accounts = db.query(DriveAccount).filter(DriveAccount.is_connected == True).all()
    total = 0
    for account in accounts:
        try:
            drive_files = list_all_files(account)
            drive_ids = {df["id"] for df in drive_files}

            db.query(File).filter(
                File.account_index == account.account_index,
                File.drive_file_id.notin_(drive_ids),
            ).delete(synchronize_session=False)

            for df in drive_files:
                parent = df.get("parents", [None])[0] if df.get("parents") else None
                existing = (
                    db.query(File)
                    .filter(File.drive_file_id == df["id"], File.account_index == account.account_index)
                    .first()
                )
                if existing:
                    existing.file_name = df.get("name", existing.file_name)
                    existing.size = int(df.get("size") or 0)
                    existing.thumbnail_link = df.get("thumbnailLink")
                    existing.parent_drive_file_id = parent
                else:
                    db.add(File(
                        file_name=df.get("name", ""),
                        drive_file_id=df["id"],
                        account_index=account.account_index,
                        size=int(df.get("size") or 0),
                        mime_type=df.get("mimeType"),
                        thumbnail_link=df.get("thumbnailLink"),
                        parent_drive_file_id=parent,
                        created_at=_parse_drive_time(df.get("createdTime")),
                    ))
                total += 1
            db.commit()
        except Exception:
            db.rollback()
    return total
