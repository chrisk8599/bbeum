from datetime import datetime, timedelta, date, time
from typing import List
from sqlalchemy.orm import Session
from lib.models.availability import WeeklySchedule, TimeBlocker, DayOfWeek
from lib.models.service import Service
from lib.models.booking import Booking, BookingStatus

def get_day_of_week(date_obj: date) -> DayOfWeek:
    """Convert date to DayOfWeek enum"""
    days = [
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY, 
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
        DayOfWeek.SATURDAY,
        DayOfWeek.SUNDAY
    ]
    return days[date_obj.weekday()]

def combine_datetime(date_obj: date, time_obj: time) -> datetime:
    """Combine date and time into datetime"""
    return datetime.combine(date_obj, time_obj)
def calculate_available_slots(
    professional_id: int,
    service_id: int,
    target_date: date,
    db: Session
) -> List[dict]:
    """
    Calculate available time slots for a professional on a specific date
    
    Args:
        professional_id: Professional ID
        service_id: Service ID (to get duration)
        target_date: Date to check availability
        db: Database session
        
    Returns:
        List of available slots with start_time and end_time
    """
    
    # 1. Get service duration
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        return []
    
    service_duration = service.duration_minutes
    # REMOVED: buffer_minutes = 15
    
    # 2. Get weekly schedule for this day
    day_of_week = get_day_of_week(target_date)
    schedule = db.query(WeeklySchedule).filter(
        WeeklySchedule.professional_id == professional_id,
        WeeklySchedule.day_of_week == day_of_week
    ).first()
    
    # If no schedule or not available, return empty
    if not schedule or not schedule.is_available:
        return []
    
    # 3. Get working hours for the day
    work_start = combine_datetime(target_date, schedule.start_time)
    work_end = combine_datetime(target_date, schedule.end_time)
    
    # 4. Get blocked times for this date
    blockers = db.query(TimeBlocker).filter(
        TimeBlocker.professional_id == professional_id,
        TimeBlocker.date == target_date
    ).all()
    
    # 5. Check if entire day is blocked
    for blocker in blockers:
        if blocker.start_time is None and blocker.end_time is None:
            return []  # All-day block
    
    # 6. Get existing bookings for this date (not cancelled)
    bookings = db.query(Booking).filter(
        Booking.professional_id == professional_id,
        Booking.booking_date == target_date,
        Booking.status.notin_([BookingStatus.CANCELLED])
    ).all()
    
    # 7. Generate potential slots (no buffer between appointments)
    slots = []
    current_time = work_start
    
    # Booking must be able to complete within working hours
    while current_time + timedelta(minutes=service_duration) <= work_end:
        slot_end = current_time + timedelta(minutes=service_duration)
        
        # Check if this slot overlaps with any blocker
        is_blocked = False
        for blocker in blockers:
            if blocker.start_time and blocker.end_time:
                blocker_start = combine_datetime(target_date, blocker.start_time)
                blocker_end = combine_datetime(target_date, blocker.end_time)
                
                # Check for overlap
                if not (slot_end <= blocker_start or current_time >= blocker_end):
                    is_blocked = True
                    break
        
        # Check if this slot overlaps with any existing booking
        if not is_blocked:
            for booking in bookings:
                booking_start = combine_datetime(target_date, booking.start_time)
                booking_end = combine_datetime(target_date, booking.end_time)
                
                # Check for overlap
                if not (slot_end <= booking_start or current_time >= booking_end):
                    is_blocked = True
                    break
        
        if not is_blocked:
            slots.append({
                'start_time': current_time,
                'end_time': slot_end
            })
        
        # Move to next slot (every 15 minutes for slot generation)
        current_time += timedelta(minutes=15)
    
    return slots

def initialize_weekly_schedule(professional_id: int, db: Session):  # CHANGED: professional_id instead of vendor_id
    """
    Create default weekly schedule for new professional
    Default: Mon-Fri 9AM-5PM, Sat-Sun closed
    """
    default_schedule = [
        # Weekdays: 9am - 5pm
        (DayOfWeek.MONDAY, True, time(9, 0), time(17, 0)),
        (DayOfWeek.TUESDAY, True, time(9, 0), time(17, 0)),
        (DayOfWeek.WEDNESDAY, True, time(9, 0), time(17, 0)),
        (DayOfWeek.THURSDAY, True, time(9, 0), time(17, 0)),
        (DayOfWeek.FRIDAY, True, time(9, 0), time(17, 0)),
        # Weekend: Closed
        (DayOfWeek.SATURDAY, False, None, None),
        (DayOfWeek.SUNDAY, False, None, None),
    ]
    
    for day, is_available, start, end in default_schedule:
        schedule = WeeklySchedule(
            professional_id=professional_id,  # CHANGED
            day_of_week=day,
            is_available=is_available,
            start_time=start,
            end_time=end
        )
        db.add(schedule)
    
    db.commit()
