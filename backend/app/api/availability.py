from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
from app.models.user import User, UserType
from app.models.vendor import Vendor
from app.models.professional import Professional
from app.models.availability import WeeklySchedule, TimeBlocker
from app.schemas.availability import (
    WeeklyScheduleResponse,
    WeeklyScheduleUpdate,
    TimeBlockerCreate,
    TimeBlockerResponse,
    AvailabilityResponse
)
from app.auth import get_current_user
from app.availability_utils import calculate_available_slots, initialize_weekly_schedule

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