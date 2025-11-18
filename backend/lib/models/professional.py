from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from lib.database import Base

class Professional(Base):
    __tablename__ = "professionals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False, index=True)
    
    # Professional details
    display_name = Column(String, nullable=False)  # Can be different from user.full_name
    bio = Column(Text, nullable=True)
    specialty = Column(String, nullable=True)  # e.g., "Hair Colorist", "Nail Artist"
    avatar_url = Column(String, nullable=True)
    calendar_color = Column(String, default='#3b82f6')
    
    # Stats
    rating = Column(Float, default=0.0)
    total_bookings = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_owner = Column(Boolean, default=False)  # True if this is the vendor themselves
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="professional_profile")
    vendor = relationship("Vendor", back_populates="professionals")
    services = relationship("Service", back_populates="professional", cascade="all, delete-orphan")
    weekly_schedule = relationship("WeeklySchedule", back_populates="professional", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="professional")
    reviews = relationship("Review", back_populates="professional")
