from __future__ import annotations

from fastapi import Depends, HTTPException, APIRouter
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import UserORM, GearItemORM, CartItemORM
from ..schemas import User, GearItem, CartItemAdd, CartItemUpdate, CartItemResponse, CartResponse
from ..auth import get_current_user


router = APIRouter(prefix="/api", tags=["User"])


@router.get(
    "/me",
    response_model=User,
    summary="Get Current User Profile",
    description="Retrieve the profile information of the currently authenticated user. Requires valid JWT token.",
    response_description="Current user profile",
    responses={
        200: {
            "description": "Successful response with user profile",
            "content": {
                "application/json": {
                    "example": {
                        "username": "admin",
                        "is_admin": True
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized - invalid or missing token",
            "content": {
                "application/json": {
                    "example": {"detail": "Could not validate credentials"}
                }
            }
        }
    }
)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get(
    "/cart",
    response_model=CartResponse,
    summary="Get User Cart",
    description="""
Retrieve the current user's shopping cart with all items, quantities, and total price. **Requires authentication.**

### Features
* Returns all items in the user's cart
* Includes full product details for each item
* Calculates total price automatically
* Empty cart returns empty items array with total 0.0

### Authorization
Requires a valid JWT token. The cart is user-specific and isolated per account.
    """,
    response_description="User's shopping cart with items and total price",
)
async def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get user_id
    user = db.execute(select(UserORM).where(UserORM.username == current_user.username)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get cart items with gear details
    cart_items = db.execute(
        select(CartItemORM).where(CartItemORM.user_id == user.id)
    ).scalars().all()
    
    items_response = []
    total = 0.0
    
    for cart_item in cart_items:
        gear = db.execute(select(GearItemORM).where(GearItemORM.id == cart_item.gear_item_id)).scalar_one_or_none()
        if gear:
            gear_schema = GearItem(
                id=gear.id,
                name=gear.name,
                category=gear.category,  # type: ignore
                brand=gear.brand,
                price=gear.price,
                in_stock=gear.in_stock,
                rating=gear.rating,
                description=gear.description,
                image_url=gear.image_url,
            )
            items_response.append(CartItemResponse(
                id=cart_item.id,
                gear_item_id=cart_item.gear_item_id,
                quantity=cart_item.quantity,
                gear_item=gear_schema
            ))
            total += gear.price * cart_item.quantity
    
    return CartResponse(items=items_response, total=total)


@router.post(
    "/cart",
    response_model=CartResponse,
    summary="Add Item to Cart",
    description="""
Add a gear item to the user's shopping cart. **Requires authentication.**

### Behavior
* If the item is **not** in cart - adds it with specified quantity
* If the item is **already** in cart - **increases** the quantity by the specified amount
* Returns the **updated complete cart** with all items and new total
    """,
)
async def add_to_cart(payload: CartItemAdd, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get user_id
    user = db.execute(select(UserORM).where(UserORM.username == current_user.username)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if gear item exists
    gear = db.execute(select(GearItemORM).where(GearItemORM.id == payload.gear_item_id)).scalar_one_or_none()
    if not gear:
        raise HTTPException(status_code=404, detail="Gear item not found")
    
    # Check if item already in cart
    existing = db.execute(
        select(CartItemORM).where(
            CartItemORM.user_id == user.id,
            CartItemORM.gear_item_id == payload.gear_item_id
        )
    ).scalar_one_or_none()
    
    if existing:
        existing.quantity += payload.quantity
    else:
        new_item = CartItemORM(
            user_id=user.id,
            gear_item_id=payload.gear_item_id,
            quantity=payload.quantity
        )
        db.add(new_item)
    
    db.commit()
    
    # Return updated cart
    return await get_cart(current_user, db)


@router.patch(
    "/cart/{cart_item_id}",
    response_model=CartResponse,
    summary="Update Cart Item Quantity",
    description="""
Update the quantity of a specific item in the cart. **Requires authentication.**

### Behavior
* **quantity > 0** - Updates the item to the new quantity (replaces, not adds)
* **quantity ≤ 0** - **Removes** the item from cart completely
    """,
)
async def update_cart_item(
    cart_item_id: int,
    payload: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user_id
    user = db.execute(select(UserORM).where(UserORM.username == current_user.username)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get cart item
    cart_item = db.execute(
        select(CartItemORM).where(
            CartItemORM.id == cart_item_id,
            CartItemORM.user_id == user.id
        )
    ).scalar_one_or_none()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    if payload.quantity <= 0:
        db.delete(cart_item)
    else:
        cart_item.quantity = payload.quantity
    
    db.commit()
    
    # Return updated cart
    return await get_cart(current_user, db)


@router.delete(
    "/cart/{cart_item_id}",
    response_model=CartResponse,
    summary="Remove Item from Cart",
    description="""
Remove a specific item completely from the cart. **Requires authentication.**

### Path Parameters
* `cart_item_id` - The ID of the cart item to remove (not the gear item ID!)
    """,
)
async def remove_from_cart(
    cart_item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user_id
    user = db.execute(select(UserORM).where(UserORM.username == current_user.username)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get cart item
    cart_item = db.execute(
        select(CartItemORM).where(
            CartItemORM.id == cart_item_id,
            CartItemORM.user_id == user.id
        )
    ).scalar_one_or_none()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    db.delete(cart_item)
    db.commit()
    
    # Return updated cart
    return await get_cart(current_user, db)


@router.delete(
    "/cart",
    response_model=CartResponse,
    summary="Clear Cart",
    description="""
Remove **all items** from the user's shopping cart. **Requires authentication.**

⚠️ **Warning:** This operation cannot be undone!
    """,
)
async def clear_cart_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get user_id
    user = db.execute(select(UserORM).where(UserORM.username == current_user.username)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete all cart items for user
    cart_items = db.execute(
        select(CartItemORM).where(CartItemORM.user_id == user.id)
    ).scalars().all()
    
    for item in cart_items:
        db.delete(item)
    
    db.commit()
    
    return CartResponse(items=[], total=0.0)
