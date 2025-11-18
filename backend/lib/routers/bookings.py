from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List,Optional
from datetime import datetime, timedelta,date
from lib.database import get_db
from lib.models.user import User, UserType
from lib.models.vendor import Vendor
from lib.models.professional import Professional
from lib.models.service import Service
from lib.models.booking import Booking, BookingStatus
from lib.models.availability import WeeklySchedule, TimeBlocker, DayOfWeek
from lib.schemas.booking import (
    BookingCreate,
    BookingResponse,
    BookingUpdate,
    BookingCancelRequest,
    BookingCustomerInfo,
    BookingProfessionalInfo,
    BookingServiceInfo,
    CalendarResponse,
    CalendarProfessional,
    CalendarWeeklySchedule,
    CalendarDaySchedule,
    CalendarTimeBlocker,
    CalendarBooking
)
from lib.auth import get_current_user
from lib.availability_utils import calculate_available_slots
from lib.booking_utils import update_professional_booking_count

router = APIRouter()

def populate_booking_response(booking: Booking, db: Session) -> BookingResponse:
    """Helper to populate booking with related data"""
    customer = db.query(User).filter(User.id == booking.customer_id).first()
    professional = db.query(Professional).filter(Professional.id == booking.professional_id).first()
    service = db.query(Service).filter(Service.id == booking.service_id).first()
    
    # Get vendor business name
    vendor = db.query(Vendor).filter(Vendor.id == professional.vendor_id).first() if professional else None
    
    # Check if booking has review
    has_review = booking.review is not None
    
    return BookingResponse(
        id=booking.id,
        customer_id=booking.customer_id,
        professional_id=booking.professional_id,
        service_id=booking.service_id,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        price=booking.price,
        status=booking.status,
        customer_notes=booking.customer_notes,
        cancellation_reason=booking.cancellation_reason,
        created_at=booking.created_at,
        confirmed_at=booking.confirmed_at,
        completed_at=booking.completed_at,
        cancelled_at=booking.cancelled_at,
        customer=BookingCustomerInfo(
            id=customer.id,
            full_name=customer.full_name,
            email=customer.email,
            phone=customer.phone
        ) if customer else None,
        professional=BookingProfessionalInfo(
            id=professional.id,
            display_name=professional.display_name,
            avatar_url=professional.avatar_url,
            vendor_business_name=vendor.business_name if vendor else "Unknown"
        ) if professional else None,
        service=BookingServiceInfo(
            id=service.id,
            name=service.name,
            duration_minutes=service.duration_minutes
        ) if service else None,
        has_review=has_review
    )

# Create booking
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only customers can create bookings
    if current_user.user_type != UserType.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can create bookings"
        )
    
    # Get service to calculate end time and price
    service = db.query(Service).filter(Service.id == booking_data.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Verify service belongs to the professional
    if service.professional_id != booking_data.professional_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service does not belong to this professional"
        )
    
    # Calculate end time
    start_datetime = datetime.combine(booking_data.booking_date, booking_data.start_time)
    end_datetime = start_datetime + timedelta(minutes=service.duration_minutes)
    end_time = end_datetime.time()
    
    # Check if slot is still available
    available_slots = calculate_available_slots(
        professional_id=booking_data.professional_id,
        service_id=booking_data.service_id,
        target_date=booking_data.booking_date,
        db=db
    )
    
    # Check if requested time is in available slots
    is_available = False
    for slot in available_slots:
        if slot['start_time'].time() == booking_data.start_time:
            is_available = True
            break
    
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This time slot is no longer available"
        )
    
    # Create booking with PENDING status
    booking = Booking(
        customer_id=current_user.id,
        professional_id=booking_data.professional_id,
        service_id=booking_data.service_id,
        booking_date=booking_data.booking_date,
        start_time=booking_data.start_time,
        end_time=end_time,
        price=service.price,
        customer_notes=booking_data.customer_notes,
        status=BookingStatus.PENDING
    )
    
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    return populate_booking_response(booking, db)

# ========== CALENDAR VIEWS ==========

def get_week_range(date_obj: date) -> tuple:
    """Get start and end of week (Monday to Sunday)"""
    # Get Monday of the week
    start = date_obj - timedelta(days=date_obj.weekday())
    # Get Sunday of the week
    end = start + timedelta(days=6)
    return start, end

def get_month_range(date_obj: date) -> tuple:
    """Get start and end of month"""
    start = date_obj.replace(day=1)
    # Get last day of month
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        end = start.replace(month=start.month + 1, day=1) - timedelta(days=1)
    return start, end

def format_professional_calendar(
    professional: Professional,
    start_date: date,
    end_date: date,
    db: Session
) -> CalendarProfessional:
    """Format professional data for calendar view"""
    
    # Get weekly schedule
    schedules = db.query(WeeklySchedule).filter(
        WeeklySchedule.professional_id == professional.id
    ).all()
    
    # Create schedule dict
    schedule_dict = {s.day_of_week.value: s for s in schedules}
    
    weekly_schedule = CalendarWeeklySchedule(
        monday=CalendarDaySchedule(
            is_available=schedule_dict.get('monday', None) and schedule_dict['monday'].is_available,
            start_time=schedule_dict.get('monday', None) and schedule_dict['monday'].start_time,
            end_time=schedule_dict.get('monday', None) and schedule_dict['monday'].end_time
        ) if 'monday' in schedule_dict else CalendarDaySchedule(is_available=False),
        tuesday=CalendarDaySchedule(
            is_available=schedule_dict.get('tuesday', None) and schedule_dict['tuesday'].is_available,
            start_time=schedule_dict.get('tuesday', None) and schedule_dict['tuesday'].start_time,
            end_time=schedule_dict.get('tuesday', None) and schedule_dict['tuesday'].end_time
        ) if 'tuesday' in schedule_dict else CalendarDaySchedule(is_available=False),
        wednesday=CalendarDaySchedule(
            is_available=schedule_dict.get('wednesday', None) and schedule_dict['wednesday'].is_available,
            start_time=schedule_dict.get('wednesday', None) and schedule_dict['wednesday'].start_time,
            end_time=schedule_dict.get('wednesday', None) and schedule_dict['wednesday'].end_time
        ) if 'wednesday' in schedule_dict else CalendarDaySchedule(is_available=False),
        thursday=CalendarDaySchedule(
            is_available=schedule_dict.get('thursday', None) and schedule_dict['thursday'].is_available,
            start_time=schedule_dict.get('thursday', None) and schedule_dict['thursday'].start_time,
            end_time=schedule_dict.get('thursday', None) and schedule_dict['thursday'].end_time
        ) if 'thursday' in schedule_dict else CalendarDaySchedule(is_available=False),
        friday=CalendarDaySchedule(
            is_available=schedule_dict.get('friday', None) and schedule_dict['friday'].is_available,
            start_time=schedule_dict.get('friday', None) and schedule_dict['friday'].start_time,
            end_time=schedule_dict.get('friday', None) and schedule_dict['friday'].end_time
        ) if 'friday' in schedule_dict else CalendarDaySchedule(is_available=False),
        saturday=CalendarDaySchedule(
            is_available=schedule_dict.get('saturday', None) and schedule_dict['saturday'].is_available,
            start_time=schedule_dict.get('saturday', None) and schedule_dict['saturday'].start_time,
            end_time=schedule_dict.get('saturday', None) and schedule_dict['saturday'].end_time
        ) if 'saturday' in schedule_dict else CalendarDaySchedule(is_available=False),
        sunday=CalendarDaySchedule(
            is_available=schedule_dict.get('sunday', None) and schedule_dict['sunday'].is_available,
            start_time=schedule_dict.get('sunday', None) and schedule_dict['sunday'].start_time,
            end_time=schedule_dict.get('sunday', None) and schedule_dict['sunday'].end_time
        ) if 'sunday' in schedule_dict else CalendarDaySchedule(is_available=False)
    )
    
    # Get time blockers in date range
    blockers = db.query(TimeBlocker).filter(
        TimeBlocker.professional_id == professional.id,
        TimeBlocker.date >= start_date,
        TimeBlocker.date <= end_date
    ).all()
    
    time_blockers = [
        CalendarTimeBlocker(
            date=b.date,
            start_time=b.start_time,
            end_time=b.end_time,
            reason=b.reason
        ) for b in blockers
    ]
    
    # Get bookings in date range
    bookings = db.query(Booking).filter(
        Booking.professional_id == professional.id,
        Booking.booking_date >= start_date,
        Booking.booking_date <= end_date,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
    ).all()
    
    calendar_bookings = []
    for booking in bookings:
        customer = db.query(User).filter(User.id == booking.customer_id).first()
        service = db.query(Service).filter(Service.id == booking.service_id).first()
        
        calendar_bookings.append(CalendarBooking(
            id=booking.id,
            customer_name=customer.full_name if customer else "Unknown",
            service_name=service.name if service else "Unknown",
            booking_date=booking.booking_date,
            start_time=booking.start_time,
            end_time=booking.end_time,
            status=booking.status,
            price=booking.price,
            customer_notes=booking.customer_notes
        ))
    
    return CalendarProfessional(
        professional_id=professional.id,
        professional_name=professional.display_name,
        calendar_color=professional.calendar_color,
        weekly_schedule=weekly_schedule,
        time_blockers=time_blockers,
        bookings=calendar_bookings
    )

# Get professional's calendar (own bookings)
@router.get("/calendar/me", response_model=CalendarResponse)
def get_my_calendar(
    view: str = Query("week", regex="^(week|month)$"),
    date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Professional's calendar view (own bookings only)"""
    if current_user.user_type not in [UserType.VENDOR, UserType.PROFESSIONAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors and professionals can access calendar"
        )
    
    professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
    if not professional:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    # Use provided date or today
    target_date = date or datetime.now().date()
    
    # Get date range based on view
    if view == "week":
        start_date, end_date = get_week_range(target_date)
    else:  # month
        start_date, end_date = get_month_range(target_date)
    
    # Format professional calendar
    professional_data = format_professional_calendar(professional, start_date, end_date, db)
    
    return CalendarResponse(
        start_date=start_date,
        end_date=end_date,
        view_type=view,
        professionals=[professional_data]
    )

# Get vendor's team calendar (all professionals, with filter)
@router.get("/calendar/vendor", response_model=CalendarResponse)
def get_vendor_calendar(
    view: str = Query("week", regex="^(week|month)$"),
    date: Optional[date] = Query(None),
    professional_ids: Optional[str] = Query(None),  # Comma-separated IDs
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vendor's team calendar (all professionals, filterable)"""
    if current_user.user_type != UserType.VENDOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors can access team calendar"
        )
    
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Use provided date or today
    target_date = date or datetime.now().date()
    
    # Get date range based on view
    if view == "week":
        start_date, end_date = get_week_range(target_date)
    else:  # month
        start_date, end_date = get_month_range(target_date)
    
    # Get professionals to display
    if professional_ids:
        # Filter by specific professionals
        id_list = [int(id.strip()) for id in professional_ids.split(',') if id.strip()]
        professionals = db.query(Professional).filter(
            Professional.vendor_id == vendor.id,
            Professional.id.in_(id_list),
            Professional.is_active == True
        ).all()
    else:
        # Show all professionals (default)
        professionals = db.query(Professional).filter(
            Professional.vendor_id == vendor.id,
            Professional.is_active == True
        ).all()
    
    # Format calendar data for each professional
    professionals_data = [
        format_professional_calendar(prof, start_date, end_date, db)
        for prof in professionals
    ]
    
    return CalendarResponse(
        start_date=start_date,
        end_date=end_date,
        view_type=view,
        professionals=professionals_data
    )

# Get customer's bookings
@router.get("/me/customer", response_model=List[BookingResponse])
def get_customer_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can access this endpoint"
        )
    
    bookings = db.query(Booking).filter(
        Booking.customer_id == current_user.id
    ).order_by(Booking.booking_date.desc(), Booking.start_time.desc()).all()
    
    return [populate_booking_response(b, db) for b in bookings]

# Get professional's bookings (vendor or professional can access)
@router.get("/me/professional", response_model=List[BookingResponse])
def get_professional_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type == UserType.VENDOR:
        # Vendor sees all bookings for all their professionals
        vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor profile not found")
        
        bookings = db.query(Booking).join(Professional).filter(
            Professional.vendor_id == vendor.id
        ).order_by(Booking.booking_date.desc(), Booking.start_time.desc()).all()
        
    elif current_user.user_type == UserType.PROFESSIONAL:
        # Professional sees only their own bookings
        professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if not professional:
            raise HTTPException(status_code=404, detail="Professional profile not found")
        
        bookings = db.query(Booking).filter(
            Booking.professional_id == professional.id
        ).order_by(Booking.booking_date.desc(), Booking.start_time.desc()).all()
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors and professionals can access this endpoint"
        )
    
    return [populate_booking_response(b, db) for b in bookings]

# Get single booking
@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if current_user.user_type == UserType.CUSTOMER:
        if booking.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.user_type in [UserType.VENDOR, UserType.PROFESSIONAL]:
        professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if not professional:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Check if booking belongs to this professional or their vendor
        if booking.professional_id != professional.id:
            if not professional.is_owner:
                raise HTTPException(status_code=403, detail="Not authorized")
            # Vendor can see all bookings in their business
            booking_professional = db.query(Professional).filter(Professional.id == booking.professional_id).first()
            if not booking_professional or booking_professional.vendor_id != professional.vendor_id:
                raise HTTPException(status_code=403, detail="Not authorized")
    
    return populate_booking_response(booking, db)

# Update booking
@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    booking_update: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Track old status before any changes
    old_status = booking.status
    
    # Check authorization and what can be updated
    if current_user.user_type in [UserType.VENDOR, UserType.PROFESSIONAL]:
        professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if not professional:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Check authorization
        if booking.professional_id != professional.id:
            if not professional.is_owner:
                raise HTTPException(status_code=403, detail="Not authorized")
            booking_professional = db.query(Professional).filter(Professional.id == booking.professional_id).first()
            if not booking_professional or booking_professional.vendor_id != professional.vendor_id:
                raise HTTPException(status_code=403, detail="Not authorized")
        
        # Professional/Vendor can update status
        if booking_update.status:
            booking.status = booking_update.status
            if booking_update.status == BookingStatus.CONFIRMED:
                booking.confirmed_at = datetime.utcnow()
            elif booking_update.status == BookingStatus.COMPLETED:
                booking.completed_at = datetime.utcnow()
    
    elif current_user.user_type == UserType.CUSTOMER:
        if booking.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Customer can only update notes and only if booking is pending
        if booking.status != BookingStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only edit pending bookings"
            )
        
        if booking_update.customer_notes is not None:
            booking.customer_notes = booking_update.customer_notes
    
    db.commit()
    db.refresh(booking)
    
    # Update booking count if status changed to completed
    if old_status != BookingStatus.COMPLETED and booking.status == BookingStatus.COMPLETED:
        update_professional_booking_count(booking.professional_id, db)
    
    return populate_booking_response(booking, db)

# Cancel booking
@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    cancel_data: BookingCancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if current_user.user_type == UserType.CUSTOMER:
        if booking.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.user_type in [UserType.VENDOR, UserType.PROFESSIONAL]:
        professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
        if not professional:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if booking.professional_id != professional.id:
            if not professional.is_owner:
                raise HTTPException(status_code=403, detail="Not authorized")
            booking_professional = db.query(Professional).filter(Professional.id == booking.professional_id).first()
            if not booking_professional or booking_professional.vendor_id != professional.vendor_id:
                raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if already cancelled or completed
    if booking.status in [BookingStatus.CANCELLED, BookingStatus.COMPLETED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel a {booking.status.value} booking"
        )
    
    booking.status = BookingStatus.CANCELLED
    booking.cancellation_reason = cancel_data.reason
    booking.cancelled_at = datetime.utcnow()
    
    db.commit()
    db.refresh(booking)
    
    return populate_booking_response(booking, db)

# Mark as no-show (vendor/professional only)
@router.post("/{booking_id}/no-show", response_model=BookingResponse)
def mark_no_show(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type not in [UserType.VENDOR, UserType.PROFESSIONAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors and professionals can mark no-shows"
        )
    
    professional = db.query(Professional).filter(Professional.user_id == current_user.id).first()
    if not professional:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking.professional_id != professional.id:
        if not professional.is_owner:
            raise HTTPException(status_code=403, detail="Not authorized")
        booking_professional = db.query(Professional).filter(Professional.id == booking.professional_id).first()
        if not booking_professional or booking_professional.vendor_id != professional.vendor_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only mark confirmed bookings as no-show"
        )
    
    booking.status = BookingStatus.NO_SHOW
    
    db.commit()
    db.refresh(booking)
    
    return populate_booking_response(booking, db)
