"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  vendorsAPI,
  professionalsAPI,
  servicesAPI,
  availabilityAPI,
  bookingsAPI,
} from "@/lib/api";
import Link from "next/link";
import ServicesManagement from "./ServicesManagement";
import AvailabilityManagement from "./AvailabilityManagement";
import CalendarWeekView from "@/components/CalendarWeekView";
import CalendarMonthView from "@/components/CalendarMonthView";
import CalendarNavigation from "@/components/CalendarNavigation";
import ProfessionalFilter from "@/components/ProfessionalFilter";
import BookingDetailModal from "@/components/BookingDetailModal";
import TeamManagement from "@/components/TeamManagement";
import RevenueAnalytics from "@/components/RevenueAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("calendar");

  // Vendor & Team
  const [vendor, setVendor] = useState(null);
  const [professionals, setProfessionals] = useState([]);

  // Calendar
  const [calendarView, setCalendarView] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [selectedProfessionals, setSelectedProfessionals] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Services & Availability
  const [services, setServices] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [blockers, setBlockers] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBusinessImage, setUploadingBusinessImage] = useState(false); // ✅ MOVED HERE
  const [deletingImageIndex, setDeletingImageIndex] = useState(null);
  const [formData, setFormData] = useState({
    business_name: "",
    bio: "",
    location: "",
    is_active: true,
  });

  useEffect(() => {
    loadProfile();
    loadProfessionals();
    loadServices();
    loadAvailability();
  }, []);

  useEffect(() => {
    if (selectedProfessionals.length > 0) {
      loadCalendar();
    }
  }, [calendarView, currentDate, selectedProfessionals]);

  const loadProfile = async () => {
    try {
      const data = await vendorsAPI.getMyProfile();
      setVendor(data);
      setFormData({
        business_name: data.business_name,
        bio: data.bio || "",
        location: data.location || "",
        is_active: data.is_active,
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfessionals = async () => {
    try {
      console.log("📄 Loading professionals...");
      const data = await professionalsAPI.getMyTeam();
      console.log("✅ Professionals loaded:", data);
      console.log("📊 Count:", data?.length);
      setProfessionals(data);
      const ids = data.map((p) => p.id);
      console.log("🆔 Setting selected IDs:", ids);
      setSelectedProfessionals(ids);
    } catch (error) {
      console.error("❌ Error loading professionals:", error);
      console.error("❌ Error details:", error.response?.data);
    }
  };

  const loadCalendar = async () => {
    console.log("📅 loadCalendar called!");
    console.log("📅 Current params:", {
      view: calendarView,
      date: currentDate.toISOString().split("T")[0],
      selectedProfessionals: selectedProfessionals,
    });

    try {
      const params = {
        view: calendarView,
        date: currentDate.toISOString().split("T")[0],
        professional_ids: selectedProfessionals.join(","),
      };
      console.log("📅 Fetching calendar with params:", params);

      const data = await bookingsAPI.getVendorCalendar(params);
      console.log("✅ Calendar data received:", data);
      console.log("📊 Professionals in response:", data.professionals?.length);
      console.log("📋 Bookings:", data.professionals?.[0]?.bookings);

      setCalendarData(data);
    } catch (error) {
      console.error("❌ Error loading calendar:", error);
      console.error("❌ Error details:", error.response?.data);
    }
  };

  const loadServices = async () => {
    try {
      const data = await servicesAPI.getMyServices();
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const loadAvailability = async () => {
    try {
      const [scheduleData, blockersData] = await Promise.all([
        availabilityAPI.getMySchedule(),
        availabilityAPI.getMyBlockers(),
      ]);
      setSchedule(scheduleData);
      setBlockers(blockersData);

      if (selectedProfessionals.length > 0) {
        await loadCalendar();
      }
    } catch (error) {
      console.error("Error loading availability:", error);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await vendorsAPI.uploadAvatar(formData);
      setVendor((prev) => ({ ...prev, avatar_url: data.avatar_url }));
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBusinessImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentCount = vendor?.business_images?.length || 0;
    const limit = vendor?.is_pro ? 999 : 3;

    if (currentCount >= limit) {
      alert(
        vendor?.is_pro
          ? "Maximum photos reached"
          : "Upgrade to PRO for unlimited business photos!"
      );
      return;
    }

    setUploadingBusinessImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await vendorsAPI.uploadBusinessImage(formData);

      // ✅ Update UI immediately
      setVendor((prev) => ({
        ...prev,
        business_images: prev.business_images
          ? [...prev.business_images, response.image_url]
          : [response.image_url],
      }));
    } catch (error) {
      console.error("Error uploading business image:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingBusinessImage(false);
    }
  };
  const handleDeleteBusinessImage = async (imageIndex) => {
    if (!confirm("Delete this photo?")) return;

    setDeletingImageIndex(imageIndex);
    try {
      await vendorsAPI.deleteBusinessImage(imageIndex);
      // Optimistically update UI
      setVendor((prev) => ({
        ...prev,
        business_images: prev.business_images.filter(
          (_, idx) => idx !== imageIndex
        ),
      }));
    } catch (error) {
      console.error("Error deleting business image:", error);
      alert("Failed to delete image");
    } finally {
      setDeletingImageIndex(null);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await vendorsAPI.updateProfile(formData);
      setVendor(updated);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await bookingsAPI.updateBooking(bookingId, { status: newStatus });
      await loadCalendar();
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking status");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await bookingsAPI.cancelBooking(bookingId, "Cancelled by vendor");
      await loadCalendar();
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-xl text-neutral-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* NEW HEADER - Matches Landing Page */}
      <header className="bg-[#F5F0EB] border-b border-[#E5DDD5] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-serif text-neutral-900">bbeum</h1>

          <div className="flex items-center gap-3">
            <Link
              href={`/vendors/${vendor?.id}`}
              className="px-5 py-2 text-neutral-700 hover:text-neutral-900 font-medium transition"
            >
              View Public Profile
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
          <div className="space-y-6">
            {/* Business Name and Basic Info */}
            {!isEditing ? (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-neutral-900">
                    {vendor?.business_name}
                  </h3>
                  {vendor?.is_pro && (
                    <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-neutral-600 mb-2">{vendor?.location}</p>
                <p className="text-neutral-600">{vendor?.bio}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      business_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  placeholder="Business Name"
                />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  placeholder="Location"
                />
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  rows="3"
                  placeholder="Bio"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Business Avatar Section */}
            <div className="border-t border-neutral-200 pt-6">
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">
                Business Avatar
              </h4>
              <p className="text-xs text-neutral-600 mb-3">
                This image appears on vendor cards and your public profile
                header
              </p>
              <div className="flex items-center gap-4">
                {/* Avatar Display */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-neutral-200 flex items-center justify-center text-2xl font-medium text-neutral-600 overflow-hidden">
                    {vendor?.avatar_url ? (
                      <img
                        src={vendor.avatar_url}
                        alt="Business Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      vendor?.business_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-neutral-900 text-white p-1.5 rounded-full cursor-pointer hover:bg-neutral-800">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
                {uploadingAvatar && (
                  <div className="text-sm text-neutral-600">Uploading...</div>
                )}
              </div>
            </div>

            {/* Business Photos Section */}
            <div className="border-t border-neutral-200 pt-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900">
                    Business Photos
                  </h4>
                  <p className="text-xs text-neutral-600 mt-1">
                    Portfolio photos displayed on your public profile
                  </p>
                </div>
                <span className="text-xs text-neutral-600">
                  {vendor?.business_images?.length || 0} /{" "}
                  {vendor?.is_pro ? "∞" : "3"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {/* Existing images */}
                {vendor?.business_images?.map((img, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200 group"
                  >
                    {/* Image or deleting overlay */}
                    {deletingImageIndex === index ? (
                      // Deleting spinner overlay
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center">
                          <svg
                            className="animate-spin h-8 w-8 mx-auto text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span className="text-xs text-white mt-2 block">
                            Deleting...
                          </span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={img}
                        alt={`Business ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Delete button - hidden during upload/delete */}
                    {!uploadingBusinessImage && deletingImageIndex === null && (
                      <button
                        onClick={() => handleDeleteBusinessImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-700"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {/* Upload button or uploading spinner */}
                {(!vendor?.business_images ||
                  vendor.business_images.length <
                    (vendor?.is_pro ? 999 : 3)) && (
                  <label
                    className={`aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition ${
                      uploadingBusinessImage || deletingImageIndex !== null
                        ? "border-neutral-200 bg-neutral-50 cursor-wait"
                        : "border-neutral-300 cursor-pointer hover:border-neutral-400 hover:bg-neutral-50"
                    }`}
                  >
                    {uploadingBusinessImage ? (
                      // Uploading spinner
                      <div className="text-center">
                        <svg
                          className="animate-spin h-8 w-8 mx-auto text-[#B8A188]"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span className="text-xs text-neutral-600 mt-2 block">
                          Uploading...
                        </span>
                      </div>
                    ) : (
                      // Upload button
                      <div className="text-center">
                        <svg
                          className="w-8 h-8 mx-auto text-neutral-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span className="text-xs text-neutral-600 mt-1 block">
                          Add Photo
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBusinessImageUpload}
                      className="hidden"
                      disabled={
                        uploadingBusinessImage || deletingImageIndex !== null
                      }
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-neutral-200 mb-6">
          <div className="border-b border-neutral-200 px-6">
            <div className="flex gap-8 overflow-x-auto">
              {[
                "calendar",
                "analytics",
                "team",
                "services",
                "availability",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? "border-neutral-900 text-neutral-900"
                      : "border-transparent text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Calendar Tab */}
            {activeTab === "calendar" && (
              <div>
                <div className="mb-6">
                  <CalendarNavigation
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    view={calendarView}
                    onViewChange={setCalendarView}
                    startDate={calendarData?.start_date}
                    endDate={calendarData?.end_date}
                  />
                </div>

                {professionals.length > 0 && (
                  <div className="mb-6">
                    <ProfessionalFilter
                      professionals={professionals}
                      selectedIds={selectedProfessionals}
                      onChange={setSelectedProfessionals}
                    />
                  </div>
                )}

                {calendarView === "week" ? (
                  <CalendarWeekView
                    calendarData={calendarData}
                    onBookingClick={setSelectedBooking}
                  />
                ) : (
                  <CalendarMonthView
                    calendarData={calendarData}
                    onDateClick={(date) => {
                      setCurrentDate(date);
                      setCalendarView("week");
                    }}
                  />
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && <RevenueAnalytics />}

            {/* Team Tab */}
            {activeTab === "team" && (
              <TeamManagement
                vendor={vendor}
                professionals={professionals}
                onUpdate={loadProfessionals}
              />
            )}

            {/* Services Tab */}
            {activeTab === "services" && (
              <ServicesManagement
                services={services}
                onUpdate={loadServices}
                isPro={vendor?.is_pro}
              />
            )}

            {/* Availability Tab */}
            {activeTab === "availability" && (
              <AvailabilityManagement
                schedule={schedule}
                blockers={blockers}
                professionals={professionals}
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
    </div>
  );
}
