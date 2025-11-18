from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from lib.database import get_db
from lib.models.user import User
from lib.models.vendor import Vendor
from lib.models.professional import Professional
from lib.models.service import Service
from lib.schemas.vendor import (
    VendorProfileSetup,
    VendorProfileUpdate,
    VendorResponse,
    VendorDetailResponse,
    VendorWithProfessionals,
    VendorListItem
)
from lib.schemas.professional import ProfessionalListItem
from lib.auth import get_current_vendor_user, get_current_user
from lib.cloudinary import upload_image, delete_image
import re

router = APIRouter()

# Get all active vendors (public)
@router.get("/", response_model=List[VendorListItem])
def get_vendors(
    location: Optional[str] = Query(None),
    category_slug: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all active vendors with optional filters:
    - location: Filter by location (partial match)
    - category_slug: Filter vendors who offer services in this category
    - search: Search in business name and bio
    """
    query = db.query(Vendor).filter(Vendor.is_active == True)
    
    # Location filter
    if location:
        query = query.filter(Vendor.location.ilike(f"%{location}%"))
    
    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Vendor.business_name.ilike(search_term)) | 
            (Vendor.bio.ilike(search_term))
        )
    
    # Category filter - vendors who have professionals with services in this category
    if category_slug:
        from lib.models.service_category import ServiceCategory
        query = query.join(Vendor.professionals).join(Professional.services).join(Service.category).filter(
            ServiceCategory.slug == category_slug,
            Professional.is_active == True,
            Service.is_active == True
        ).distinct()
    
    vendors = query.all()
    
    # Add avatar_url and total_professionals to response
    result = []
    for vendor in vendors:
        user = db.query(User).filter(User.id == vendor.user_id).first()
        result.append({
            "id": vendor.id,
            "business_name": vendor.business_name,
            "location": vendor.location,
            "rating": vendor.rating,
            "is_pro": vendor.is_pro,
            "avatar_url": user.avatar_url if user else None,
            "total_professionals": vendor.total_professionals
        })
    
    return result

# Get vendor by ID with professionals (public)
@router.get("/{vendor_id}", response_model=VendorWithProfessionals)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    user = db.query(User).filter(User.id == vendor.user_id).first()
    
    # Get active professionals
    professionals = db.query(Professional).filter(
        Professional.vendor_id == vendor_id,
        Professional.is_active == True
    ).all()
    
    # Format professionals for response
    prof_list = []
    for prof in professionals:
        prof_list.append({
            "id": prof.id,
            "display_name": prof.display_name,
            "specialty": prof.specialty,
            "avatar_url": prof.avatar_url,
            "rating": prof.rating,
            "is_owner": prof.is_owner
        })
    
    # Create response with professionals
    vendor_dict = {
        **vendor.__dict__,
        "avatar_url": user.avatar_url if user else None,
        "professionals": prof_list,
        "total_professionals": vendor.total_professionals,
        "can_add_professional": vendor.can_add_professional
    }
    
    return vendor_dict

# Get vendor detail with contact info (public)
@router.get("/{vendor_id}/detail", response_model=VendorDetailResponse)
def get_vendor_detail(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    user = db.query(User).filter(User.id == vendor.user_id).first()
    
    # Create response with user details
    vendor_dict = {
        **vendor.__dict__,
        "phone": user.phone if user else None,
        "email": user.email if user else None,
        "avatar_url": user.avatar_url if user else None
    }
    
    return vendor_dict

# Get current vendor's profile
@router.get("/me/profile", response_model=VendorResponse)
def get_my_profile(
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Add avatar_url from user
    vendor_dict = {
        **vendor.__dict__,
        "avatar_url": current_user.avatar_url
    }
    
    return vendor_dict

# Setup vendor profile (creates OR updates if empty profile exists)
@router.post("/me/profile", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def setup_profile(
    profile_data: VendorProfileSetup,
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    # Check if profile already exists
    existing = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    
    if existing:
        # If profile exists but is inactive (empty from registration), update it
        if not existing.is_active and not existing.bio:
            # Update existing empty profile
            existing.business_name = profile_data.business_name
            existing.bio = profile_data.bio
            existing.location = profile_data.location
            existing.is_active = True  # Activate the profile
            
            db.commit()
            db.refresh(existing)
            
            # Also update the owner professional's display name
            professional = db.query(Professional).filter(
                Professional.user_id == current_user.id,
                Professional.is_owner == True
            ).first()
          
            
            # FIXED: Return vendor object directly, not dict
            existing.avatar_url = current_user.avatar_url if hasattr(current_user, 'avatar_url') else None
            return existing
        else:
            # Profile is already set up
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Profile already exists. Use PUT to update."
            )
    
    # Create new profile (shouldn't happen due to registration, but just in case)
    vendor = Vendor(
        user_id=current_user.id,
        is_active=True,
        **profile_data.model_dump()
    )
    
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    
    # FIXED: Return vendor object directly, not dict
    vendor.avatar_url = current_user.avatar_url if hasattr(current_user, 'avatar_url') else None
    return vendor

# Update vendor profile
@router.put("/me/profile", response_model=VendorResponse)
def update_profile(
    profile_data: VendorProfileUpdate,
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Update only provided fields
    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vendor, field, value)
    
    db.commit()
    db.refresh(vendor)
    
    # Add avatar_url from user
    vendor_dict = {
        **vendor.__dict__,
        "avatar_url": current_user.avatar_url
    }
    
    return vendor_dict

# Upload avatar
@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Upload to Cloudinary
    try:
        contents = await file.read()
        result = upload_image(contents, folder=f"avatars/{current_user.id}")
        
        # Delete old avatar if exists
        if current_user.avatar_url:
            try:
                old_public_id = extract_public_id(current_user.avatar_url)
                if old_public_id:
                    delete_image(old_public_id)
            except:
                pass  # Continue even if old image delete fails
        
        # Update user's avatar_url
        current_user.avatar_url = result['secure_url']
        db.commit()
        
        return {
            "avatar_url": result['secure_url'],
            "message": "Avatar uploaded successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")

def extract_public_id(url: str) -> str:
    """Extract Cloudinary public_id from URL"""
    # Example URL: https://res.cloudinary.com/cloud_name/image/upload/v123456/avatars/user_id/image_id.jpg
    # Extract: avatars/user_id/image_id
    match = re.search(r'/upload/(?:v\d+/)?(.+)\.[^.]+$', url)
    if match:
        return match.group(1)
    return None
