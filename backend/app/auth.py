from __future__ import annotations
from typing import Optional, Union
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from .db import get_db, SessionLocal
from .models import UserORM
from .schemas import User, UserInDB, Token, RegisterRequest

# Auth configuration
SECRET_KEY = "dev-secret-change-me"  # replace in production or use env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Use pbkdf2_sha256 to avoid bcrypt backend issues on some platforms
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Multiple authentication schemes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)
http_bearer = HTTPBearer(auto_error=False)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    # Fetch from DB
    with SessionLocal() as db:
        user = db.execute(select(UserORM).where(UserORM.username == username)).scalar_one_or_none()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return UserInDB(username=user.username, is_admin=user.is_admin, hashed_password=user.hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return username if valid"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        return username
    except JWTError:
        return None


async def get_current_user(
    oauth2_token: Optional[str] = Depends(oauth2_scheme),
    http_auth: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try OAuth2 token first, then HTTP Bearer
    token = None
    if oauth2_token:
        token = oauth2_token
    elif http_auth:
        token = http_auth.credentials
    
    if not token:
        raise credentials_exception
    
    username = verify_token(token)
    if not username:
        raise credentials_exception
        
    with SessionLocal() as db:
        user_in_db = db.execute(select(UserORM).where(UserORM.username == username)).scalar_one_or_none()
        if user_in_db is None:
            raise credentials_exception
        return User(username=user_in_db.username, is_admin=user_in_db.is_admin)


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


@router.post(
    "/token",
    response_model=Token,
    summary="Login (Obtain JWT Token)",
    description="""
Authenticate a user and receive a JWT access token for subsequent requests.

### Default Admin Account
- **Username:** `admin`
- **Password:** `admin`

### Usage Options
**Option 1: Use username/password form (automatic)**
1. Enter credentials in the form
2. Click **Authorize** in Swagger UI
3. Use the username/password fields

**Option 2: Use token directly**
1. Get token from this endpoint
2. Click **Authorize** in Swagger UI  
3. Select "BearerAuth (http, Bearer)" 
4. Enter: `Bearer YOUR_TOKEN_HERE`
    """,
    response_description="JWT access token",
    responses={
        200: {
            "description": "Successful authentication",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer"
                    }
                }
            }
        },
        401: {
            "description": "Invalid credentials",
            "content": {
                "application/json": {
                    "example": {"detail": "Incorrect username or password"}
                }
            }
        }
    }
)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post(
    "/register",
    status_code=201,
    summary="Register New User",
    description="""
Create a new user account. New users are created with standard (non-admin) privileges.

### Validation Rules
* **Username:** 3-32 characters, no whitespace
* **Password:** 6-128 characters

### Notes
- Usernames are case-insensitive and must be unique
- Successful registration requires subsequent login via `/auth/token`
    """,
    response_description="Registration confirmation",
    responses={
        201: {
            "description": "User successfully registered",
            "content": {
                "application/json": {
                    "example": {"message": "registered"}
                }
            }
        },
        409: {
            "description": "Username already taken",
            "content": {
                "application/json": {
                    "example": {"detail": "Username already taken"}
                }
            }
        },
        422: {
            "description": "Validation error (invalid username or password format)",
            "content": {
                "application/json": {
                    "examples": {
                        "short_username": {
                            "summary": "Username too short",
                            "value": {"detail": "Username must be 3-32 characters"}
                        },
                        "whitespace": {
                            "summary": "Username contains whitespace",
                            "value": {"detail": "Username must not contain whitespace"}
                        },
                        "short_password": {
                            "summary": "Password too short",
                            "value": {"detail": "Password must be 6-128 characters"}
                        }
                    }
                }
            }
        }
    }
)
async def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    username = (payload.username or "").strip()
    password = payload.password or ""

    # Basic validation
    if len(username) < 3 or len(username) > 32:
        raise HTTPException(status_code=422, detail="Username must be 3-32 characters")
    if any(ch.isspace() for ch in username):
        raise HTTPException(status_code=422, detail="Username must not contain whitespace")
    if len(password) < 6 or len(password) > 128:
        raise HTTPException(status_code=422, detail="Password must be 6-128 characters")

    # Ensure unique username (case-insensitive)
    existing = db.execute(
        select(UserORM).where(func.lower(UserORM.username) == username.lower())
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    user = UserORM(username=username, hashed_password=pwd_context.hash(password), is_admin=False)
    db.add(user)
    db.commit()
    # No auto-login; return a simple confirmation
    return {"message": "registered"}
