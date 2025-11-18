from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from lib.database import Base

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    business_name = Column(String, nullable=False)
    bio = Column(String)
    location = Column(String)
    
    # Rating is now calculated from all professionals
    rating = Column(Float, default=0.0)
    
    # PRO features
    is_pro = Column(Boolean, default=False)
    pro_employee_limit = Column(Integer, default=0)  # 0 = just owner, PRO gets more
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="vendor_profile")
    professionals = relationship("Professional", back_populates="vendor", cascade="all, delete-orphan")
    
    @property
    def total_professionals(self):
        """Count of active professionals including owner"""
        return len([p for p in self.professionals if p.is_active])
    
    @property
    def can_add_professional(self):
        """Check if vendor can add more professionals"""
        if not self.is_pro:
            return False  # Free plan can't add employees
        current_count = self.total_professionals
        # Owner doesn't count toward limit
        employee_count = current_count - 1  # Subtract owner
        return employee_count < self.pro_employee_limit
