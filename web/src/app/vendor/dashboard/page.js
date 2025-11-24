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

    // Check limit
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
      await vendorsAPI.uploadBusinessImage(formData);
      await loadProfile(); // Reload to get updated images
    } catch (error) {
      console.error("Error uploading business image:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingBusinessImage(false);
    }
  };

  const handleDeleteBusinessImage = async (imageIndex) => {
    if (!confirm("Delete this photo?")) return;

    try {
      await vendorsAPI.deleteBusinessImage(imageIndex);
      await loadProfile();
    } catch (error) {
      console.error("Error deleting business image:", error);
      alert("Failed to delete image");
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
      {/* Rest of your component stays exactly the same... */}
      {/* I'm not including it all here to save space, but keep everything after this point identical */}
    </div>
  );
}
