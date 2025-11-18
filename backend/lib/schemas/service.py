from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ========== REQUEST MODELS ==========

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category_id: Optional[int] = None

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None
    category_id: Optional[int] = None

# ========== RESPONSE MODELS ==========

class ServiceImageResponse(BaseModel):
    id: int
    image_url: str
    order: int
    
    class Config:
        from_attributes = True

class ServiceCategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    
    class Config:
        from_attributes = True

class ServiceBase(BaseModel):
    id: int
    professional_id: int  # CHANGED: now professional_id instead of vendor_id
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ServiceResponse(ServiceBase):
    """Service with images and category"""
    images: List[ServiceImageResponse] = []
    category: Optional[ServiceCategoryResponse] = None

class ServiceWithProfessional(ServiceResponse):
    """Service with professional info (for vendor detail page)"""
    professional_name: str
    professional_avatar: Optional[str] = None

class ServiceListItem(BaseModel):
    """Minimal service info for lists"""
    id: int
    name: str
    price: float
    duration_minutes: int
    image_url: Optional[str] = None  # First image
    professional_name: str
    
    class Config:
        from_attributes = True
