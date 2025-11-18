from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from lib.database import get_db
from lib.models.service_category import ServiceCategory
from lib.schemas.service_category import ServiceCategoryResponse

router = APIRouter()

# NO ICONS AT ALL
HARDCODED_CATEGORIES = [
    {"name": "Hair", "slug": "hair"},
    {"name": "Nails", "slug": "nails"},
    {"name": "Facial", "slug": "facial"},
    {"name": "Makeup", "slug": "makeup"},
    {"name": "Massage", "slug": "massage"},
    {"name": "Waxing", "slug": "waxing"},
    {"name": "Eyelashes", "slug": "eyelashes"},
    {"name": "Eyebrows", "slug": "eyebrows"},
]

def ensure_categories_exist(db: Session):
    """Create hardcoded categories if they don't exist"""
    for cat_data in HARDCODED_CATEGORIES:
        existing = db.query(ServiceCategory).filter(
            ServiceCategory.slug == cat_data["slug"]
        ).first()
        
        if not existing:
            category = ServiceCategory(**cat_data)
            db.add(category)
    
    db.commit()

@router.get("/", response_model=List[ServiceCategoryResponse])
def get_all_categories(db: Session = Depends(get_db)):
    """Get all service categories"""
    ensure_categories_exist(db)
    categories = db.query(ServiceCategory).order_by(ServiceCategory.name).all()
    return categories
