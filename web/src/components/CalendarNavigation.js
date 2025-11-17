'use client';

export default function CalendarNavigation({ 
  view, 
  onViewChange, 
  currentDate, 
  onDateChange,
  startDate,
  endDate
}) {
  const handlePrevious = () => {
    const date = new Date(currentDate);
    if (view === 'week') {
      date.setDate(date.getDate() - 7);
    } else {
      date.setMonth(date.getMonth() - 1);
    }
    onDateChange(date);
  };

  const handleNext = () => {
    const date = new Date(currentDate);
    if (view === 'week') {
      date.setDate(date.getDate() + 7);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    onDateChange(date);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const formatDateRange = () => {
    const start = new Date(startDate || currentDate);
    const end = new Date(endDate || currentDate);
    
    if (view === 'week') {
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    } else {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  return (
    <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-neutral-200">
      {/* Left: View toggle */}
      <div className="flex gap-2 bg-gradient-beige-light p-1 rounded-lg">
        <button
          onClick={() => onViewChange('week')}
          className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
            view === 'week'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => onViewChange('month')}
          className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
            view === 'month'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Month
        </button>
      </div>

      {/* Center: Date navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePrevious}
          className="p-2.5 hover:bg-gradient-beige-light rounded-lg transition-colors"
          aria-label="Previous"
        >
          <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={handleToday}
          className="px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-gradient-beige-light rounded-lg transition-colors"
        >
          Today
        </button>

        <button
          onClick={handleNext}
          className="p-2.5 hover:bg-gradient-beige-light rounded-lg transition-colors"
          aria-label="Next"
        >
          <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Right: Date range display */}
      <div className="text-lg font-medium text-neutral-900 font-serif">
        {formatDateRange()}
      </div>
    </div>
  );
}