from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from lib.database import get_db
from lib.models.user import User, UserType
from lib.models.vendor import Vendor
from lib.models.professional import Professional
from lib.models.professional_invite import ProfessionalInvite
from lib.schemas.professional import (
    ProfessionalInviteCreate,
    ProfessionalSignupViaInvite,
    ProfessionalUpdate,
    ProfessionalUpdateByVendor,
    ProfessionalResponse,
    ProfessionalWithEmail,
    ProfessionalInviteResponse
)
from lib.auth import get_password_hash, get_current_user, get_current_vendor_user, create_access_token
from lib.schemas.user import TokenResponse

router = APIRouter()

# ========== VENDOR ENDPOINTS (Team Management) ==========

@router.post("/invite", response_model=ProfessionalInviteResponse)
def invite_professional(
    invite_data: ProfessionalInviteCreate,
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    """Vendor invites a new professional to join their team"""
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Check if vendor can add more professionals (PRO feature)
    if not vendor.can_add_professional:
        if not vendor.is_pro:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Upgrade to PRO to add team members"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Employee limit reached ({vendor.pro_employee_limit}). Upgrade your plan."
            )
    
    # Check if email already registered
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Check if invite already sent
    existing_invite = db.query(ProfessionalInvite).filter(
        ProfessionalInvite.email == invite_data.email,
        ProfessionalInvite.vendor_id == vendor.id,
        ProfessionalInvite.is_accepted == False
    ).first()
    
    if existing_invite:
        # Expire old invite and create new one
        existing_invite.is_expired = True
        db.commit()
    
    # Create invite
    invite = ProfessionalInvite(
        vendor_id=vendor.id,
        email=invite_data.email,
        display_name=invite_data.display_name,
        invited_by_user_id=current_user.id
    )
    
    db.add(invite)
    db.commit()
    db.refresh(invite)
    
    # TODO: Send email with invite link
    # In production, send email with: https://yourdomain.com/accept-invite/{invite.token}
    
    return invite

@router.get("/me/team", response_model=List[ProfessionalWithEmail])
def get_my_team(
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    """Vendor gets all their professionals"""
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    professionals = db.query(Professional).filter(
        Professional.vendor_id == vendor.id
    ).all()
    
    # Add email and phone from user
    result = []
    for prof in professionals:
        user = db.query(User).filter(User.id == prof.user_id).first()
        prof_dict = {
            **prof.__dict__,
            "email": user.email if user else None,
            "phone": user.phone if user else None
        }
        result.append(prof_dict)
    
    return result

@router.put("/{professional_id}/vendor-update", response_model=ProfessionalResponse)
def vendor_update_professional(
    professional_id: int,
    update_data: ProfessionalUpdateByVendor,
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    """Vendor updates a professional's profile"""
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    professional = db.query(Professional).filter(
        Professional.id == professional_id,
        Professional.vendor_id == vendor.id
    ).first()
    
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(professional, field, value)
    
    db.commit()
    db.refresh(professional)
    
    return professional

@router.delete("/{professional_id}")
def delete_professional(
    professional_id: int,
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    """Vendor deletes a professional (cannot delete owner)"""
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    professional = db.query(Professional).filter(
        Professional.id == professional_id,
        Professional.vendor_id == vendor.id
    ).first()
    
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    if professional.is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete the owner"
        )
    
    # Delete professional (cascades to services, availability, etc.)
    db.delete(professional)
    db.commit()
    
    return {"message": "Professional deleted successfully"}

# ========== PROFESSIONAL ENDPOINTS (Self-Management) ==========

@router.get("/me", response_model=ProfessionalResponse)
def get_my_professional_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Professional gets their own profile"""
    if current_user.user_type not in [UserType.VENDOR, UserType.PROFESSIONAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors and professionals can access this"
        )
    
    professional = db.query(Professional).filter(
        Professional.user_id == current_user.id
    ).first()
    
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    return professional

@router.put("/me", response_model=ProfessionalResponse)
def update_my_professional_profile(
    update_data: ProfessionalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Professional updates their own profile"""
    if current_user.user_type not in [UserType.VENDOR, UserType.PROFESSIONAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors and professionals can access this"
        )
    
    professional = db.query(Professional).filter(
        Professional.user_id == current_user.id
    ).first()
    
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(professional, field, value)
    
    db.commit()
    db.refresh(professional)
    
    return professional

# ========== PUBLIC ENDPOINTS ==========

@router.get("/vendor/{vendor_id}", response_model=List[ProfessionalResponse])
def get_vendor_professionals(vendor_id: int, db: Session = Depends(get_db)):
    """Public: Get all active professionals at a vendor"""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    professionals = db.query(Professional).filter(
        Professional.vendor_id == vendor_id,
        Professional.is_active == True
    ).all()
    
    return professionals

@router.get("/{professional_id}", response_model=ProfessionalResponse)
def get_professional(professional_id: int, db: Session = Depends(get_db)):
    """Public: Get a specific professional"""
    professional = db.query(Professional).filter(
        Professional.id == professional_id,
        Professional.is_active == True
    ).first()
    
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    return professional

# ========== INVITE ACCEPTANCE ==========

@router.post("/accept-invite", response_model=TokenResponse)
def accept_invite(
    signup_data: ProfessionalSignupViaInvite,
    db: Session = Depends(get_db)
):
    """Professional accepts invite and creates account"""
    # Get invite
    invite = db.query(ProfessionalInvite).filter(
        ProfessionalInvite.token == signup_data.token
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if not invite.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite is expired or already used"
        )
    
    # Check if email already registered
    existing_user = db.query(User).filter(User.email == invite.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user account
    hashed_password = get_password_hash(signup_data.password)
    new_user = User(
        email=invite.email,
        password_hash=hashed_password,
        full_name=signup_data.full_name,
        phone=signup_data.phone,
        user_type=UserType.PROFESSIONAL
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create professional profile
    professional = Professional(
        user_id=new_user.id,
        vendor_id=invite.vendor_id,
        display_name=invite.display_name,
        is_owner=False,
        is_active=True
    )
    db.add(professional)
    db.commit()
    
    # Mark invite as accepted
    invite.is_accepted = True
    invite.accepted_at = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"user_id": new_user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }
