from __future__ import annotations
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Resolve SQLite DB path next to this app package
_BASE_DIR = Path(__file__).resolve().parent
_DB_PATH = _BASE_DIR / "app.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{_DB_PATH}"

# check_same_thread=False is required for SQLite to allow usage across threads
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
