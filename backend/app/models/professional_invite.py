from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from app.database import Base
import secrets

class ProfessionalInvite(Base):
    __tablename__ = "professional_invites"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    email = Column(String, nullable=False, index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    
    # Invite details
    invited_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    display_name = Column(String, nullable=False)  # Name for the professional
    
    # Status
    is_accepted = Column(Boolean, default=False)
    is_expired = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    accepted_at = Column(DateTime, nullable=True)
    
    # Relationships
    vendor = relationship("Vendor", backref="invites")
    invited_by = relationship("User", backref="sent_invites")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        if not self.expires_at:
            self.expires_at = datetime.utcnow() + timedelta(days=7)  # 7 day expiry
    
    @property
    def is_valid(self):
        """Check if invite is still valid"""
        return (
            not self.is_accepted 
            and not self.is_expired 
            and datetime.utcnow() < self.expires_at
        )