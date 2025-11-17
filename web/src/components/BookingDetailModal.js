'use client';
import { useEffect } from 'react';

export default function BookingDetailModal({ booking, onClose, onUpdateStatus, onCancel }) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!booking) return null;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'confirmed': return 'bg-green-100 text-green-900 border-green-300';
      case 'completed': return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'cancelled': return 'bg-stone-200 text-stone-800 border-stone-300';
      case 'no_show': return 'bg-neutral-200 text-neutral-800 border-neutral-300';
      default: return 'bg-neutral-200 text-neutral-800 border-neutral-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-neutral-200">
        {/* Header */}
        <div className="p-6 bg-gradient-beige-light border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif text-neutral-900 font-bold">Booking Details</h2>
              <p className="text-sm text-neutral-600 mt-1">#{booking.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-white rounded-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-250px)]">
          {/* Status Badge */}
          <div>
            <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border-2 ${getStatusColor(booking.status)}`}>
              {booking.status.toUpperCase().replace('_', ' ')}
            </span>
          </div>

          {/* Customer Info Card */}
          <div className="bg-gradient-beige-light p-4 rounded-xl border border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                {booking.customer_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs text-neutral-600 font-medium">Customer</div>
                <div className="text-lg font-bold text-neutral-900">{booking.customer_name}</div>
              </div>
            </div>
          </div>

          {/* Service Details Card */}
          <div className="bg-white p-4 rounded-xl border-2 border-neutral-200">
            <div className="text-xs text-neutral-600 font-medium mb-2">Service</div>
            <div className="text-lg font-bold text-neutral-900 mb-3">{booking.service_name}</div>
            
            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-beige-light p-3 rounded-lg">
                <div className="text-xs text-neutral-600 font-medium mb-1">Date</div>
                <div className="font-bold text-neutral-900 text-sm">{formatDate(booking.booking_date)}</div>
              </div>
              <div className="bg-gradient-beige-light p-3 rounded-lg">
                <div className="text-xs text-neutral-600 font-medium mb-1">Time</div>
                <div className="font-bold text-neutral-900 text-sm">
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </div>
              </div>
            </div>
          </div>

          {/* Price Card */}
          <div className="bg-primary-50 p-4 rounded-xl border-2 border-primary-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 font-medium">Total Price</span>
              <span className="text-2xl font-bold text-primary-600">${booking.price}</span>
            </div>
          </div>

          {/* Customer Notes */}
          {booking.customer_notes && (
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <div className="text-xs text-neutral-600 font-medium mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Customer Notes
              </div>
              <div className="text-neutral-900 text-sm">{booking.customer_notes}</div>
            </div>
          )}
        </div>

        {/* Action Buttons - PENDING */}
        {onUpdateStatus && booking.status === 'pending' && (
          <div className="p-6 border-t border-neutral-200 bg-gradient-beige-light flex gap-3">
            <button
              onClick={() => onUpdateStatus(booking.id, 'confirmed')}
              className="flex-1 px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold shadow-sm hover:shadow-md"
            >
              ✓ Confirm Booking
            </button>
            <button
              onClick={() => onCancel && onCancel(booking.id)}
              className="flex-1 px-5 py-3 bg-stone-600 text-white rounded-xl hover:bg-stone-700 transition-all font-bold shadow-sm hover:shadow-md"
            >
              ✕ Cancel
            </button>
          </div>
        )}

        {/* Action Buttons - CONFIRMED */}
        {onUpdateStatus && booking.status === 'confirmed' && (
          <div className="p-6 border-t border-neutral-200 bg-gradient-beige-light flex gap-3">
            <button
              onClick={() => onUpdateStatus(booking.id, 'completed')}
              className="flex-1 px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-bold shadow-sm hover:shadow-md"
            >
              ✓ Mark Complete
            </button>
            <button
              onClick={() => onUpdateStatus(booking.id, 'no_show')}
              className="flex-1 px-5 py-3 bg-stone-600 text-white rounded-xl hover:bg-stone-700 transition-all font-bold shadow-sm hover:shadow-md"
            >
              No Show
            </button>
          </div>
        )}
      </div>
    </div>
  );
}