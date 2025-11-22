from __future__ import annotations
from typing import Optional

from fastapi import Depends, HTTPException, Query, Path as PathParam, APIRouter
from sqlalchemy import select, func, asc, desc
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import UserORM, GearItemORM, CartItemORM
from ..schemas import User, GearItem, GearItemCreate, GearItemUpdate, PagedResponse, Category, UserInfo, PagedUsersResponse
from ..auth import get_current_admin


router = APIRouter(prefix="/api", tags=["Admin"])


@router.get(
    "/admin/gear",
    response_model=PagedResponse,
    summary="List All Gear Items for Admin Panel 🔒",
    description="""
Retrieve a paginated list of all audio gear items with advanced filtering and sorting for admin management. **Requires admin privileges.**
    """,
)
async def admin_list_gear(
    category: Category | None = Query(default=None, description="Filter by category"),
    q: Optional[str] = Query(default=None, description="Search in product name"),
    sort: Optional[str] = Query(default="name_asc", description="Sort by: name_asc, name_desc, price_asc, price_desc, rating_desc, id_asc, id_desc"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=1000, description="Items per page"),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> PagedResponse:
    # Build base query
    filters = []
    if category:
        filters.append(GearItemORM.category == category)

    query = select(GearItemORM)
    if filters:
        query = query.where(*filters)

    # Search
    q_norm = (q or "").strip().lower()
    if q_norm:
        query = query.where(func.lower(GearItemORM.name).like(f"%{q_norm}%"))

    # Sorting
    if sort == "name_desc":
        query = query.order_by(desc(func.lower(GearItemORM.name)))
    elif sort == "price_asc":
        query = query.order_by(asc(GearItemORM.price), asc(func.lower(GearItemORM.name)))
    elif sort == "price_desc":
        query = query.order_by(desc(GearItemORM.price), asc(func.lower(GearItemORM.name)))
    elif sort == "rating_desc":
        query = query.order_by(desc(GearItemORM.rating), asc(func.lower(GearItemORM.name)))
    elif sort == "id_asc":
        query = query.order_by(asc(GearItemORM.id))
    elif sort == "id_desc":
        query = query.order_by(desc(GearItemORM.id))
    else:  # name_asc (default)
        query = query.order_by(asc(func.lower(GearItemORM.name)))

    # Count total
    count_stmt = select(func.count(GearItemORM.id))
    if filters:
        count_stmt = count_stmt.where(*filters)
    if q_norm:
        count_stmt = count_stmt.where(func.lower(GearItemORM.name).like(f"%{q_norm}%"))
    total = db.execute(count_stmt).scalar_one()

    pages = max(1, (total + page_size - 1) // page_size)
    if page > pages:
        page = pages
    start = (page - 1) * page_size

    items = db.execute(query.offset(start).limit(page_size)).scalars().all()

    def to_schema(m: GearItemORM) -> GearItem:
        return GearItem(
            id=m.id,
            name=m.name,
            category=m.category,  # type: ignore
            brand=m.brand,
            price=m.price,
            in_stock=m.in_stock,
            rating=m.rating,
            description=m.description,
            image_url=m.image_url,
        )

    return PagedResponse(items=[to_schema(i) for i in items], total=total, page=page, page_size=page_size, pages=pages)


@router.get(
    "/admin/users",
    response_model=PagedUsersResponse,
    summary="List All Users 🔒",
    description="""
Retrieve a paginated list of all registered users with search and sorting capabilities. **Requires admin privileges.**
    """,
)
async def admin_list_users(
    q: Optional[str] = Query(default=None, description="Search in username"),
    sort: Optional[str] = Query(default="admin_first", description="Sort by: username_asc, username_desc, id_asc, id_desc, admin_first"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=1000, description="Items per page"),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> PagedUsersResponse:
    # Build base query
    query = select(UserORM)

    # Search
    q_norm = (q or "").strip().lower()
    if q_norm:
        query = query.where(func.lower(UserORM.username).like(f"%{q_norm}%"))

    # Sorting
    if sort == "username_desc":
        query = query.order_by(desc(func.lower(UserORM.username)))
    elif sort == "id_asc":
        query = query.order_by(asc(UserORM.id))
    elif sort == "id_desc":
        query = query.order_by(desc(UserORM.id))
    elif sort == "admin_first":
        # Administratorzy na górze sortowani po ID, potem zwykli użytkownicy sortowani po ID
        query = query.order_by(desc(UserORM.is_admin), asc(UserORM.id))
    else:  # username_asc
        query = query.order_by(asc(func.lower(UserORM.username)))

    # Count total
    count_stmt = select(func.count(UserORM.id))
    if q_norm:
        count_stmt = count_stmt.where(func.lower(UserORM.username).like(f"%{q_norm}%"))
    total = db.execute(count_stmt).scalar_one()

    pages = max(1, (total + page_size - 1) // page_size)
    if page > pages:
        page = pages
    start = (page - 1) * page_size

    users = db.execute(query.offset(start).limit(page_size)).scalars().all()

    user_items = [UserInfo(id=u.id, username=u.username, is_admin=u.is_admin) for u in users]

    return PagedUsersResponse(items=user_items, total=total, page=page, page_size=page_size, pages=pages)


@router.delete(
    "/admin/users/{user_id}",
    status_code=204,
    summary="Delete User 🔒",
    description="""
Permanently delete a user account from the system. **Requires admin privileges.**
    """,
)
async def admin_delete_user(
    user_id: int = PathParam(..., description="ID of the user to delete"),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Get the user to delete
    user_to_delete = db.execute(select(UserORM).where(UserORM.id == user_id)).scalar_one_or_none()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting yourself
    if user_to_delete.username == current_user.username:
        raise HTTPException(status_code=403, detail="Cannot delete your own account")
    
    # Prevent deleting the default admin account (safety measure)
    if user_to_delete.username == "admin" and user_to_delete.is_admin:
        raise HTTPException(status_code=403, detail="Cannot delete the default admin account")
    
    # Delete user's cart items first (foreign key constraint)
    cart_items = db.execute(select(CartItemORM).where(CartItemORM.user_id == user_id)).scalars().all()
    for item in cart_items:
        db.delete(item)
    
    # Delete the user
    db.delete(user_to_delete)
    db.commit()
    
    return


@router.post(
    "/gear",
    response_model=GearItem,
    status_code=201,
    summary="Create New Gear Item 🔒",
    description="""
Add a new audio gear item to the catalog. **Requires admin privileges.**
    """,
)
async def create_gear_item(payload: GearItemCreate, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    m = GearItemORM(**payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return GearItem(id=m.id, **payload.model_dump())


@router.patch(
    "/gear/{item_id}",
    response_model=GearItem,
    summary="Update Gear Item 🔒",
    description="""
Update an existing audio gear item. Only provided fields will be updated. **Requires admin privileges.**
    """,
)
async def update_gear_item(
    item_id: int = PathParam(..., description="ID of the gear item to update"),
    payload: GearItemUpdate = ...,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    m = db.execute(select(GearItemORM).where(GearItemORM.id == item_id)).scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return GearItem(
        id=m.id,
        name=m.name,
        category=m.category,  # type: ignore
        brand=m.brand,
        price=m.price,
        in_stock=m.in_stock,
        rating=m.rating,
        description=m.description,
        image_url=m.image_url,
    )


@router.delete(
    "/gear/{item_id}",
    status_code=204,
    summary="Delete Gear Item 🔒",
    description="""
Permanently delete an audio gear item from the catalog. **Requires admin privileges.**
    """,
)
async def delete_gear_item(
    item_id: int = PathParam(..., description="ID of the gear item to delete"),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    m = db.execute(select(GearItemORM).where(GearItemORM.id == item_id)).scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(m)
    db.commit()
    return
