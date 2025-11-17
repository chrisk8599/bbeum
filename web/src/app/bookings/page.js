'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsAPI, reviewsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReviewModal from './ReviewModal';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CustomerBookings() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [bookingReviews, setBookingReviews] = useState({});

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.user_type !== 'customer') {
        router.push('/vendor/dashboard');
      } else {
        loadBookings();
      }
    }
  }, [user, authLoading]);

  const loadBookings = async () => {
    try {
      const data = await bookingsAPI.getCustomerBookings();
      setBookings(data);
      
      // Check which bookings have reviews
      const reviewChecks = {};
      for (const booking of data) {
        if (booking.status === 'completed') {
          try {
            const review = await reviewsAPI.getBookingReview(booking.id);
            reviewChecks[booking.id] = review;
          } catch (error) {
            reviewChecks[booking.id] = null;
          }
        }
      }
      setBookingReviews(reviewChecks);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingsAPI.cancelBooking(bookingId, 'Cancelled by customer');
      await loadBookings();
    } catch (error) {
      alert('Failed to cancel booking');
    }
  };

  const handleStartEdit = (booking) => {
    setEditingBooking(booking.id);
    setEditNotes(booking.customer_notes || '');
  };

  const handleSaveEdit = async (bookingId) => {
    try {
      await bookingsAPI.updateBooking(bookingId, { customer_notes: editNotes });
      await loadBookings();
      setEditingBooking(null);
      setEditNotes('');
    } catch (error) {
      alert('Failed to update notes');
    }
  };

  const handleCancelEdit = () => {
    setEditingBooking(null);
    setEditNotes('');
  };

  const handleOpenReview = (booking, review = null) => {
    setReviewingBooking(booking);
    setExistingReview(review);
  };

  const handleReviewSuccess = () => {
    setReviewingBooking(null);
    setExistingReview(null);
    loadBookings();
  };

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

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100/50 text-amber-800 border-amber-200',
      confirmed: 'bg-emerald-100/50 text-emerald-800 border-emerald-200',
      completed: 'bg-blue-100/50 text-blue-800 border-blue-200',
      cancelled: 'bg-stone-100/50 text-stone-800 border-stone-200',
      no_show: 'bg-neutral-100/50 text-neutral-800 border-neutral-200'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
        {status.toUpperCase().replace('_', ' ')}
      </span>
    );
  };

  const upcomingBookings = bookings.filter(b => {
    const bookingDateTime = new Date(`${b.booking_date}T${b.start_time}`);
    return bookingDateTime >= new Date() && b.status !== 'cancelled' && b.status !== 'completed';
  });

  const pastBookings = bookings.filter(b => {
    const bookingDateTime = new Date(`${b.booking_date}T${b.start_time}`);
    return bookingDateTime < new Date() || b.status === 'cancelled' || b.status === 'completed';
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-xl text-neutral-700">Loading...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['customer']}>
      <div className="min-h-screen bg-neutral-50">
        {/* NEW HEADER - Matches Landing Page */}
        <header className="bg-[#F5F0EB] border-b border-[#E5DDD5] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/browse" className="text-3xl font-serif text-neutral-900 hover:text-neutral-700 transition">
              bbeum
            </Link>
            
            <div className="flex items-center gap-3">
              <Link 
                href="/browse"
                className="px-5 py-2 text-neutral-700 hover:text-neutral-900 font-medium transition"
              >
                Browse
              </Link>
              <button
                onClick={logout}
                className="px-6 py-2.5 bg-[#B8A188] text-white rounded-full hover:bg-[#A89178] font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Title Section */}
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">My Bookings</h1>
            <p className="text-neutral-600">Manage your appointments and leave reviews</p>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-6 py-10">
          {/* Upcoming Appointments Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Upcoming Appointments</h2>

            {upcomingBookings.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-neutral-200">
                <div className="text-5xl mb-3">📅</div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">No upcoming bookings</h3>
                <p className="text-neutral-600 mb-6">Book an appointment with your favorite beauty professional</p>
                <Link 
                  href="/browse" 
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition font-medium"
                >
                  Browse Vendors
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="bg-white rounded-xl p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold text-neutral-900">{booking.service_name}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-neutral-700">
                            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">Professional:</span>
                            <span className="text-neutral-900">{booking.professional_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-700">
                            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-medium">Vendor:</span>
                            <span>{booking.vendor_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-700">
                            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">Date:</span>
                            <span>{formatDate(booking.booking_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-700">
                            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Time:</span>
                            <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-700">
                            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Price:</span>
                            <span className="text-neutral-900 font-semibold">${booking.price.toFixed(2)}</span>
                          </div>
                          {editingBooking === booking.id ? (
                            <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                              <label className="block text-sm font-medium text-neutral-700 mb-2">📝 Notes for professional:</label>
                              <textarea
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                rows={3}
                                placeholder="Add any special requests or notes..."
                                className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
                              />
                              <div className="flex gap-2 mt-3">
                                <button 
                                  onClick={() => handleSaveEdit(booking.id)} 
                                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 font-medium transition"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={handleCancelEdit} 
                                  className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg text-sm font-medium transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : booking.customer_notes ? (
                            <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div className="flex-1">
                                <span className="text-xs font-medium text-amber-800 block mb-1">Your Notes:</span>
                                <span className="text-sm text-amber-900">{booking.customer_notes}</span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      {booking.status === 'pending' && (
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          <button 
                            onClick={() => handleStartEdit(booking)} 
                            className="px-4 py-2 text-neutral-700 hover:text-neutral-900 border-2 border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition text-sm font-medium"
                          >
                            Edit Notes
                          </button>
                          <button 
                            onClick={() => handleCancelBooking(booking.id)} 
                            className="px-4 py-2 text-red-600 hover:text-red-700 border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Appointments Section */}
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Past Appointments</h2>
            {pastBookings.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-neutral-200">
                <div className="text-5xl mb-3">📜</div>
                <p className="text-neutral-600">No past bookings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="bg-white rounded-xl p-6 border border-neutral-200 opacity-90 hover:opacity-100 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold text-neutral-900">{booking.service_name}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-neutral-700">
                            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">Professional:</span>
                            <span className="text-neutral-900">{booking.professional_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-700">
                            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-medium">Vendor:</span>
                            <span>{booking.vendor_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-700">
                            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">Date:</span>
                            <span>{formatDate(booking.booking_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-700">
                            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Time:</span>
                            <span>{formatTime(booking.start_time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-700">
                            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Price:</span>
                            <span className="text-neutral-900 font-semibold">${booking.price.toFixed(2)}</span>
                          </div>
                          {booking.customer_notes && (
                            <div className="flex items-start gap-2 mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                              <svg className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div className="flex-1">
                                <span className="text-xs font-medium text-neutral-600 block mb-1">Notes:</span>
                                <span className="text-sm text-neutral-700">{booking.customer_notes}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {booking.status === 'cancelled' && booking.cancellation_reason && (
                          <div className="text-sm text-red-600 mb-2">
                            <span className="font-medium">Reason:</span> {booking.cancellation_reason}
                          </div>
                        )}
                        {booking.status === 'completed' && (
                          <div>
                            {bookingReviews[booking.id] ? (
                              <button 
                                onClick={() => handleOpenReview(booking, bookingReviews[booking.id])} 
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                              >
                                Edit Review
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleOpenReview(booking)} 
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                              >
                                Leave Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {reviewingBooking && (
          <ReviewModal 
            booking={reviewingBooking} 
            existingReview={existingReview} 
            onClose={() => { 
              setReviewingBooking(null); 
              setExistingReview(null); 
            }} 
            onSuccess={handleReviewSuccess} 
          />
        )}
      </div>
    </ProtectedRoute>
  );
}