from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from googleapiclient.discovery import build as gbuild
from pydantic import BaseModel
from sqlalchemy.orm import Session

import config
from database import get_db
from models.models import DriveAccount
from services.auth_service import (
    create_access_token,
    encrypt_token,
    verify_pin,
    verify_token,
)
from services.drive_service import get_oauth_flow, sync_files_from_drives

router = APIRouter(prefix="/auth", tags=["auth"])

_pending_verifiers: dict[int, str] = {}


class LoginRequest(BaseModel):
    pin: str


@router.post("/login")
def login(body: LoginRequest, response: Response):
    if not verify_pin(body.pin):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid PIN")
    token = create_access_token({"sub": "dashboard"})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=86400,
    )
    return {"ok": True}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}


@router.get("/oauth/new")
def get_new_oauth_url(
    request: Request,
    db: Session = Depends(get_db),
    _=Depends(verify_token),
):
    # Remove any leftover email-less disconnected placeholders from previous attempts
    db.query(DriveAccount).filter(
        DriveAccount.is_connected == False,
        DriveAccount.email == None,
        DriveAccount.refresh_token == None,
    ).delete()
    db.commit()

    max_account = db.query(DriveAccount).order_by(DriveAccount.account_index.desc()).first()
    new_index = (max_account.account_index + 1) if max_account else 1

    placeholder = DriveAccount(account_index=new_index, is_connected=False)
    db.add(placeholder)
    db.commit()

    redirect_uri = str(request.base_url) + "api/auth/callback"
    flow = get_oauth_flow(redirect_uri)
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=str(new_index),
    )
    if flow.code_verifier:
        _pending_verifiers[new_index] = flow.code_verifier
    return {"auth_url": auth_url}


@router.get("/oauth/{account_index}")
def get_oauth_url(account_index: int, request: Request, _=Depends(verify_token)):
    redirect_uri = str(request.base_url) + "api/auth/callback"
    flow = get_oauth_flow(redirect_uri)
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=str(account_index),
    )
    if flow.code_verifier:
        _pending_verifiers[account_index] = flow.code_verifier
    return {"auth_url": auth_url}


@router.get("/callback")
def oauth_callback(
    code: str,
    state: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    account_index = int(state)
    redirect_uri = str(request.base_url) + "api/auth/callback"
    flow = get_oauth_flow(redirect_uri)
    code_verifier = _pending_verifiers.pop(account_index, None)
    if code_verifier:
        flow.code_verifier = code_verifier
    flow.fetch_token(code=code)
    creds = flow.credentials

    service = gbuild("drive", "v3", credentials=creds)
    about = service.about().get(fields="user").execute()
    email = about.get("user", {}).get("emailAddress", "")

    account = db.query(DriveAccount).filter(DriveAccount.account_index == account_index).first()
    if not account:
        account = DriveAccount(account_index=account_index)
        db.add(account)

    account.email = email
    account.refresh_token = encrypt_token(creds.refresh_token)
    account.is_connected = True
    db.commit()

    background_tasks.add_task(sync_files_from_drives, db)

    return Response(
        status_code=302,
        headers={"Location": f"{config.FRONTEND_URL}/dashboard/settings"},
    )
