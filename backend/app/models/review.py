from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # CHANGED: Now links to professional instead of vendor
    professional_id = Column(Integer, ForeignKey("professionals.id"), nullable=False, index=True)
    
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    
    rating = Column(Integer, nullable=False)  # 1-5 stars
    review_text = Column(Text, nullable=True)  # Optional written review
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    booking = relationship("Booking", back_populates="review")
    customer = relationship("User", backref="reviews_written")
    professional = relationship("Professional", back_populates="reviews")
    service = relationship("Service", backref="service_reviews")