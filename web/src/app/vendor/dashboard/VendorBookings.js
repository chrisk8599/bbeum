'use client';
import { useState, useEffect } from 'react';
import { bookingsAPI } from '@/lib/api';

export default function VendorBookings({ vendorId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past, all
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await bookingsAPI.getProfessionalBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await bookingsAPI.updateBooking(bookingId, { status: newStatus });
      await loadBookings();
      setSelectedBooking(null);
    } catch (error) {
      alert('Failed to update booking status');
    }
  };

  const handleCancelBooking = async (bookingId, reason) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await bookingsAPI.cancelBooking(bookingId, reason || 'Cancelled by vendor');
      await loadBookings();
      setSelectedBooking(null);
    } catch (error) {
      alert('Failed to cancel booking');
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(booking => {
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    const now = new Date();
    const isPast = bookingDateTime < now;

    if (activeTab === 'upcoming') {
      return !isPast && booking.status !== 'cancelled' && booking.status !== 'completed';
    } else if (activeTab === 'past') {
      return isPast || booking.status === 'cancelled' || booking.status === 'completed';
    }
    return true; // 'all'
  });

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
    // timeStr is like "14:00:00"
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      no_show: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
        {status.toUpperCase().replace('_', ' ')}
      </span>
    );
  };

  const upcomingCount = bookings.filter(b => {
    const bookingDateTime = new Date(`${b.booking_date}T${b.start_time}`);
    return bookingDateTime >= new Date() && b.status !== 'cancelled' && b.status !== 'completed';
  }).length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 border border-[#E5DDD5]">
        <div className="text-center text-neutral-600">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-serif text-neutral-900">Bookings</h3>
        {upcomingCount > 0 && (
          <span className="bg-[#B8A188] text-white px-3 py-1 rounded-full text-sm font-semibold">
            {upcomingCount} upcoming
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E5DDD5]">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'upcoming'
              ? 'border-[#B8A188] text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'past'
              ? 'border-[#B8A188] text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Past
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'all'
              ? 'border-[#B8A188] text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          All
        </button>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-[#E5DDD5]">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-neutral-600">
            {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No bookings yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
            const isUpcoming = bookingDateTime >= new Date();

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl p-6 border border-[#E5DDD5] hover:border-[#B8A188] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-serif text-neutral-900">
                        {booking.service_name}
                      </h4>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    <div className="space-y-1 text-sm text-neutral-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">👤 Customer:</span>
                        <span>{booking.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">📅 Date:</span>
                        <span>{formatDate(booking.booking_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">🕐 Time:</span>
                        <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">💰 Price:</span>
                        <span>${booking.price.toFixed(2)}</span>
                      </div>
                      {booking.notes && (
                        <div className="flex items-start gap-2 mt-2">
                          <span className="font-medium">📝 Notes:</span>
                          <span className="italic">{booking.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isUpcoming && booking.status !== 'cancelled' && (
                    <div className="flex gap-2 ml-4">
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          Confirm
                        </button>
                      )}
                      {booking.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'completed')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                          >
                            Mark Complete
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'no_show')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                          >
                            No-Show
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:border-red-400 transition text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Cancellation Info */}
                {booking.status === 'cancelled' && booking.cancelled_at && (
                  <div className="mt-4 pt-4 border-t border-[#E5DDD5]">
                    <div className="text-sm text-neutral-600">
                      <span className="font-medium">Cancelled:</span>{' '}
                      {new Date(booking.cancelled_at).toLocaleString()}
                      {booking.cancellation_reason && (
                        <span className="ml-2">• Reason: {booking.cancellation_reason}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}