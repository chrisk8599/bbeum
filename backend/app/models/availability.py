from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Time, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum

class DayOfWeek(str, enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

class WeeklySchedule(Base):
    __tablename__ = "weekly_schedules"

    id = Column(Integer, primary_key=True, index=True)
    
    # CHANGED: Now links to professional instead of vendor
    professional_id = Column(Integer, ForeignKey("professionals.id"), nullable=False, index=True)
    
    day_of_week = Column(Enum(DayOfWeek), nullable=False)  # Use enum, not integer
    is_available = Column(Boolean, default=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    professional = relationship("Professional", back_populates="weekly_schedule")

class TimeBlocker(Base):
    __tablename__ = "time_blockers"

    id = Column(Integer, primary_key=True, index=True)
    
    # CHANGED: Now links to professional instead of vendor
    professional_id = Column(Integer, ForeignKey("professionals.id"), nullable=False, index=True)
    
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    reason = Column(String, nullable=True)  # Optional note
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    professional = relationship("Professional", backref="time_blockers")