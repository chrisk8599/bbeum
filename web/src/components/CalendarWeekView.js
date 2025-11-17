'use client';
import { useState } from 'react';
import React from 'react';

export default function CalendarWeekView({ calendarData, onBookingClick }) {
  const [selectedProfessional, setSelectedProfessional] = useState(null);

  console.log('📅 CalendarWeekView - Full calendarData:', calendarData);
  console.log('📅 CalendarWeekView - Professionals:', calendarData?.professionals);
  console.log('📅 CalendarWeekView - First professional:', calendarData?.professionals?.[0]);
  console.log('📅 CalendarWeekView - Bookings in first professional:', calendarData?.professionals?.[0]?.bookings);

  if (!calendarData || !calendarData.professionals || calendarData.professionals.length === 0) {
    return (
      <div className="text-center py-20 bg-gradient-beige-light rounded-xl border border-neutral-200">
        <div className="text-4xl mb-4">📅</div>
        <p className="text-neutral-600 font-medium mb-2">No calendar data available</p>
        <p className="text-sm text-neutral-500">Set up your availability to get started</p>
      </div>
    );
  }

  // Generate time slots (15-minute increments from 6am to 10pm)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Generate days for the week
  const generateWeekDays = () => {
    const start = new Date(calendarData.start_date);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = generateWeekDays();

  // Get day name from date
  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Check if time is within working hours
  const isWorkingHour = (professional, dayName, time) => {
    const daySchedule = professional.weekly_schedule[dayName];
    if (!daySchedule || !daySchedule.is_available) return false;
    
    const startTime = daySchedule.start_time;
    const endTime = daySchedule.end_time;
    
    return time >= startTime && time < endTime;
  };

  // Check if time is blocked
  const isBlocked = (professional, date, time) => {
    const dateStr = date.toISOString().split('T')[0];
    return professional.time_blockers.some(blocker => {
      if (blocker.date !== dateStr) return false;
      if (!blocker.start_time && !blocker.end_time) return true; // All-day block
      return time >= blocker.start_time && time < blocker.end_time;
    });
  };

  // Get booking at specific time
  const getBookingAtTime = (professional, date, time) => {
    const dateStr = date.toISOString().split('T')[0];
    const found = professional.bookings.find(booking => {
      // Normalize times to HH:MM format for comparison
      const bookingStart = booking.start_time.substring(0, 5); // '09:00:00' -> '09:00'
      const bookingEnd = booking.end_time.substring(0, 5);     // '10:00:00' -> '10:00'
      
      const matches = booking.booking_date === dateStr && 
             time >= bookingStart && 
             time < bookingEnd;
      
      return matches;
    });
    return found;
  };

  // Calculate booking span (how many 15-min slots it covers)
  const calculateBookingSpan = (startTime, endTime) => {
    const start = startTime.split(':');
    const end = endTime.split(':');
    const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
    const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
    return Math.ceil((endMinutes - startMinutes) / 15);
  };

  // Get status styling - TRANSPARENT BEIGE THEME
  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-amber-100/30',  // Very light transparent amber
          border: 'border-amber-300',
          badge: 'bg-amber-200 text-amber-900 border-amber-400',
          text: 'text-amber-900'
        };
      case 'confirmed':
        return {
          bg: 'bg-green-100/30',  // Very light transparent green
          border: 'border-green-300',
          badge: 'bg-green-200 text-green-900 border-green-400',
          text: 'text-green-900'
        };
      case 'completed':
        return {
          bg: 'bg-blue-100/30',  // Very light transparent blue
          border: 'border-blue-300',
          badge: 'bg-blue-200 text-blue-900 border-blue-400',
          text: 'text-blue-900'
        };
      case 'cancelled':
        return {
          bg: 'bg-stone-100/30',  // Very light transparent stone/beige
          border: 'border-stone-300',
          badge: 'bg-stone-200 text-stone-800 border-stone-400',
          text: 'text-stone-800'
        };
      default:
        return {
          bg: 'bg-stone-100/30',  // Very light transparent stone/beige
          border: 'border-stone-300',
          badge: 'bg-stone-200 text-stone-800 border-stone-400',
          text: 'text-stone-900'
        };
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  // Check if day is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Grid container */}
          <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
            
            {/* Header row */}
            <div className="sticky top-0 bg-gradient-beige-light border-b border-neutral-200 p-3 z-10"></div>
            {weekDays.map((day, idx) => (
              <div 
                key={idx} 
                className={`sticky top-0 bg-gradient-beige-light border-b border-l border-neutral-200 p-4 text-center z-10 ${
                  isToday(day) ? 'bg-primary-100' : ''
                }`}
              >
                <div className="text-sm font-bold text-neutral-900 tracking-wide">
                  {getDayName(day).substring(0, 3).toUpperCase()}
                </div>
                <div className={`text-xs mt-1.5 ${isToday(day) ? 'text-primary-700 font-bold' : 'text-neutral-600'}`}>
                  {formatDate(day)}
                </div>
                {isToday(day) && (
                  <div className="mt-1 w-1.5 h-1.5 bg-primary-600 rounded-full mx-auto"></div>
                )}
              </div>
            ))}

            {/* Time slots and calendar grid */}
            {timeSlots.map((time, timeIdx) => {
              // Only show hour labels (on the hour)
              const showLabel = time.endsWith(':00');
              
              return (
                <React.Fragment key={`time-${timeIdx}`}>
                  {/* Time label */}
                  <div className={`border-b border-neutral-200 p-2 text-right pr-4 text-xs bg-gradient-beige-light ${
                    showLabel ? 'text-neutral-700 font-medium' : 'text-neutral-400'
                  }`}>
                    {showLabel ? time : ''}
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day, dayIdx) => {
                    const dayName = getDayName(day);
                    
                    return (
                      <div 
                        key={`${dayIdx}-${timeIdx}`} 
                        className={`border-b border-l border-neutral-200 relative min-h-[40px] ${
                          isToday(day) ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {calendarData.professionals.map((professional) => {
                          const working = isWorkingHour(professional, dayName, time);
                          const blocked = isBlocked(professional, day, time);
                          const booking = getBookingAtTime(professional, day, time);
                      
                          // Render blocked or non-working slots FIRST (so they're in the back)
                          const blockedElement = (!working || blocked) ? (
                            <div
                              key={`blocked-${professional.professional_id}-${dayIdx}-${timeIdx}`}
                              className="absolute inset-0 bg-stone-100/40"
                              style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(120,113,108,0.04) 8px, rgba(120,113,108,0.04) 16px)'
                              }}
                            />
                          ) : null;
                      
                          // Check if this is the first slot where we encounter this booking
                          let bookingElement = null;
                          if (booking) {
                            // Check if any previous slot on this day already had this booking
                            const previousSlotHadThisBooking = timeIdx > 0 && 
                              getBookingAtTime(professional, day, timeSlots[timeIdx - 1])?.id === booking.id;
                            
                            // Only render if this is the first slot to encounter this booking
                            if (!previousSlotHadThisBooking) {
                              console.log('✅ RENDERING BOOKING:', booking.id, 'at', time);
                              const span = calculateBookingSpan(booking.start_time, booking.end_time);
                              const statusStyle = getStatusStyle(booking.status);
                              
                              bookingElement = (
                                <div
                                  key={`booking-${booking.id}`}
                                  className={`absolute inset-x-1.5 rounded-lg border-2 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all ${statusStyle.bg} ${statusStyle.border}`}
                                  style={{
                                    top: '3px',
                                    height: `${span * 40 - 6}px`,
                                    zIndex: 10
                                  }}
                                  onClick={() => onBookingClick(booking)}
                                >
                                  <div className="p-2 text-xs overflow-hidden h-full flex flex-col">
                                    {/* Status Badge */}
                                    <div className="mb-1.5">
                                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusStyle.badge}`}>
                                        {formatStatus(booking.status)}
                                      </span>
                                    </div>
                                    
                                    {/* Booking Details */}
                                    <div className="flex-1">
                                      <div className={`font-bold truncate ${statusStyle.text}`}>
                                        {booking.customer_name}
                                      </div>
                                      <div className={`truncate mt-0.5 ${statusStyle.text} opacity-90`}>
                                        {booking.service_name}
                                      </div>
                                    </div>
                                    
                                    {/* Time */}
                                    <div className={`text-[10px] font-medium mt-1 ${statusStyle.text} opacity-75`}>
                                      {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          }
                      
                          // Return blocked element first, then booking on top
                          return (
                            <React.Fragment key={`prof-${professional.professional_id}`}>
                              {blockedElement}
                              {bookingElement}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}