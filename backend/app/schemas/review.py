from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ========== REQUEST MODELS ==========

class ReviewCreate(BaseModel):
    booking_id: int
    rating: int  # 1-5
    review_text: Optional[str] = None

class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    review_text: Optional[str] = None

# ========== RESPONSE MODELS ==========

class ReviewCustomerInfo(BaseModel):
    """Customer info in review"""
    id: int
    full_name: str
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class ReviewProfessionalInfo(BaseModel):
    """Professional info in review"""
    id: int
    display_name: str
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class ReviewServiceInfo(BaseModel):
    """Service info in review"""
    id: int
    name: str
    
    class Config:
        from_attributes = True

class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    customer_id: int
    professional_id: int  # CHANGED: now professional_id instead of vendor_id
    service_id: int
    rating: int
    review_text: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Related info
    customer: ReviewCustomerInfo
    professional: ReviewProfessionalInfo  # CHANGED
    service: ReviewServiceInfo
    
    class Config:
        from_attributes = True

class ReviewSummary(BaseModel):
    """Summary of reviews for a professional or vendor"""
    average_rating: float
    total_reviews: int
    rating_distribution: dict  # {5: 20, 4: 10, 3: 5, 2: 2, 1: 1}

# Alias for backward compatibility
VendorRatingSummary = ReviewSummary
    
class ProfessionalReviewSummary(BaseModel):
    """Review summary for a specific professional"""
    professional_id: int
    professional_name: str
    average_rating: float
    total_reviews: int