from __future__ import annotations
from typing import Optional

from fastapi import Depends, HTTPException, Query, Path as PathParam, APIRouter
from sqlalchemy import select, func, asc, desc
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import GearItemORM
from ..schemas import GearItem, Category, PagedResponse


router = APIRouter(prefix="/api", tags=["Catalog"])


@router.get(
    "/categories",
    summary="List Available Categories",
    description="Retrieve all available product categories in the catalog. Use these values for filtering gear items.",
    response_description="List of available categories",
    responses={
        200: {
            "description": "Successful response with category list",
            "content": {
                "application/json": {
                    "example": ["microphone", "headphones", "interface"]
                }
            }
        }
    }
)
def list_categories() -> list[Category]:
    return ["microphone", "headphones", "interface"]


@router.get(
    "/gear",
    response_model=PagedResponse,
    summary="List Gear Items (with Search, Filter, Sort, Pagination)",
    description="""
Retrieve a paginated list of audio gear items with advanced filtering and sorting capabilities.

### Query Parameters

* **category** - Filter by product category (microphone, headphones, interface)
* **q** - Search query for product names (case-insensitive, partial match)
* **sort** - Sort results by:
  * `relevance` (default) - Best match for search query, alphabetical otherwise
  * `price_asc` - Price: Low to High
  * `price_desc` - Price: High to Low
  * `name_asc` - Alphabetical A-Z
  * `rating_desc` - Highest rated first
  * `in_stock` - In-stock items first
* **page** - Page number (starts at 1)
* **page_size** - Items per page (1-1000, default: 12)

### Examples

* List all microphones: `?category=microphone`
* Search for "Shure": `?q=shure`
* Top rated interfaces: `?category=interface&sort=rating_desc`
* Cheapest headphones: `?category=headphones&sort=price_asc`
    """,
    response_description="Paginated list of gear items with metadata",
    responses={
        200: {
            "description": "Successful response with gear items",
            "content": {
                "application/json": {
                    "example": {
                        "items": [
                            {
                                "id": 1,
                                "name": "Shure SM58",
                                "category": "microphone",
                                "brand": "Shure",
                                "price": 429.0,
                                "in_stock": True,
                                "rating": 4.8,
                                "description": "Dynamic vocal microphone",
                                "image_url": None
                            }
                        ],
                        "total": 14,
                        "page": 1,
                        "page_size": 12,
                        "pages": 2
                    }
                }
            }
        }
    }
)
def list_gear(
    category: Category | None = Query(default=None, description="Filter by category (microphone, headphones, interface)"),
    q: Optional[str] = Query(default=None, description="Search in product name (case-insensitive)"),
    sort: Optional[str] = Query(default="relevance", description="Sort by: relevance, price_asc, price_desc, name_asc, rating_desc, in_stock"),
    page: int = Query(default=1, ge=1, description="Page number (starting from 1)"),
    page_size: int = Query(default=12, ge=1, le=1000, description="Number of items per page"),
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
    if sort == "price_asc":
        query = query.order_by(asc(GearItemORM.price), asc(func.lower(GearItemORM.name)))
    elif sort == "price_desc":
        query = query.order_by(desc(GearItemORM.price), asc(func.lower(GearItemORM.name)))
    elif sort == "name_asc":
        query = query.order_by(asc(func.lower(GearItemORM.name)))
    elif sort == "rating_desc":
        query = query.order_by(desc(GearItemORM.rating.nulls_last()), asc(GearItemORM.price)) if hasattr(GearItemORM.rating, 'nulls_last') else query.order_by(desc(GearItemORM.rating))
    elif sort == "in_stock":
        query = query.order_by(asc(~GearItemORM.in_stock), asc(GearItemORM.price))
    else:  # relevance / default
        if q_norm:
            # Rank by position of match and then by name length
            query = query.order_by(asc(func.instr(func.lower(GearItemORM.name), q_norm)), asc(func.length(GearItemORM.name)))
        else:
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
    "/gear/{item_id}",
    response_model=GearItem,
    summary="Get Gear Item Details",
    description="Retrieve detailed information about a specific audio gear item by its ID.",
    response_description="Detailed gear item information",
    responses={
        200: {
            "description": "Successful response with gear details",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "name": "Shure SM58",
                        "category": "microphone",
                        "brand": "Shure",
                        "price": 429.0,
                        "in_stock": True,
                        "rating": 4.8,
                        "description": "Dynamic vocal microphone",
                        "image_url": None
                    }
                }
            }
        },
        404: {
            "description": "Gear item not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Item not found"}
                }
            }
        }
    }
)
def get_gear_item(
    item_id: int = PathParam(..., description="Unique identifier of the gear item"),
    db: Session = Depends(get_db)
) -> GearItem:
    m = db.execute(select(GearItemORM).where(GearItemORM.id == item_id)).scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Item not found")
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
