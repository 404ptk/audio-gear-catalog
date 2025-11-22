from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from fastapi import HTTPException

from sqlalchemy import select, func
from .db import engine, Base, SessionLocal
from .models import UserORM, GearItemORM

# Import routers and config
from .docs import API_METADATA, OPENAPI_TAGS
from .auth import router as auth_router, pwd_context
from .routes.catalog import router as catalog_router
from .routes.cart import router as cart_router
from .routes.admin import router as admin_router

# Create FastAPI app with metadata
app = FastAPI(
    **API_METADATA,
    openapi_tags=OPENAPI_TAGS,
)

# CORS for local frontend (Vite default port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(catalog_router)
app.include_router(cart_router)
app.include_router(admin_router)


# --- DB init & seed ---
@app.on_event("startup")
def on_startup():
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Seed admin user and demo items if DB is empty
    db = SessionLocal()
    try:
        # admin user
        admin = db.execute(select(UserORM).where(UserORM.username == "admin")).scalar_one_or_none()
        if not admin:
            db.add(UserORM(username="admin", hashed_password=pwd_context.hash("admin"), is_admin=True))
            db.commit()
        
        # Seed test users if they don't exist
        test_users = [
            {"username": "user1", "password": "password1", "is_admin": False},
            {"username": "user2", "password": "password2", "is_admin": False},
            {"username": "testuser", "password": "test123", "is_admin": False},
            {"username": "jankowalski", "password": "kowalski123", "is_admin": False},
            {"username": "annanowak", "password": "nowak456", "is_admin": False},
            {"username": "testadmin", "password": "admin123", "is_admin": True},
        ]
        
        for user_data in test_users:
            existing = db.execute(select(UserORM).where(UserORM.username == user_data["username"])).scalar_one_or_none()
            if not existing:
                db.add(UserORM(
                    username=user_data["username"],
                    hashed_password=pwd_context.hash(user_data["password"]),
                    is_admin=user_data["is_admin"]
                ))
        db.commit()
        
        # seed items if none
        items_count = db.execute(select(func.count(GearItemORM.id))).scalar_one()
        if not items_count:
            initial_items = [
                {"name": "Shure SM58", "category": "microphone", "brand": "Shure", "price": 429.0, "rating": 4.8, "description": "Dynamiczny mikrofon wokalny"},
                {"name": "Audio-Technica ATH-M50x", "category": "headphones", "brand": "Audio-Technica", "price": 649.0, "rating": 4.7, "description": "Zamknięte słuchawki studyjne"},
                {"name": "Focusrite Scarlett 2i2 3rd Gen", "category": "interface", "brand": "Focusrite", "price": 599.0, "rating": 4.6, "description": "Interfejs audio USB 2-wejścia/2-wyjścia"},
                {"name": "Behringer UMC22", "category": "interface", "brand": "Behringer", "price": 229.0, "rating": 4.3, "description": "Interfejs audio USB z przedwzmacniaczem Midas"},
                {"name": "Rode NT1 5th Gen", "category": "microphone", "brand": "Rode", "price": 1199.0, "rating": 4.7, "description": "Studyjny mikrofon pojemnościowy z ultra niskim szumem własnym"},
                {"name": "Sennheiser e835", "category": "microphone", "brand": "Sennheiser", "price": 389.0, "rating": 4.5, "description": "Dynamiczny mikrofon wokalny o charakterystyce kardioidalnej do sceny i prób"},
                {"name": "Audio-Technica AT2020", "category": "microphone", "brand": "Audio-Technica", "price": 499.0, "rating": 4.6, "description": "Przystępny cenowo mikrofon pojemnościowy z dużą membraną do domowych studiów"},
                {"name": "Shure SM7B", "category": "microphone", "brand": "Shure", "price": 1899.0, "rating": 4.9, "description": "Dynamiczny mikrofon nadawczy preferowany do wokalu i podcastingu"},
                {"name": "MOTU M2", "category": "interface", "brand": "MOTU", "price": 899.0, "rating": 4.8, "description": "Interfejs audio USB-C 2x2 z przetwornikami ESS i niskim opóźnieniem"},
                {"name": "Universal Audio Volt 2", "category": "interface", "brand": "Universal Audio", "price": 749.0, "rating": 4.6, "description": "Interfejs USB-C 2-wejścia/2-wyjścia z trybem przedwzmacniacza Vintage", "in_stock": False},
                {"name": "PreSonus AudioBox USB 96", "category": "interface", "brand": "PreSonus", "price": 399.0, "rating": 4.4, "description": "Kompaktowy interfejs 2x2 do 24-bit/96 kHz"},
                {"name": "Steinberg UR22C", "category": "interface", "brand": "Steinberg", "price": 699.0, "rating": 4.5, "description": "Interfejs USB 3.0 (USB-C) 2x2 z przedwzmacniaczami D-PRE"},
                {"name": "Beyerdynamic DT 770 Pro 80 Ohm", "category": "headphones", "brand": "Beyerdynamic", "price": 599.0, "rating": 4.8, "description": "Zamknięte słuchawki studyjne z silną izolacją"},
                {"name": "Sony MDR-7506", "category": "headphones", "brand": "Sony", "price": 449.0, "rating": 4.7, "description": "Klasyczne zamknięte słuchawki monitorowe"},
            ]
            db.add_all([GearItemORM(**it) for it in initial_items])
            db.commit()
    finally:
        db.close()


@app.get(
    "/api",
    tags=["General"],
    summary="API Root",
    description="Welcome endpoint providing basic API information and navigation links.",
    response_description="API welcome message with navigation hints",
)
def root():
    return {"message": "Audio Gear Catalog API. Go to /docs or /api/health"}


@app.get(
    "/api/health",
    tags=["General"],
    summary="Health Check",
    description="Simple health check endpoint to verify API availability. Returns 200 OK if service is running.",
    response_description="Health status indicator",
    responses={
        200: {
            "description": "API is healthy and operational",
            "content": {
                "application/json": {
                    "example": {"status": "ok"}
                }
            }
        }
    }
)
def health():
    return {"status": "ok"}


# --- SPA static frontend ---
# Serve built frontend (Vite `frontend/dist`) with history API fallback
_dist_dir = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if (_dist_dir.exists()):
    # Serve built assets under /assets (as Vite outputs)
    assets_dir = _dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse(str(_dist_dir / "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Do not override API, auth and docs/openapi routes
        blocked_prefixes = ("api", "auth", "docs", "redoc", "openapi.json", "static", "favicon.ico")
        if any(full_path == p or full_path.startswith(p + "/") for p in blocked_prefixes):
            raise HTTPException(status_code=404, detail="Not Found")
        index_path = _dist_dir / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        raise HTTPException(status_code=404, detail="Not Found")
