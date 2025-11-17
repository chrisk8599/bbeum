from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    
    # CHANGED: Now links to professional instead of vendor
    professional_id = Column(Integer, ForeignKey("professionals.id"), nullable=False, index=True)
    
    name = Column(String, nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    
    category_id = Column(Integer, ForeignKey("service_categories.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    professional = relationship("Professional", back_populates="services")
    category = relationship("ServiceCategory", back_populates="services")
    images = relationship("ServiceImage", back_populates="service", cascade="all, delete-orphan")

class ServiceImage(Base):
    __tablename__ = "service_images"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    image_url = Column(String, nullable=False)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    service = relationship("Service", back_populates="images")