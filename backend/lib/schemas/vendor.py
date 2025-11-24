from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from lib.schemas.professional import ProfessionalListItem

# Request schemas
class VendorProfileSetup(BaseModel):
    business_name: str
    bio: Optional[str] = None
    location: str  # Google Places formatted address

class VendorProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None

# Response schemas
class VendorBase(BaseModel):
    id: int
    business_name: str
    bio: Optional[str] = None
    location: Optional[str] = None
    rating: float
    is_pro: bool
    is_active: bool
    created_at: datetime
    business_images: Optional[List[str]] = []

    class Config:
        from_attributes = True

class VendorResponse(VendorBase):
    """Basic vendor response"""
    avatar_url: Optional[str] = None
    total_reviews: Optional[int] = 0  # ✅ Make optional with default
    pro_employee_limit: Optional[int] = 0  # ✅ Make optional with default
    can_add_professional: Optional[bool] = False  # ✅ Make optional with default
    total_professionals: Optional[int] = 0  # ✅ Make optional with default

class VendorWithProfessionals(VendorBase):
    """Vendor response with list of professionals"""
    avatar_url: Optional[str] = None
    professionals: List[ProfessionalListItem] = []
    total_professionals: Optional[int] = 0  # ✅ Make optional with default
    can_add_professional: Optional[bool] = False  # ✅ Make optional with default
    total_reviews: Optional[int] = 0  # ✅ Make optional with default

class VendorDetailResponse(VendorBase):
    """Vendor detail with contact info"""
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    email: str
    total_reviews: Optional[int] = 0  # ✅ Make optional with default

class VendorListItem(BaseModel):
    """Minimal vendor info for browse page"""
    id: int
    business_name: str
    location: Optional[str] = None
    rating: float
    is_pro: bool
    avatar_url: Optional[str] = None
    total_professionals: Optional[int] = 0  # ✅ Make optional with default
    business_images: Optional[List[str]] = []
    
    class Config:
        from_attributes = True