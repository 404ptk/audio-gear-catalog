from __future__ import annotations
from pydantic import BaseModel
from typing import Literal, Optional

Category = Literal["microphone", "headphones", "interface"]

class GearItem(BaseModel):
    id: int
    name: str
    category: Category
    brand: str
    price: float
    in_stock: bool = True
    rating: Optional[float] = None
    description: Optional[str] = None
    # Optional image URL for displaying product photos
    image_url: Optional[str] = None

class GearItemCreate(BaseModel):
    name: str
    category: Category
    brand: str
    price: float
    in_stock: bool = True
    rating: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class GearItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[Category] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    in_stock: Optional[bool] = None
    rating: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class PagedResponse(BaseModel):
    items: list[GearItem]
    total: int
    page: int
    page_size: int
    pages: int

# --- Auth / Users ---
class UserBase(BaseModel):
    username: str
    is_admin: bool = False

class User(UserBase):
    id: Optional[int] = None

class UserInDB(UserBase):
    hashed_password: str

class UserInfo(BaseModel):
    """User information for admin listing"""
    id: int
    username: str
    is_admin: bool

class PagedUsersResponse(BaseModel):
    """Paginated response for user listing"""
    items: list[UserInfo]
    total: int
    page: int
    page_size: int
    pages: int

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None

# Registration payload
class RegisterRequest(BaseModel):
    username: str
    password: str

# --- Cart ---
class CartItemAdd(BaseModel):
    gear_item_id: int
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: int
    gear_item_id: int
    quantity: int
    gear_item: GearItem

class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total: float
