from __future__ import annotations
from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime, func, ForeignKey
from .db import Base

class UserORM(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

class GearItemORM(Base):
    __tablename__ = "gear_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    brand = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False)
    in_stock = Column(Boolean, default=True, nullable=False)
    rating = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

class CartItemORM(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    gear_item_id = Column(Integer, ForeignKey("gear_items.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
