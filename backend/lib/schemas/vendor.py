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

    class Config:
        from_attributes = True

class VendorResponse(VendorBase):
    """Basic vendor response"""
    avatar_url: Optional[str] = None

class VendorWithProfessionals(VendorBase):
    """Vendor response with list of professionals"""
    avatar_url: Optional[str] = None
    professionals: List[ProfessionalListItem] = []
    total_professionals: int
    can_add_professional: bool

class VendorDetailResponse(VendorBase):
    """Vendor detail with contact info"""
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    email: str

class VendorListItem(BaseModel):
    """Minimal vendor info for browse page"""
    id: int
    business_name: str
    location: Optional[str] = None
    rating: float
    is_pro: bool
    avatar_url: Optional[str] = None
    total_professionals: int
    
    class Config:
        from_attributes = True
