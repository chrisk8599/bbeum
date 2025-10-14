from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.vendor import Vendor
from app.models.service import Service
from app.schemas.vendor import (
    VendorProfileSetup,
    VendorProfileUpdate,
    VendorResponse,
    VendorDetailResponse
)
from app.auth import get_current_vendor_user, get_current_user

router = APIRouter()

# Get all active vendors (public)
@router.get("/", response_model=List[VendorResponse])
def get_vendors(db: Session = Depends(get_db)):
    vendors = db.query(Vendor).filter(Vendor.is_active == True).all()
    return vendors

# Get vendor by ID (public)
@router.get("/{vendor_id}", response_model=VendorDetailResponse)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    user = db.query(User).filter(User.id == vendor.user_id).first()
    
    # Create response with user details
    vendor_dict = {
        **vendor.__dict__,
        "phone": user.phone,
        "email": user.email
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
    return vendor

# Setup vendor profile (first time)
@router.post("/me/profile", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def setup_profile(
    profile_data: VendorProfileSetup,
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    # Check if profile already exists
    existing = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists. Use PUT to update."
        )
    
    vendor = Vendor(
        user_id=current_user.id,
        **profile_data.model_dump()
    )
    
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
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
    return vendor