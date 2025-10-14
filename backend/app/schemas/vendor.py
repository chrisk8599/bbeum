from pydantic import BaseModel
from datetime import datetime

class VendorProfileSetup(BaseModel):
    business_name: str
    bio: str | None = None
    location: str | None = None

class VendorProfileUpdate(BaseModel):
    business_name: str | None = None
    bio: str | None = None
    location: str | None = None
    is_active: bool | None = None

class VendorResponse(BaseModel):
    id: int
    user_id: int
    business_name: str
    bio: str | None
    location: str | None
    rating: float
    is_pro: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class VendorDetailResponse(VendorResponse):
    phone: str | None
    email: str
    
    class Config:
        from_attributes = True