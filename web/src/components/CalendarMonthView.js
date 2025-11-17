'use client';

export default function CalendarMonthView({ calendarData, onDayClick }) {
  if (!calendarData || !calendarData.professionals || calendarData.professionals.length === 0) {
    return (
      <div className="text-center py-20 bg-gradient-beige-light rounded-xl border border-neutral-200">
        <div className="text-4xl mb-4">📅</div>
        <p className="text-neutral-600 font-medium mb-2">No calendar data available</p>
        <p className="text-sm text-neutral-500">Set up your availability to get started</p>
      </div>
    );
  }

  // Generate all days in the month
  const generateMonthDays = () => {
    const start = new Date(calendarData.start_date);
    const end = new Date(calendarData.end_date);
    const days = [];
    
    // Get first day of month's day of week (0 = Sunday)
    const firstDayOfWeek = start.getDay();
    
    // Add padding days from previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const monthDays = generateMonthDays();

  // Get bookings for a specific date and professional
  const getBookingsForDay = (professional, date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return professional.bookings.filter(b => b.booking_date === dateStr);
  };

  // Group bookings by professional for a date
  const getBookingCountsByProfessional = (date) => {
    if (!date) return [];
    const counts = calendarData.professionals.map(prof => ({
      professional_id: prof.professional_id,
      professional_name: prof.professional_name,
      calendar_color: prof.calendar_color,
      count: getBookingsForDay(prof, date).length
    })).filter(p => p.count > 0);
    return counts;
  };

  // Check if day is blocked or unavailable
  const isDayAvailable = (professional, date) => {
    if (!date) return false;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = professional.weekly_schedule[dayName];
    if (!daySchedule || !daySchedule.is_available) return false;
    
    // Check for all-day blockers
    const dateStr = date.toISOString().split('T')[0];
    const hasAllDayBlocker = professional.time_blockers.some(
      b => b.date === dateStr && !b.start_time && !b.end_time
    );
    
    return !hasAllDayBlocker;
  };

  const formatDate = (date) => {
    return date.getDate();
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date) => {
    if (!date) return false;
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-gradient-beige-light border-b border-neutral-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
          <div 
            key={day} 
            className={`p-3 text-center text-sm font-bold tracking-wide ${
              idx === 0 || idx === 6 ? 'text-neutral-500' : 'text-neutral-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {monthDays.map((date, idx) => {
          const bookingCounts = getBookingCountsByProfessional(date);
          const hasBookings = bookingCounts.length > 0;
          const totalBookings = bookingCounts.reduce((sum, prof) => sum + prof.count, 0);
          
          return (
            <div
              key={idx}
              className={`min-h-[110px] p-3 border-r border-b border-neutral-100 transition-all ${
                !date ? 'bg-neutral-50' : 
                isToday(date) ? 'bg-primary-50 hover:bg-primary-100 cursor-pointer' :
                isWeekend(date) ? 'bg-neutral-50 hover:bg-gradient-beige-light cursor-pointer' :
                'bg-white hover:bg-gradient-beige-light cursor-pointer'
              }`}
              onClick={() => date && onDayClick && onDayClick(date)}
            >
              {date && (
                <>
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-sm font-bold ${
                      isToday(date) 
                        ? 'bg-primary-600 text-white rounded-full w-7 h-7 flex items-center justify-center' 
                        : 'text-neutral-900'
                    }`}>
                      {formatDate(date)}
                    </div>
                    {totalBookings > 0 && (
                      <div className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                        {totalBookings}
                      </div>
                    )}
                  </div>

                  {/* Booking pills by professional */}
                  {hasBookings && (
                    <div className="space-y-1">
                      {bookingCounts.slice(0, 3).map(prof => (
                        <div
                          key={prof.professional_id}
                          className="text-xs px-2 py-1 rounded-md flex items-center justify-between shadow-sm"
                          style={{
                            backgroundColor: prof.calendar_color + '20',
                            borderLeft: `3px solid ${prof.calendar_color}`
                          }}
                        >
                          <span className="truncate flex-1 font-medium text-neutral-800">
                            {prof.professional_name.split(' ')[0]}
                          </span>
                          <span className="font-bold ml-1 text-neutral-900">×{prof.count}</span>
                        </div>
                      ))}
                      {bookingCounts.length > 3 && (
                        <div className="text-xs text-neutral-600 text-center pt-1">
                          +{bookingCounts.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}