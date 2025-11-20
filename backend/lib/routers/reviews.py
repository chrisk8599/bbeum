from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from lib.database import get_db
from lib.models.user import User, UserType
from lib.models.vendor import Vendor
from lib.models.professional import Professional
from lib.models.service import Service
from lib.models.booking import Booking, BookingStatus
from lib.models.review import Review
from lib.schemas.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    ReviewSummary,
    ReviewCustomerInfo,
    ReviewProfessionalInfo,
    ReviewServiceInfo
)
from lib.auth import get_current_user

router = APIRouter()

def update_professional_rating(professional_id: int, db: Session):
    """Recalculate and update professional's average rating"""
    avg_rating = db.query(func.avg(Review.rating)).filter(
        Review.professional_id == professional_id
    ).scalar()
    
    professional = db.query(Professional).filter(Professional.id == professional_id).first()
    if professional:
        professional.rating = round(avg_rating, 1) if avg_rating else 0.0
        db.commit()

def update_vendor_rating(vendor_id: int, db: Session):
    """Recalculate vendor's rating as average of all professionals"""
    # Get all professionals for this vendor
    professionals = db.query(Professional).filter(
        Professional.vendor_id == vendor_id,
        Professional.is_active == True
    ).all()
    
    if not professionals:
        return
    
    # Calculate average of all professional ratings
    total_rating = sum(p.rating for p in professionals)
    avg_rating = total_rating / len(professionals)
    
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if vendor:
        vendor.rating = round(avg_rating, 1)
        db.commit()

def populate_review_response(review: Review, db: Session) -> ReviewResponse:
    """Helper to populate review with related data"""
    customer = db.query(User).filter(User.id == review.customer_id).first()
    professional = db.query(Professional).filter(Professional.id == review.professional_id).first()
    service = db.query(Service).filter(Service.id == review.service_id).first()
    
    return ReviewResponse(
        id=review.id,
        booking_id=review.booking_id,
        customer_id=review.customer_id,
        professional_id=review.professional_id,
        service_id=review.service_id,
        rating=review.rating,
        review_text=review.review_text,
        created_at=review.created_at,
        updated_at=review.updated_at,
        customer=ReviewCustomerInfo(
            id=customer.id,
            full_name=customer.full_name,
            avatar_url=customer.avatar_url
        ) if customer else None,
        professional=ReviewProfessionalInfo(
            id=professional.id,
            display_name=professional.display_name,
            avatar_url=professional.avatar_url
        ) if professional else None,
        service=ReviewServiceInfo(
            id=service.id,
            name=service.name
        ) if service else None
    )

# Create review
@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only customers can create reviews
    if current_user.user_type != UserType.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can create reviews"
        )
    
    # Get booking
    booking = db.query(Booking).filter(Booking.id == review_data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify customer owns the booking
    if booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review your own bookings"
        )
    
    # Check booking is completed
    if booking.status != 'completed':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only review completed bookings"
        )
    
    # Check if review already exists
    existing_review = db.query(Review).filter(Review.booking_id == review_data.booking_id).first()
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This booking has already been reviewed"
        )
    
    # Create review
    review = Review(
        booking_id=review_data.booking_id,
        customer_id=current_user.id,
        professional_id=booking.professional_id,
        service_id=booking.service_id,
        rating=review_data.rating,
        review_text=review_data.review_text
    )
    
    db.add(review)
    db.commit()
    db.refresh(review)
    
    # Update professional's average rating
    update_professional_rating(booking.professional_id, db)
    
    # Update vendor's average rating (average of all professionals)
    professional = db.query(Professional).filter(Professional.id == booking.professional_id).first()
    if professional:
        update_vendor_rating(professional.vendor_id, db)
    
    return populate_review_response(review, db)

# Update review
@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can update reviews"
        )
    
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Verify customer owns the review
    if review.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own reviews"
        )
    
    # Update fields
    update_data = review_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)
    
    db.commit()
    db.refresh(review)
    
    # Recalculate ratings
    update_professional_rating(review.professional_id, db)
    professional = db.query(Professional).filter(Professional.id == review.professional_id).first()
    if professional:
        update_vendor_rating(professional.vendor_id, db)
    
    return populate_review_response(review, db)

# Get professional's reviews (public)
@router.get("/professional/{professional_id}", response_model=List[ReviewResponse])
def get_professional_reviews(professional_id: int, db: Session = Depends(get_db)):
    professional = db.query(Professional).filter(Professional.id == professional_id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    reviews = db.query(Review).filter(
        Review.professional_id == professional_id
    ).order_by(Review.created_at.desc()).all()
    
    return [populate_review_response(r, db) for r in reviews]

# Get vendor's reviews (public) - all professionals combined
@router.get("/vendor/{vendor_id}", response_model=List[ReviewResponse])
def get_vendor_reviews(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Get all reviews for all professionals at this vendor
    reviews = db.query(Review).join(Professional).filter(
        Professional.vendor_id == vendor_id,
        Professional.is_active == True
    ).order_by(Review.created_at.desc()).all()
    
    return [populate_review_response(r, db) for r in reviews]

# Get professional's rating summary (public)
@router.get("/professional/{professional_id}/summary", response_model=ReviewSummary)
def get_professional_rating_summary(professional_id: int, db: Session = Depends(get_db)):
    professional = db.query(Professional).filter(Professional.id == professional_id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    # Get all reviews
    reviews = db.query(Review).filter(Review.professional_id == professional_id).all()
    
    if not reviews:
        return ReviewSummary(
            average_rating=0.0,
            total_reviews=0,
            rating_distribution={5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        )
    
    # Calculate distribution
    distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for review in reviews:
        distribution[review.rating] += 1
    
    # Calculate average
    avg_rating = sum(r.rating for r in reviews) / len(reviews)
    
    return ReviewSummary(
        average_rating=round(avg_rating, 1),
        total_reviews=len(reviews),
        rating_distribution=distribution
    )

# Get vendor's rating summary (public) - combined all professionals
@router.get("/vendor/{vendor_id}/summary", response_model=ReviewSummary)
def get_vendor_rating_summary(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Get all reviews for all professionals at this vendor
    reviews = db.query(Review).join(Professional).filter(
        Professional.vendor_id == vendor_id,
        Professional.is_active == True
    ).all()
    
    if not reviews:
        return ReviewSummary(
            average_rating=0.0,
            total_reviews=0,
            rating_distribution={5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        )
    
    # Calculate distribution
    distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for review in reviews:
        distribution[review.rating] += 1
    
    # Calculate average
    avg_rating = sum(r.rating for r in reviews) / len(reviews)
    
    return ReviewSummary(
        average_rating=round(avg_rating, 1),
        total_reviews=len(reviews),
        rating_distribution=distribution
    )

# Get customer's reviews
@router.get("/my", response_model=List[ReviewResponse])
def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can access this endpoint"
        )
    
    reviews = db.query(Review).filter(
        Review.customer_id == current_user.id
    ).order_by(Review.created_at.desc()).all()
    
    return [populate_review_response(r, db) for r in reviews]

# Check if booking has been reviewed
@router.get("/booking/{booking_id}", response_model=ReviewResponse)
def get_booking_review(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if current_user.user_type == UserType.CUSTOMER:
        if booking.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.user_type in [UserType.VENDOR, UserType.PROFESSIONAL]:
        professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if not professional:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if booking.professional_id != professional.id:
            if not professional.is_owner:
                raise HTTPException(status_code=403, detail="Not authorized")
            booking_professional = db.query(Professional).filter(Professional.id == booking.professional_id).first()
            if not booking_professional or booking_professional.vendor_id != professional.vendor_id:
                raise HTTPException(status_code=403, detail="Not authorized")
    
    review = db.query(Review).filter(Review.booking_id == booking_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="No review found for this booking")
    
    return populate_review_response(review, db)
