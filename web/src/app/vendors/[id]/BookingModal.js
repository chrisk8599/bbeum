'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { availabilityAPI, bookingsAPI } from '@/lib/api';

export default function BookingModal({ vendor, professionals, service, onClose, onSuccess }) {
  const router = useRouter();
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Auto-select professional if only one available or if service is only offered by one
  useEffect(() => {
    if (professionals && professionals.length > 0) {
      // Filter professionals who offer this service
      const availableProfessionals = professionals.filter(prof => 
        prof.services?.some(s => s.id === service.id)
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
        date: selectedDate
      });
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error('Error loading slots:', error);
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
        customer_notes: notes || null
      };

      await bookingsAPI.createBooking(bookingData);
      
      onClose();
      router.push('/bookings');
    } catch (error) {
      console.error('Booking error:', error);
      alert(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Invalid Time';
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
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

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-neutral-200 relative z-[101] flex flex-col">
        {/* Header - Fixed at top */}
        <div className="bg-white border-b border-neutral-200 p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">
                Book {service.name}
              </h2>
              <p className="text-neutral-600">
                {selectedProfessional ? (
                  <>with {selectedProfessional.display_name} at {vendor.business_name}</>
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

        {/* Content - Scrollable middle section */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Professional Selection */}
          {professionals && professionals.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Professional
              </label>
              <select
                value={selectedProfessional?.id || ''}
                onChange={(e) => {
                  const prof = professionals.find(p => p.id === parseInt(e.target.value));
                  setSelectedProfessional(prof);
                  setSelectedDate('');
                  setAvailableSlots([]);
                  setSelectedSlot(null);
                }}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition"
              >
                <option value="">Choose a professional...</option>
                {professionals
                  .filter(prof => prof.services?.some(s => s.id === service.id))
                  .map(prof => (
                    <option key={prof.id} value={prof.id}>
                      {prof.display_name}
                      {prof.is_owner && ' (Owner)'}
                    </option>
                  ))
                }
              </select>
            </div>
          )}

          {/* Service Info */}
          <div className="bg-primary-50 rounded-lg p-4 border-2 border-primary-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-neutral-900">{service.name}</div>
                <div className="text-sm text-neutral-600">{service.duration_minutes} minutes</div>
              </div>
              <div className="text-xl font-bold text-primary-700">
                ${service.price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Date Selection */}
          {selectedProfessional && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={minDate}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition"
              />
            </div>
          )}

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Available Times
              </label>
              
              {loadingSlots ? (
                <div className="text-center py-8 text-neutral-600">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  Loading available times...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="bg-primary-50 rounded-lg p-8 text-center border-2 border-primary-200">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-neutral-700 font-medium">No available slots for this date</p>
                  <p className="text-sm text-neutral-500 mt-2">
                    Try selecting a different date or check if the professional has set their availability.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                        selectedSlot === slot
                          ? 'border-primary-600 bg-primary-600 text-white shadow-md'
                          : 'border-neutral-200 hover:border-primary-400 hover:bg-primary-50 text-neutral-900'
                      }`}
                    >
                      {formatTime(slot.start_time)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {selectedSlot && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special requests or information for the professional..."
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition"
              />
            </div>
          )}

          {/* Summary */}
          {selectedSlot && (
            <div className="bg-gradient-beige-light rounded-lg p-6 border-2 border-primary-200">
              <h3 className="font-bold text-neutral-900 mb-4 text-lg">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Professional:</span>
                  <span className="font-semibold text-neutral-900">{selectedProfessional?.display_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Service:</span>
                  <span className="font-semibold text-neutral-900">{service.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Date:</span>
                  <span className="font-semibold text-neutral-900">{formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Time:</span>
                  <span className="font-semibold text-neutral-900">{formatTime(selectedSlot.start_time)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Duration:</span>
                  <span className="font-semibold text-neutral-900">{service.duration_minutes} minutes</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-primary-300">
                  <span className="text-neutral-700 font-medium">Total:</span>
                  <span className="font-bold text-primary-700 text-xl">${service.price.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  ℹ️ Status will be "Pending" until professional confirms
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="bg-white border-t-2 border-neutral-200 p-6 rounded-b-2xl flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 transition font-medium text-neutral-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={!selectedSlot || loading}
            className={`flex-1 px-6 py-3 rounded-lg transition font-semibold ${
              selectedSlot && !loading
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}