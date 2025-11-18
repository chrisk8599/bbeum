from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ========== REQUEST MODELS ==========

class ProfessionalInviteCreate(BaseModel):
    """Vendor invites a new professional"""
    email: EmailStr
    display_name: str

class ProfessionalSignupViaInvite(BaseModel):
    """Professional accepts invite and creates account"""
    token: str
    password: str
    full_name: str
    phone: Optional[str] = None

class ProfessionalUpdate(BaseModel):
    """Professional updates their own profile"""
    display_name: Optional[str] = None
    bio: Optional[str] = None
    specialty: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfessionalUpdateByVendor(BaseModel):
    """Vendor updates professional's profile"""
    display_name: Optional[str] = None
    bio: Optional[str] = None
    specialty: Optional[str] = None
    is_active: Optional[bool] = None

# ========== RESPONSE MODELS ==========

class ProfessionalBase(BaseModel):
    id: int
    vendor_id: int
    display_name: str
    bio: Optional[str] = None
    specialty: Optional[str] = None
    avatar_url: Optional[str] = None
    rating: float
    total_bookings: int
    is_active: bool
    is_owner: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ProfessionalResponse(ProfessionalBase):
    """Public professional profile"""
    pass

class ProfessionalWithEmail(ProfessionalBase):
    """Professional profile with email (for vendor dashboard)"""
    email: str
    phone: Optional[str] = None

class ProfessionalInviteResponse(BaseModel):
    """Response after sending invite"""
    id: int
    email: str
    display_name: str
    token: str
    expires_at: datetime
    is_accepted: bool
    
    class Config:
        from_attributes = True

class ProfessionalListItem(BaseModel):
    """Minimal professional info for lists"""
    id: int
    display_name: str
    specialty: Optional[str] = None
    avatar_url: Optional[str] = None
    rating: float
    is_owner: bool
    
    class Config:
        from_attributes = True
