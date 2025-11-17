'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { professionalsAPI, servicesAPI, availabilityAPI, bookingsAPI } from '@/lib/api';
import CalendarWeekView from '@/components/CalendarWeekView';
import CalendarMonthView from '@/components/CalendarMonthView';
import CalendarNavigation from '@/components/CalendarNavigation';
import BookingDetailModal from '@/components/BookingDetailModal';
import ServicesManagement from '@/app/vendor/dashboard/ServicesManagement';
import AvailabilityManagement from '@/app/vendor/dashboard/AvailabilityManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
export default function ProfessionalDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');
  
  // Professional profile
  const [professional, setProfessional] = useState(null);
  
  // Calendar
  const [calendarView, setCalendarView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Services & Availability
  const [services, setServices] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [blockers, setBlockers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    bio: '',
    specialty: '',
    calendar_color: '#FF6B6B'
  });

  useEffect(() => {
    loadProfile();
    loadCalendar();
    loadServices();
    loadAvailability();
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [calendarView, currentDate]);

  const loadProfile = async () => {
    try {
      const data = await professionalsAPI.getMyProfile();
      setProfessional(data);
      setProfileForm({
        display_name: data.display_name,
        bio: data.bio || '',
        specialty: data.specialty || '',
        calendar_color: data.calendar_color
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendar = async () => {
    try {
      const params = {
        view: calendarView,
        date: currentDate.toISOString().split('T')[0]
      };
      const data = await bookingsAPI.getMyCalendar(params);
      setCalendarData(data);
    } catch (error) {
      console.error('Error loading calendar:', error);
    }
  };

  const loadServices = async () => {
    try {
      const data = await servicesAPI.getMyServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      const [scheduleData, blockersData] = await Promise.all([
        availabilityAPI.getMySchedule(),
        availabilityAPI.getMyBlockers()
      ]);
      setSchedule(scheduleData);
      setBlockers(blockersData);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await professionalsAPI.updateMyProfile(profileForm);
      setProfessional(updated);
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await bookingsAPI.updateBooking(bookingId, { status: newStatus });
      setSelectedBooking(null);
      loadCalendar();
    } catch (error) {
      alert('Failed to update booking status');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingsAPI.cancelBooking(bookingId, 'Cancelled by professional');
      setSelectedBooking(null);
      loadCalendar();
    } catch (error) {
      alert('Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-100">
        <div className="text-neutral-900">Loading...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['professional']}>
    <div className="min-h-screen bg-primary-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif text-neutral-900">Professional Dashboard</h1>
              <p className="text-sm text-neutral-600 mt-1">Welcome back, {user?.full_name}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-neutral-200 flex items-center justify-center text-2xl font-medium text-neutral-600">
              {professional?.display_name?.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              {!isEditingProfile ? (
                <>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-serif text-neutral-900">{professional?.display_name}</h2>
                    {professional?.is_owner && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">Owner</span>
                    )}
                  </div>
                  {professional?.specialty && (
                    <p className="text-neutral-600 mt-1">{professional.specialty}</p>
                  )}
                  {professional?.bio && (
                    <p className="text-neutral-600 mt-2">{professional.bio}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-sm text-neutral-600">
                      ⭐ {professional?.rating.toFixed(1)} rating
                    </span>
                    <span className="text-sm text-neutral-600">
                      • {professional?.total_bookings} bookings
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-600">Calendar color:</span>
                      <div
                        className="w-6 h-6 rounded border border-neutral-300"
                        style={{ backgroundColor: professional?.calendar_color }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <input
                    type="text"
                    value={profileForm.display_name}
                    onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="Display Name"
                    required
                  />
                  <input
                    type="text"
                    value={profileForm.specialty}
                    onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="Specialty (e.g., Hair Colorist)"
                  />
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    rows="3"
                    placeholder="Bio"
                  />
                  <div>
                    <label className="block text-sm text-neutral-600 mb-2">Calendar Color</label>
                    <input
                      type="color"
                      value={profileForm.calendar_color}
                      onChange={(e) => setProfileForm({ ...profileForm, calendar_color: e.target.value })}
                      className="w-20 h-10 rounded border border-neutral-300 cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-neutral-200 mb-6">
          <div className="border-b border-neutral-200 px-6">
            <div className="flex gap-8">
              {['calendar', 'services', 'availability'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 border-b-2 font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div>
                <h2 className="text-xl font-serif text-neutral-900 mb-6">My Calendar</h2>

                <CalendarNavigation
                  view={calendarView}
                  onViewChange={setCalendarView}
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  startDate={calendarData?.start_date}
                  endDate={calendarData?.end_date}
                />

                {calendarView === 'week' ? (
                  <CalendarWeekView
                    calendarData={calendarData}
                    onBookingClick={setSelectedBooking}
                  />
                ) : (
                  <CalendarMonthView
                    calendarData={calendarData}
                    onDayClick={(date) => {
                      setCurrentDate(date);
                      setCalendarView('week');
                    }}
                  />
                )}
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <ServicesManagement
                services={services}
                onUpdate={loadServices}
              />
            )}

            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <AvailabilityManagement
                schedule={schedule}
                blockers={blockers}
                onUpdate={loadAvailability}
              />
            )}
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdateStatus={handleUpdateBookingStatus}
          onCancel={handleCancelBooking}
        />
      )}
    </div></ProtectedRoute>
  );
}