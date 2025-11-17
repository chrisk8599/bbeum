# backend/app/booking_utils.py
"""
Helper utilities for booking operations
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.professional import Professional
from app.models.booking import Booking, BookingStatus

def update_professional_booking_count(professional_id: int, db: Session):
    """
    Recalculate and update professional's total booking count
    Only counts COMPLETED bookings
    """
    total_count = db.query(func.count(Booking.id)).filter(
        Booking.professional_id == professional_id,
        Booking.status == BookingStatus.COMPLETED
    ).scalar() or 0
    
    professional = db.query(Professional).filter(Professional.id == professional_id).first()
    if professional:
        professional.total_bookings = total_count
        db.commit()