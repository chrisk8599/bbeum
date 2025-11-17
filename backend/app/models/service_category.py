from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class ServiceCategory(Base):
    __tablename__ = "service_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # "Hair", "Nails", etc.
    slug = Column(String, unique=True, nullable=False)  # "hair", "nails"

    
    # Relationship
    services = relationship("Service", back_populates="category")