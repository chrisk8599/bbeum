from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from lib.database import get_db
from lib.models.user import User, UserType
from lib.models.vendor import Vendor
from lib.models.professional import Professional
from lib.models.service import Service, ServiceImage
from lib.schemas.service import (
    ServiceCreate, 
    ServiceUpdate, 
    ServiceResponse,
    ServiceImageResponse
)
from lib.auth import get_current_user
from lib.cloudinary import upload_image, delete_image
import re

router = APIRouter()

# Get all services for a specific vendor (public) - includes all professionals
@router.get("/vendor/{vendor_id}", response_model=List[ServiceResponse])
def get_vendor_services(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Get all services from all active professionals at this vendor
    services = db.query(Service).join(Professional).filter(
        Professional.vendor_id == vendor_id,
        Professional.is_active == True,
        Service.is_active == True
    ).all()
    
    return services

# Get professional's services (public)
@router.get("/professional/{professional_id}", response_model=List[ServiceResponse])
def get_professional_services(professional_id: int, db: Session = Depends(get_db)):
    professional = db.query(Professional).filter(Professional.id == professional_id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    services = db.query(Service).filter(
        Service.professional_id == professional_id,
        Service.is_active == True
    ).all()
    
    return services

# Get current user's services (vendor or professional)
@router.get("/me", response_model=List[ServiceResponse])
def get_my_services(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type == UserType.VENDOR:
        # Vendor sees all services from all their professionals
        vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor profile not found")
        
        services = db.query(Service).join(Professional).filter(
            Professional.vendor_id == vendor.id
        ).all()
        
    elif current_user.user_type == UserType.PROFESSIONAL:
        # Professional sees only their own services
        professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if not professional:
            raise HTTPException(status_code=404, detail="Professional profile not found")
        
        services = db.query(Service).filter(
            Service.professional_id == professional.id
        ).all()
        
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors and professionals can access this endpoint"
        )
    
    return services

# Get single service
@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

# Create service
@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_data: ServiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get professional profile
    professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    # Create service linked to professional
    service = Service(
        professional_id=professional.id,
        **service_data.model_dump()
    )
    
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

# Update service
@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    service_data: ServiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    # Check authorization
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Allow if:
    # 1. Professional owns the service
    # 2. OR user is vendor (owner) of the professional
    if service.professional_id != professional.id:
        if not professional.is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this service"
            )
        # Vendor can edit any service in their business
        vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
        service_professional = db.query(Professional).filter(Professional.id == service.professional_id).first()
        if not service_professional or service_professional.vendor_id != vendor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this service"
            )
    
    # Update only provided fields
    update_data = service_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)
    
    db.commit()
    db.refresh(service)
    return service

# Delete service
@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Same authorization logic as update
    if service.professional_id != professional.id:
        if not professional.is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this service"
            )
        vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
        service_professional = db.query(Professional).filter(Professional.id == service.professional_id).first()
        if not service_professional or service_professional.vendor_id != vendor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this service"
            )
    
    # Delete service images from Cloudinary
    for image in service.images:
        try:
            public_id = extract_public_id(image.image_url)
            if public_id:
                delete_image(public_id)
        except:
            pass
    
    db.delete(service)
    db.commit()
    return None

# Upload service image
@router.post("/{service_id}/images", response_model=ServiceImageResponse)
async def upload_service_image(
    service_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check authorization
    if service.professional_id != professional.id:
        if not professional.is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
        service_professional = db.query(Professional).filter(Professional.id == service.professional_id).first()
        if not service_professional or service_professional.vendor_id != vendor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
    
    # Check image limit (3 for free, unlimited for PRO)
    vendor = db.query(Vendor).join(Professional).filter(
        Professional.id == service.professional_id
    ).first()
    
    current_image_count = len(service.images)
    if not vendor.is_pro and current_image_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Free tier limited to 3 images per service. Upgrade to PRO for unlimited images."
        )
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Upload to Cloudinary
    try:
        contents = await file.read()
        result = upload_image(contents, folder=f"services/{service_id}")
        
        # Create service image record
        service_image = ServiceImage(
            service_id=service_id,
            image_url=result['secure_url'],
            order=current_image_count
        )
        
        db.add(service_image)
        db.commit()
        db.refresh(service_image)
        
        return service_image
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

# Delete service image
@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service_image(
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    image = db.query(ServiceImage).filter(ServiceImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    service = db.query(Service).filter(Service.id == image.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check authorization
    if service.professional_id != professional.id:
        if not professional.is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
        service_professional = db.query(Professional).filter(Professional.id == service.professional_id).first()
        if not service_professional or service_professional.vendor_id != vendor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
    
    # Delete from Cloudinary
    try:
        public_id = extract_public_id(image.image_url)
        if public_id:
            delete_image(public_id)
    except:
        pass
    
    db.delete(image)
    db.commit()
    return None

def extract_public_id(url: str) -> str:
    """Extract Cloudinary public_id from URL"""
    match = re.search(r'/upload/(?:v\d+/)?(.+)\.[^.]+$', url)
    if match:
        return match.group(1)
    return None
