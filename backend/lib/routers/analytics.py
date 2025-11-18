# backend/app/api/analytics.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from datetime import datetime, date, timedelta
from typing import Optional
from lib.database import get_db
from lib.models.user import User
from lib.models.vendor import Vendor
from lib.models.booking import Booking, BookingStatus
from lib.models.professional import Professional
from lib.auth import get_current_user

router = APIRouter( tags=["analytics"])

@router.get("/revenue/summary")
def get_revenue_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overall revenue summary for vendor"""
    if current_user.user_type != 'vendor':
        raise HTTPException(status_code=403, detail="Only vendors can access analytics")
    
    # Get vendor from user
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Get all professional IDs for this vendor
    professional_ids = db.query(Professional.id).filter(
        Professional.vendor_id == vendor.id
    ).all()
    professional_ids = [p[0] for p in professional_ids]
    
    # Total completed bookings revenue
    total_revenue = db.query(func.sum(Booking.price)).filter(
        Booking.professional_id.in_(professional_ids),
        Booking.status == BookingStatus.COMPLETED
    ).scalar() or 0.0
    
    # Total pending revenue (confirmed but not completed)
    pending_revenue = db.query(func.sum(Booking.price)).filter(
        Booking.professional_id.in_(professional_ids),
        Booking.status == BookingStatus.CONFIRMED
    ).scalar() or 0.0
    
    # Total bookings count
    total_bookings = db.query(func.count(Booking.id)).filter(
        Booking.professional_id.in_(professional_ids),
        Booking.status == BookingStatus.COMPLETED
    ).scalar() or 0
    
    # Today's revenue
    today = date.today()
    today_revenue = db.query(func.sum(Booking.price)).filter(
        Booking.professional_id.in_(professional_ids),
        Booking.status == BookingStatus.COMPLETED,
        Booking.booking_date == today
    ).scalar() or 0.0
    
    # This week's revenue (Monday to Sunday)
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    week_revenue = db.query(func.sum(Booking.price)).filter(
        Booking.professional_id.in_(professional_ids),
        Booking.status == BookingStatus.COMPLETED,
        Booking.booking_date >= week_start,
        Booking.booking_date <= week_end
    ).scalar() or 0.0
    
    # This month's revenue
    month_start = date(today.year, today.month, 1)
    if today.month == 12:
        month_end = date(today.year + 1, 1, 1) - timedelta(days=1)
    else:
        month_end = date(today.year, today.month + 1, 1) - timedelta(days=1)
    
    month_revenue = db.query(func.sum(Booking.price)).filter(
        Booking.professional_id.in_(professional_ids),
        Booking.status == BookingStatus.COMPLETED,
        Booking.booking_date >= month_start,
        Booking.booking_date <= month_end
    ).scalar() or 0.0
    
    # Average booking value
    avg_booking_value = total_revenue / total_bookings if total_bookings > 0 else 0.0
    
    return {
        "total_revenue": round(total_revenue, 2),
        "pending_revenue": round(pending_revenue, 2),
        "total_bookings": total_bookings,
        "today_revenue": round(today_revenue, 2),
        "week_revenue": round(week_revenue, 2),
        "month_revenue": round(month_revenue, 2),
        "average_booking_value": round(avg_booking_value, 2),
        "period": {
            "today": today.isoformat(),
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "month_start": month_start.isoformat(),
            "month_end": month_end.isoformat()
        }
    }


@router.get("/revenue/daily")
def get_daily_revenue(
    start_date: date = Query(..., description="Start date for report"),
    end_date: date = Query(..., description="End date for report"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get daily revenue breakdown for date range"""
    if current_user.user_type != 'vendor':
        raise HTTPException(status_code=403, detail="Only vendors can access analytics")
    
    # Get vendor from user
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Get all professional IDs for this vendor
    professional_ids = db.query(Professional.id).filter(
        Professional.vendor_id == vendor.id
    ).all()
    professional_ids = [p[0] for p in professional_ids]
    
    # Query daily revenue
    daily_data = db.query(
        Booking.booking_date,
        func.sum(Booking.price).label('revenue'),
        func.count(Booking.id).label('bookings')
    ).filter(
        Booking.professional_id.in_(professional_ids),
        Booking.status == BookingStatus.COMPLETED,
        Booking.booking_date >= start_date,
        Booking.booking_date <= end_date
    ).group_by(Booking.booking_date).order_by(Booking.booking_date).all()
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "daily_breakdown": [
            {
                "date": day.booking_date.isoformat(),
                "revenue": round(day.revenue, 2),
                "bookings": day.bookings
            }
            for day in daily_data
        ],
        "total_revenue": round(sum(day.revenue for day in daily_data), 2),
        "total_bookings": sum(day.bookings for day in daily_data)
    }


@router.get("/revenue/weekly")
def get_weekly_revenue(
    weeks: int = Query(12, description="Number of weeks to include"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get weekly revenue for the past N weeks"""
    if current_user.user_type != 'vendor':
        raise HTTPException(status_code=403, detail="Only vendors can access analytics")
    
    # Get vendor from user
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Get all professional IDs for this vendor
    professional_ids = db.query(Professional.id).filter(
        Professional.vendor_id == vendor.id
    ).all()
    professional_ids = [p[0] for p in professional_ids]
    
    today = date.today()
    start_date = today - timedelta(weeks=weeks)
    
    # Get all completed bookings in range
    bookings = db.query(Booking).filter(
        Booking.professional_id.in_(professional_ids),
        Booking.status == BookingStatus.COMPLETED,
        Booking.booking_date >= start_date,
        Booking.booking_date <= today
    ).all()
    
    # Group by week
    weekly_data = {}
    for booking in bookings:
        # Get Monday of the week
        week_start = booking.booking_date - timedelta(days=booking.booking_date.weekday())
        week_key = week_start.isoformat()
        
        if week_key not in weekly_data:
            weekly_data[week_key] = {
                "week_start": week_key,
                "week_end": (week_start + timedelta(days=6)).isoformat(),
                "revenue": 0.0,
                "bookings": 0
            }
        
        weekly_data[week_key]["revenue"] += booking.price
        weekly_data[week_key]["bookings"] += 1
    
    # Sort by week
    weekly_breakdown = sorted(weekly_data.values(), key=lambda x: x["week_start"])
    
    # Round revenue
    for week in weekly_breakdown:
        week["revenue"] = round(week["revenue"], 2)
    
    return {
        "weeks_included": weeks,
        "start_date": start_date.isoformat(),
        "end_date": today.isoformat(),
        "weekly_breakdown": weekly_breakdown,
        "total_revenue": round(sum(week["revenue"] for week in weekly_breakdown), 2),
        "total_bookings": sum(week["bookings"] for week in weekly_breakdown)
    }


@router.get("/revenue/monthly")
def get_monthly_revenue(
    months: int = Query(12, description="Number of months to include"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get monthly revenue for the past N months"""
    if current_user.user_type != 'vendor':
        raise HTTPException(status_code=403, detail="Only vendors can access analytics")
    
    # Get vendor from user
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Get all professional IDs for this vendor
    professional_ids = db.query(Professional.id).filter(
        Professional.vendor_id == vendor.id
    ).all()
    professional_ids = [p[0] for p in professional_ids]
    
    # Query monthly revenue using SQL extract
    monthly_data = db.query(
        extract('year', Booking.booking_date).label('year'),
        extract('month', Booking.booking_date).label('month'),
        func.sum(Booking.price).label('revenue'),
        func.count(Booking.id).label('bookings')
    ).filter(
        Booking.professional_id.in_(professional_ids),
        Booking.status == BookingStatus.COMPLETED
    ).group_by(
        extract('year', Booking.booking_date),
        extract('month', Booking.booking_date)
    ).order_by(
        extract('year', Booking.booking_date).desc(),
        extract('month', Booking.booking_date).desc()
    ).limit(months).all()
    
    # Format response
    monthly_breakdown = [
        {
            "year": int(row.year),
            "month": int(row.month),
            "month_name": date(int(row.year), int(row.month), 1).strftime("%B %Y"),
            "revenue": round(row.revenue, 2),
            "bookings": row.bookings
        }
        for row in monthly_data
    ]
    
    # Reverse to show oldest first
    monthly_breakdown.reverse()
    
    return {
        "months_included": len(monthly_breakdown),
        "monthly_breakdown": monthly_breakdown,
        "total_revenue": round(sum(month["revenue"] for month in monthly_breakdown), 2),
        "total_bookings": sum(month["bookings"] for month in monthly_breakdown)
    }


@router.get("/revenue/by-professional")
def get_revenue_by_professional(
    start_date: Optional[date] = Query(None, description="Start date for report"),
    end_date: Optional[date] = Query(None, description="End date for report"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get revenue breakdown by professional/team member"""
    if current_user.user_type != 'vendor':
        raise HTTPException(status_code=403, detail="Only vendors can access analytics")
    
    # Get vendor from user
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Get all professionals for this vendor
    professionals = db.query(Professional).filter(
        Professional.vendor_id == vendor.id
    ).all()
    
    professional_revenue = []
    
    for prof in professionals:
        # Build base query - FIXED: use func.coalesce to handle None values
        query = db.query(
            func.coalesce(func.sum(Booking.price), 0.0).label('revenue'),
            func.count(Booking.id).label('bookings')
        ).filter(
            Booking.professional_id == prof.id,
            Booking.status == BookingStatus.COMPLETED
        )
        
        # Add date filters if provided
        if start_date:
            query = query.filter(Booking.booking_date >= start_date)
        if end_date:
            query = query.filter(Booking.booking_date <= end_date)
        
        result = query.first()
        
        professional_revenue.append({
            "professional_id": prof.id,
            "professional_name": prof.display_name,
            "is_owner": prof.is_owner,
            "revenue": round(float(result.revenue), 2),
            "bookings": int(result.bookings),
            "avatar_url": prof.avatar_url
        })
    
    # Sort by revenue descending
    professional_revenue.sort(key=lambda x: x["revenue"], reverse=True)
    
    return {
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
        "professional_breakdown": professional_revenue,
        "total_revenue": round(sum(p["revenue"] for p in professional_revenue), 2),
        "total_bookings": sum(p["bookings"] for p in professional_revenue)
    }


@router.get("/revenue/by-service")
def get_revenue_by_service(
    start_date: Optional[date] = Query(None, description="Start date for report"),
    end_date: Optional[date] = Query(None, description="End date for report"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get revenue breakdown by service type"""
    if current_user.user_type != 'vendor':
        raise HTTPException(status_code=403, detail="Only vendors can access analytics")
    
    from lib.models.service import Service
    
    # Get vendor from user
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Get all professional IDs for this vendor
    professional_ids = db.query(Professional.id).filter(
        Professional.vendor_id == vendor.id
    ).all()
    professional_ids = [p[0] for p in professional_ids]
    
    # Build query - FIXED: use proper aggregation
    query = db.query(
        Service.id,
        Service.name,
        func.sum(Booking.price).label('revenue'),
        func.count(Booking.id).label('bookings')
    ).join(
        Booking, Booking.service_id == Service.id
    ).filter(
        Booking.professional_id.in_(professional_ids),
        Booking.status == BookingStatus.COMPLETED
    )
    
    # Add date filters if provided
    if start_date:
        query = query.filter(Booking.booking_date >= start_date)
    if end_date:
        query = query.filter(Booking.booking_date <= end_date)
    
    # Group by service
    service_data = query.group_by(Service.id, Service.name).all()
    
    service_breakdown = [
        {
            "service_id": row.id,
            "service_name": row.name,
            "revenue": round(float(row.revenue), 2),
            "bookings": int(row.bookings)
        }
        for row in service_data
    ]
    
    # Sort by revenue descending
    service_breakdown.sort(key=lambda x: x["revenue"], reverse=True)
    
    return {
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
        "service_breakdown": service_breakdown,
        "total_revenue": round(sum(s["revenue"] for s in service_breakdown), 2),
        "total_bookings": sum(s["bookings"] for s in service_breakdown)
    }
