from sqlalchemy import Column, Integer, String, DateTime, Enum
from datetime import datetime
from lib.database import Base
import enum

class UserType(str, enum.Enum):
    CUSTOMER = "customer"
    VENDOR = "vendor"
    PROFESSIONAL = "professional"  # NEW: for employee accounts

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    user_type = Column(Enum(UserType), nullable=False)
    avatar_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
