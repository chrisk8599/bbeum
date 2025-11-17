from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time
from app.models.booking import BookingStatus

# ========== REQUEST MODELS ==========

class BookingCreate(BaseModel):
    professional_id: int  # CHANGED: now professional_id instead of vendor_id
    service_id: int
    booking_date: date
    start_time: time
    customer_notes: Optional[str] = None

class BookingUpdate(BaseModel):
    """Update booking - customer can edit notes, vendor can update status"""
    status: Optional[BookingStatus] = None
    customer_notes: Optional[str] = None

class BookingUpdateStatus(BaseModel):
    status: BookingStatus
    cancellation_reason: Optional[str] = None

class BookingCancelRequest(BaseModel):
    """Customer cancels booking"""
    reason: Optional[str] = None

# ========== RESPONSE MODELS ==========

class BookingCustomerInfo(BaseModel):
    """Customer info in booking"""
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    
    class Config:
        from_attributes = True

class BookingProfessionalInfo(BaseModel):
    """Professional info in booking"""
    id: int
    display_name: str
    avatar_url: Optional[str] = None
    vendor_business_name: str  # Include business name
    
    class Config:
        from_attributes = True

class BookingServiceInfo(BaseModel):
    """Service info in booking"""
    id: int
    name: str
    duration_minutes: int
    
    class Config:
        from_attributes = True

class BookingResponse(BaseModel):
    id: int
    customer_id: int
    professional_id: int  # CHANGED
    service_id: int
    booking_date: date
    start_time: time
    end_time: time
    price: float
    status: BookingStatus
    customer_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    
    # Related info
    customer: BookingCustomerInfo
    professional: BookingProfessionalInfo  # CHANGED
    service: BookingServiceInfo
    
    # Review status
    has_review: bool = False
    
    class Config:
        from_attributes = True

class BookingListItem(BaseModel):
    """Minimal booking info for lists"""
    id: int
    booking_date: date
    start_time: time
    status: BookingStatus
    service_name: str
    professional_name: str  # CHANGED
    customer_name: str
    price: float
    
    class Config:
        from_attributes = True

# ========== CALENDAR SCHEMAS ==========

class CalendarDaySchedule(BaseModel):
    """Working hours for a specific day"""
    is_available: bool
    start_time: Optional[time] = None
    end_time: Optional[time] = None

class CalendarWeeklySchedule(BaseModel):
    """Weekly schedule for calendar view"""
    monday: CalendarDaySchedule
    tuesday: CalendarDaySchedule
    wednesday: CalendarDaySchedule
    thursday: CalendarDaySchedule
    friday: CalendarDaySchedule
    saturday: CalendarDaySchedule
    sunday: CalendarDaySchedule

class CalendarTimeBlocker(BaseModel):
    """Time blocker for calendar"""
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    reason: Optional[str] = None

class CalendarBooking(BaseModel):
    """Booking for calendar display"""
    id: int
    customer_name: str
    service_name: str
    booking_date: date
    start_time: time
    end_time: time
    status: BookingStatus
    price: float

class CalendarProfessional(BaseModel):
    """Professional data for calendar"""
    professional_id: int
    professional_name: str
    calendar_color: str
    weekly_schedule: CalendarWeeklySchedule
    time_blockers: List[CalendarTimeBlocker]
    bookings: List[CalendarBooking]

class CalendarResponse(BaseModel):
    """Calendar view response"""
    start_date: date
    end_date: date
    view_type: str  # "week" or "month"
    professionals: List[CalendarProfessional]