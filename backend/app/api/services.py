from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.vendor import Vendor
from app.models.service import Service, ServiceImage
from app.schemas.service import (
    ServiceCreate, 
    ServiceUpdate, 
    ServiceResponse,
    ServiceImageResponse
)
from app.auth import get_current_vendor_user
from app.cloudinary import upload_image, delete_image
import re

router = APIRouter()

# Get all services for a specific vendor (public)
@router.get("/vendor/{vendor_id}", response_model=List[ServiceResponse])
def get_vendor_services(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    services = db.query(Service).filter(
        Service.vendor_id == vendor_id,
        Service.is_active == True
    ).all()
    
    return services

# Get vendor's own services (with inactive ones)
@router.get("/me", response_model=List[ServiceResponse])
def get_my_services(
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    services = db.query(Service).filter(Service.vendor_id == vendor.id).all()
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
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    service = Service(
        vendor_id=vendor.id,
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
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.vendor_id == vendor.id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
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
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.vendor_id == vendor.id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Delete images from Cloudinary and database
    images = db.query(ServiceImage).filter(ServiceImage.service_id == service_id).all()
    for img in images:
        # Extract public_id from URL and delete from Cloudinary
        try:
            public_id = extract_public_id(img.image_url)
            if public_id:
                delete_image(public_id)
        except:
            pass  # Continue even if Cloudinary delete fails
    
    # Delete images from database
    db.query(ServiceImage).filter(ServiceImage.service_id == service_id).delete()
    
    db.delete(service)
    db.commit()
    return None

# Upload image to service
@router.post("/{service_id}/images", response_model=ServiceImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_service_image(
    service_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.vendor_id == vendor.id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check image limit for free tier (3 images max)
    if not vendor.is_pro:
        image_count = db.query(ServiceImage).filter(ServiceImage.service_id == service_id).count()
        if image_count >= 3:
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
        result = upload_image(contents, folder=f"services/{vendor.id}")
        
        # Get next order number
        max_order = db.query(ServiceImage).filter(
            ServiceImage.service_id == service_id
        ).count()
        
        # Save to database
        image = ServiceImage(
            service_id=service_id,
            image_url=result['secure_url'],
            order=max_order
        )
        
        db.add(image)
        db.commit()
        db.refresh(image)
        return image
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

# Delete service image
@router.delete("/{service_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service_image(
    service_id: int,
    image_id: int,
    current_user: User = Depends(get_current_vendor_user),
    db: Session = Depends(get_db)
):
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.vendor_id == vendor.id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    image = db.query(ServiceImage).filter(
        ServiceImage.id == image_id,
        ServiceImage.service_id == service_id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete from Cloudinary
    try:
        public_id = extract_public_id(image.image_url)
        if public_id:
            delete_image(public_id)
    except:
        pass  # Continue even if Cloudinary delete fails
    
    # Delete from database
    db.delete(image)
    db.commit()
    return None

def extract_public_id(url: str) -> str:
    """Extract Cloudinary public_id from URL"""
    # Example URL: https://res.cloudinary.com/cloud_name/image/upload/v123456/services/vendor_id/image_id.jpg
    # Extract: services/vendor_id/image_id
    match = re.search(r'/upload/(?:v\d+/)?(.+)\.[^.]+$', url)
    if match:
        return match.group(1)
    return None