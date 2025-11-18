from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time
from lib.models.availability import DayOfWeek

# ========== WEEKLY SCHEDULE ==========

class WeeklyScheduleUpdate(BaseModel):
    is_available: Optional[bool] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None

class WeeklyScheduleResponse(BaseModel):
    id: int
    professional_id: int  # CHANGED: now professional_id instead of vendor_id
    day_of_week: DayOfWeek
    is_available: bool
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    
    class Config:
        from_attributes = True

# ========== TIME BLOCKERS ==========

class TimeBlockerCreate(BaseModel):
    start_date: date
    end_date: Optional[date] = None  # If None, same as start_date
    start_time: Optional[time] = None  # If None, blocks all day
    end_time: Optional[time] = None
    reason: Optional[str] = None

class TimeBlockerResponse(BaseModel):
    id: int
    professional_id: int  # CHANGED
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    reason: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# ========== AVAILABILITY SLOTS ==========

class AvailabilitySlot(BaseModel):
    """Available time slot for booking"""
    start_time: time
    end_time: time

class AvailabilityResponse(BaseModel):
    """Available slots for a specific date"""
    date: date
    professional_id: int  # CHANGED
    service_id: int
    slots: List[AvailabilitySlot]
