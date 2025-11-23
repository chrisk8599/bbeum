"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { availabilityAPI, bookingsAPI } from "@/lib/api";

export default function BookingModal({
  vendor,
  professionals,
  service,
  onClose,
  onSuccess,
}) {
  const router = useRouter();
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Auto-select professional if only one available
  useEffect(() => {
    if (professionals && professionals.length > 0) {
      const availableProfessionals = professionals.filter((prof) =>
        prof.services?.some((s) => s.id === service.id)
      );

      if (availableProfessionals.length === 1) {
        setSelectedProfessional(availableProfessionals[0]);
      } else if (professionals.length === 1) {
        setSelectedProfessional(professionals[0]);
      }
    }
  }, [professionals, service.id]);

  useEffect(() => {
    if (selectedDate && selectedProfessional) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedProfessional]);

  const loadAvailableSlots = async () => {
    if (!selectedProfessional) return;

    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const data = await availabilityAPI.getAvailableSlots({
        professional_id: selectedProfessional.id,
        service_id: service.id,
        date: selectedDate,
      });
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error("Error loading slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !selectedProfessional) return;

    setLoading(true);
    try {
      const bookingData = {
        professional_id: selectedProfessional.id,
        service_id: service.id,
        booking_date: selectedDate,
        start_time: selectedSlot.start_time,
        customer_notes: notes || null,
      };

      await bookingsAPI.createBooking(bookingData);

      onClose();
      router.push("/bookings");
    } catch (error) {
      console.error("Booking error:", error);
      alert(error.response?.data?.detail || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "Invalid Time";

    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;

    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Custom Date Picker Functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const handleDateSelect = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split("T")[0];
    setSelectedDate(dateStr);
    setShowDatePicker(false);
  };

  const changeMonth = (delta) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1)
    );
  };

  const isDateDisabled = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (day) => {
    if (!selectedDate) return false;
    const selectedDateObj = new Date(selectedDate);
    return (
      selectedDateObj.getDate() === day &&
      selectedDateObj.getMonth() === currentMonth.getMonth() &&
      selectedDateObj.getFullYear() === currentMonth.getFullYear()
    );
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-neutral-200 relative z-[101] flex flex-col">
        {/* Header */}
        <div className="bg-[#F5F0EB] border-b border-[#E5DDD5] p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">
                Book {service.name}
              </h2>
              <p className="text-neutral-600">
                {selectedProfessional ? (
                  <>
                    with {selectedProfessional.display_name} at{" "}
                    {vendor.business_name}
                  </>
                ) : (
                  <>at {vendor.business_name}</>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700 text-2xl transition"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Professional Selection */}
            {professionals && professionals.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Select Professional
                </label>
                <select
                  value={selectedProfessional?.id || ""}
                  onChange={(e) => {
                    const prof = professionals.find(
                      (p) => p.id === parseInt(e.target.value)
                    );
                    setSelectedProfessional(prof);
                    setSelectedDate("");
                    setAvailableSlots([]);
                    setSelectedSlot(null);
                  }}
                  className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] focus:border-[#B8A188] bg-white transition"
                >
                  <option value="">Choose a professional...</option>
                  {professionals
                    .filter((prof) =>
                      prof.services?.some((s) => s.id === service.id)
                    )
                    .map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.display_name}
                        {prof.is_owner && " (Owner)"}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Two Column: Service Info/Date/Notes + Available Times */}
            {selectedProfessional && (
              <div className="grid grid-cols-2 gap-6">
                {/* LEFT COLUMN */}
                <div className="space-y-4">
                  {/* Service Info */}
                  <div className="bg-[#F5F0EB] rounded-lg p-4 border border-[#E5DDD5]">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-neutral-900">
                          {service.name}
                        </div>
                        <div className="text-sm text-neutral-600">
                          {service.duration_minutes} minutes
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-[#8B7355]">
                        ${service.price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                      Select Date
                    </label>
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg bg-white text-left flex items-center justify-between hover:border-[#B8A188] transition"
                    >
                      <span
                        className={
                          selectedDate ? "text-neutral-900" : "text-neutral-400"
                        }
                      >
                        {selectedDate
                          ? formatDate(selectedDate)
                          : "Choose a date..."}
                      </span>
                      <svg
                        className="w-5 h-5 text-neutral-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Any special requests or information for the professional..."
                      className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] focus:border-[#B8A188] bg-white transition resize-none"
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN - Available Times */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Available Times
                  </label>

                  {!selectedDate ? (
                    <div className="bg-[#F5F0EB] rounded-lg p-12 text-center border border-[#E5DDD5] h-full flex items-center justify-center">
                      <div>
                        <div className="text-4xl mb-3">📅</div>
                        <p className="text-neutral-600 text-sm">
                          Select a date to see available times
                        </p>
                      </div>
                    </div>
                  ) : loadingSlots ? (
                    <div className="text-center py-12 text-neutral-600 bg-[#F5F0EB] rounded-lg border border-[#E5DDD5]">
                      <div className="w-8 h-8 border-4 border-[#B8A188] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-sm">Loading...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="bg-[#F5F0EB] rounded-lg p-12 text-center border border-[#E5DDD5]">
                      <div className="text-4xl mb-3">📅</div>
                      <p className="text-neutral-700 font-medium">
                        No available slots
                      </p>
                      <p className="text-sm text-neutral-500 mt-2">
                        Try a different date
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-2">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot)}
                          className={`
                            px-3 py-3 rounded-lg border transition-all font-medium text-sm
                            ${
                              selectedSlot === slot
                                ? "border-[#B8A188] bg-[#B8A188] text-white shadow-md"
                                : "border-[#E5DDD5] hover:border-[#B8A188] hover:bg-[#F5F0EB] text-neutral-900"
                            }
                          `}
                        >
                          {formatTime(slot.start_time)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booking Summary - Full Width - Always Visible */}
            {selectedProfessional && (
              <div className="bg-[#F5F0EB] rounded-lg p-6 border border-[#E5DDD5]">
                <h3 className="font-bold text-neutral-900 mb-4 text-lg">
                  Booking Summary
                </h3>
                <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Professional:</span>
                    <span className="font-semibold text-neutral-900">
                      {selectedProfessional.display_name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Service:</span>
                    <span className="font-semibold text-neutral-900">
                      {service.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Duration:</span>
                    <span className="font-semibold text-neutral-900">
                      {service.duration_minutes} minutes
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Date:</span>
                    <span className="font-semibold text-neutral-900">
                      {selectedDate ? formatDate(selectedDate) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Time:</span>
                    <span className="font-semibold text-neutral-900">
                      {selectedSlot ? formatTime(selectedSlot.start_time) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-700 font-medium">Total:</span>
                    <span className="font-bold text-[#8B7355] text-xl">
                      ${service.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                {selectedSlot && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 flex items-start gap-2">
                      <span>ℹ️</span>
                      <span>
                        Status will be Pending until professional confirms
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-[#E5DDD5] p-6 rounded-b-2xl flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-[#E5DDD5] rounded-lg hover:bg-[#F5F0EB] transition font-medium text-neutral-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={!selectedSlot || loading}
            className={`flex-1 px-6 py-3 rounded-lg transition font-semibold ${
              selectedSlot && !loading
                ? "bg-[#B8A188] text-white hover:bg-[#A89178] shadow-md"
                : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      </div>

      {/* Custom Date Picker Overlay */}
      {showDatePicker && (
        <>
          <div
            className="fixed inset-0 z-[102]"
            onClick={() => setShowDatePicker(false)}
          />

          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[103] bg-white border border-[#E5DDD5] rounded-lg shadow-2xl p-4 w-80">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-[#F5F0EB] rounded-lg transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span className="font-semibold text-neutral-900">
                {monthName}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-[#F5F0EB] rounded-lg transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-neutral-600 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {[...Array(startingDayOfWeek)].map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const disabled = isDateDisabled(day);
                const selected = isDateSelected(day);

                return (
                  <button
                    key={day}
                    onClick={() => !disabled && handleDateSelect(day)}
                    disabled={disabled}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-lg transition
                      ${
                        disabled
                          ? "text-neutral-300 cursor-not-allowed"
                          : selected
                          ? "bg-[#B8A188] text-white font-semibold"
                          : "text-neutral-900 hover:bg-[#F5F0EB]"
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                handleDateSelect(today.getDate());
              }}
              className="w-full mt-4 py-2 text-sm text-[#8B7355] hover:bg-[#F5F0EB] rounded-lg transition font-medium"
            >
              Today
            </button>
          </div>
        </>
      )}
    </div>
  );
}
