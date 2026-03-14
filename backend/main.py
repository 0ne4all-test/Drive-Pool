from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

import config
from database import SessionLocal, engine
from models.models import Base
from routes import auth, accounts, files
from routes import profile as profile_router
from services.drive_service import sync_files_from_drives


def run_migrations():
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE files ADD COLUMN parent_drive_file_id TEXT",
        ]:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_migrations()
    db = SessionLocal()
    try:
        sync_files_from_drives(db)
    finally:
        db.close()
    yield


app = FastAPI(title="DrivePool API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(profile_router.router, prefix="/api")


@app.get("/active")
def active():
    return {"status": "active"}
