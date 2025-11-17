from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserType
from app.models.vendor import Vendor
from app.models.professional import Professional
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        phone=user_data.phone,
        user_type=user_data.user_type
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # If vendor, create vendor profile AND professional profile
    if user_data.user_type == UserType.VENDOR:
        # Create vendor (business account)
        vendor_profile = Vendor(
            user_id=new_user.id,
            business_name=user_data.full_name,  # Default to their name
            is_active=False,  # Not active until they complete profile
            pro_employee_limit=0  # Free tier: no additional employees
        )
        db.add(vendor_profile)
        db.commit()
        db.refresh(vendor_profile)
        
        # Create professional profile (vendor is first professional)
        professional_profile = Professional(
            user_id=new_user.id,
            vendor_id=vendor_profile.id,
            display_name=user_data.full_name,
            is_owner=True,  # Mark as owner
            is_active=True  # Professional is active immediately
        )
        db.add(professional_profile)
        db.commit()
    
    # Create access token
    access_token = create_access_token(data={"user_id": new_user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"user_id": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user