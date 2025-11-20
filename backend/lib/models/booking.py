from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Time, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from lib.database import Base
import enum

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    
    # Customer info
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # CHANGED: Now links to professional instead of vendor
    professional_id = Column(Integer, ForeignKey("professionals.id"), nullable=False, index=True)
    
    # Service info
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    
    # Booking details
    booking_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Pricing
    price = Column(Float, nullable=False)  # Price at time of booking
    
    # Status
    status = Column(Enum(BookingStatus), default='pending', nullable=False)
    
    # Notes
    customer_notes = Column(String, nullable=True)
    cancellation_reason = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Relationships
    customer = relationship("User", backref="bookings")
    professional = relationship("Professional", back_populates="bookings")
    service = relationship("Service", backref="bookings")
    review = relationship("Review", back_populates="booking", uselist=False)
