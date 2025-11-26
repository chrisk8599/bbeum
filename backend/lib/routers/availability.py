from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from lib.database import get_db
from lib.models.user import User, UserType
from lib.models.vendor import Vendor
from lib.models.professional import Professional
from lib.models.availability import WeeklySchedule, TimeBlocker
from lib.schemas.availability import (
    WeeklyScheduleResponse,
    WeeklyScheduleUpdate,
    TimeBlockerCreate,
    TimeBlockerResponse,
    AvailabilityResponse
)
from lib.auth import get_current_user
from lib.availability_utils import calculate_available_slots, initialize_weekly_schedule

router = APIRouter()

# ========== WEEKLY SCHEDULE ==========

# Get current user's weekly schedule (vendor/professional)
@router.get("/schedule/me", response_model=List[WeeklyScheduleResponse])
def get_my_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    schedules = db.query(WeeklySchedule).filter(
        WeeklySchedule.professional_id == professional.id
    ).all()
    
    # If no schedule exists, initialize default
    if not schedules:
        initialize_weekly_schedule(professional.id, db)
        schedules = db.query(WeeklySchedule).filter(
            WeeklySchedule.professional_id == professional.id
        ).all()
    
    return schedules

# Get professional's schedule (public)
@router.get("/schedule/professional/{professional_id}", response_model=List[WeeklyScheduleResponse])
def get_professional_schedule(professional_id: int, db: Session = Depends(get_db)):
    professional = db.query(Professional).filter(Professional.id == professional_id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    schedules = db.query(WeeklySchedule).filter(
        WeeklySchedule.professional_id == professional_id
    ).all()
    
    if not schedules:
        initialize_weekly_schedule(professional_id, db)
        schedules = db.query(WeeklySchedule).filter(
            WeeklySchedule.professional_id == professional_id
        ).all()
    
    return schedules

# Update schedule day
@router.put("/schedule/{schedule_id}", response_model=WeeklyScheduleResponse)
def update_schedule_day(
    schedule_id: int,
    schedule_data: WeeklyScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    schedule = db.query(WeeklySchedule).filter(WeeklySchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Check authorization
    if schedule.professional_id != professional.id:
        # Vendor can edit any professional's schedule in their business
        if not professional.is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
        schedule_professional = db.query(Professional).filter(Professional.id == schedule.professional_id).first()
        if not schedule_professional or schedule_professional.vendor_id != vendor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
    
    # Update fields
    update_data = schedule_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)
    
    db.commit()
    db.refresh(schedule)
    return schedule

# ========== TIME BLOCKERS ==========

# Get current user's time blockers
@router.get("/blockers/me", response_model=List[TimeBlockerResponse])
def get_my_blockers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    blockers = db.query(TimeBlocker).filter(
        TimeBlocker.professional_id == professional.id
    ).order_by(TimeBlocker.date).all()
    
    return blockers

# Get professional's time blockers (public)
@router.get("/blockers/professional/{professional_id}", response_model=List[TimeBlockerResponse])
def get_professional_blockers(professional_id: int, db: Session = Depends(get_db)):
    professional = db.query(Professional).filter(Professional.id == professional_id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    blockers = db.query(TimeBlocker).filter(
        TimeBlocker.professional_id == professional_id
    ).order_by(TimeBlocker.date).all()
    
    return blockers

# Create time blocker
@router.post("/blockers", response_model=List[TimeBlockerResponse], status_code=status.HTTP_201_CREATED)
def create_time_blocker(
    blocker_data: TimeBlockerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    # Handle date range
    start_date = blocker_data.start_date
    end_date = blocker_data.end_date if blocker_data.end_date else start_date
    
    created_blockers = []
    current_date = start_date
    
    while current_date <= end_date:
        blocker = TimeBlocker(
            professional_id=professional.id,
            date=current_date,
            start_time=blocker_data.start_time,
            end_time=blocker_data.end_time,
            reason=blocker_data.reason
        )
        db.add(blocker)
        created_blockers.append(blocker)
        
        # Move to next day
        from datetime import timedelta
        current_date += timedelta(days=1)
    
    db.commit()
    
    for blocker in created_blockers:
        db.refresh(blocker)
    
    return created_blockers

# Delete time blocker
@router.delete("/blockers/{blocker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_blocker(
    blocker_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    blocker = db.query(TimeBlocker).filter(TimeBlocker.id == blocker_id).first()
    if not blocker:
        raise HTTPException(status_code=404, detail="Time blocker not found")
    
    # Check authorization
    if blocker.professional_id != professional.id:
        if not professional.is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
        blocker_professional = db.query(Professional).filter(Professional.id == blocker.professional_id).first()
        if not blocker_professional or blocker_professional.vendor_id != vendor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
    
    db.delete(blocker)
    db.commit()
    return None

# ========== AVAILABILITY SLOTS ==========

# Get available slots for booking (public)
@router.get("/slots", response_model=AvailabilityResponse)
def get_available_slots(
    professional_id: int = Query(...),
    service_id: int = Query(...),
    date: date = Query(...),
    db: Session = Depends(get_db)
):
    """Get available time slots for a professional/service on a specific date"""
    professional = db.query(Professional).filter(Professional.id == professional_id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    slots = calculate_available_slots(
        professional_id=professional_id,
        service_id=service_id,
        target_date=date,
        db=db
    )
    
    return {
        "date": date,
        "professional_id": professional_id,
        "service_id": service_id,
        "slots": [{"start_time": slot['start_time'].time(), "end_time": slot['end_time'].time()} for slot in slots]
    }


# Add this NEW endpoint to backend/app/api/availability.py
# Place it after the existing /slots endpoint

from datetime import datetime, timedelta

@router.get("/check")
def check_time_availability(
    professional_id: int = Query(...),
    date: date = Query(...),
    time: str = Query(...),  # Format: "HH:MM" (e.g., "14:30")
    db: Session = Depends(get_db)
):
    """
    Check if a specific time is available (ignoring service duration)
    Returns true if the time slot is not blocked and not booked
    """
    professional = db.query(Professional).filter(Professional.id == professional_id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    # Parse time string
    try:
        hour, minute = map(int, time.split(':'))
        check_time = datetime.combine(date, datetime.min.time().replace(hour=hour, minute=minute))
    except:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")
    
    # 1. Get weekly schedule for this day
    from app.availability_utils import get_day_of_week
    day_of_week = get_day_of_week(date)
    schedule = db.query(WeeklySchedule).filter(
        WeeklySchedule.professional_id == professional_id,
        WeeklySchedule.day_of_week == day_of_week
    ).first()
    
    # Check if professional works this day
    if not schedule or not schedule.is_available:
        return {"available": False, "reason": "Professional not working this day"}
    
    # Check if time is within working hours
    work_start = datetime.combine(date, schedule.start_time)
    work_end = datetime.combine(date, schedule.end_time)
    
    if check_time < work_start or check_time >= work_end:
        return {"available": False, "reason": "Outside working hours"}
    
    # 2. Check for blockers (vacations, breaks)
    from app.models.booking import BookingStatus
    
    blockers = db.query(TimeBlocker).filter(
        TimeBlocker.professional_id == professional_id,
        TimeBlocker.date == date
    ).all()
    
    # Check if entire day is blocked
    for blocker in blockers:
        if blocker.start_time is None and blocker.end_time is None:
            return {"available": False, "reason": "Day blocked"}
    
    # Check if time falls within a blocker
    for blocker in blockers:
        if blocker.start_time and blocker.end_time:
            blocker_start = datetime.combine(date, blocker.start_time)
            blocker_end = datetime.combine(date, blocker.end_time)
            
            if blocker_start <= check_time < blocker_end:
                return {"available": False, "reason": "Time blocked"}
    
    # 3. Check for existing bookings (any booking that overlaps this time)
    bookings = db.query(Booking).filter(
        Booking.professional_id == professional_id,
        Booking.booking_date == date,
        Booking.status.notin_([BookingStatus.CANCELLED])
    ).all()
    
    for booking in bookings:
        booking_start = datetime.combine(date, booking.start_time)
        booking_end = datetime.combine(date, booking.end_time)
        
        # Check if check_time falls within this booking
        if booking_start <= check_time < booking_end:
            return {"available": False, "reason": "Already booked"}
    
    return {"available": True, "reason": None}


# Also add a vendor-level check
@router.get("/vendor/{vendor_id}/check")
def check_vendor_availability(
    vendor_id: int,
    date: date = Query(...),
    time: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Check if ANY professional at this vendor is available at the given time
    """
    # Get all professionals for this vendor
    professionals = db.query(Professional).filter(
        Professional.vendor_id == vendor_id
    ).all()
    
    if not professionals:
        return {
            "available": False,
            "reason": "No professionals found",
            "available_professionals": []
        }
    
    # Check each professional
    available_professionals = []
    for prof in professionals:
        result = check_time_availability(
            professional_id=prof.id,
            date=date,
            time=time,
            db=db
        )
        
        if result["available"]:
            available_professionals.append({
                "id": prof.id,
                "display_name": prof.display_name,
                "avatar_url": prof.avatar_url
            })
    
    return {
        "available": len(available_professionals) > 0,
        "available_count": len(available_professionals),
        "available_professionals": available_professionals
    }