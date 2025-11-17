import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========== AUTH ==========
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data).then(res => res.data),
  login: (data) => api.post('/api/auth/login', data).then(res => res.data),
  getMe: () => api.get('/api/auth/me').then(res => res.data),
};

export const analyticsAPI = {
  // Get overall revenue summary
  getRevenueSummary: () => api.get('/api/analytics/revenue/summary').then(res => res.data),
  
  // Get daily revenue breakdown
  getDailyRevenue: (startDate, endDate) => 
    api.get('/api/analytics/revenue/daily', {
      params: { start_date: startDate, end_date: endDate }
    }).then(res => res.data),
  
  // Get weekly revenue (past N weeks)
  getWeeklyRevenue: (weeks = 12) => 
    api.get('/api/analytics/revenue/weekly', {
      params: { weeks }
    }).then(res => res.data),
  
  // Get monthly revenue (past N months)
  getMonthlyRevenue: (months = 12) => 
    api.get('/api/analytics/revenue/monthly', {
      params: { months }
    }).then(res => res.data),
  
  // Get revenue by professional/team member
  getRevenueByProfessional: (startDate = null, endDate = null) => 
    api.get('/api/analytics/revenue/by-professional', {
      params: { 
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      }
    }).then(res => res.data),
  
  // Get revenue by service type
  getRevenueByService: (startDate = null, endDate = null) => 
    api.get('/api/analytics/revenue/by-service', {
      params: { 
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      }
    }).then(res => res.data),
};












// ========== VENDORS ==========
export const vendorsAPI = {
  getAll: (params) => api.get('/api/vendors', { params }).then(res => res.data),
  getById: (id) => api.get(`/api/vendors/${id}`).then(res => res.data),
  getMyProfile: () => api.get('/api/vendors/me/profile').then(res => res.data),
  setupProfile: (data) => api.post('/api/vendors/me/profile', data).then(res => res.data),
  updateProfile: (data) => api.put('/api/vendors/me/profile', data).then(res => res.data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/vendors/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
};

// ========== PROFESSIONALS (NEW) ==========
export const professionalsAPI = {
  // Vendor endpoints
  inviteProfessional: (data) => api.post('/api/professionals/invite', data).then(res => res.data),
  getMyTeam: () => api.get('/api/professionals/me/team').then(res => res.data),
  updateProfessional: (id, data) => api.put(`/api/professionals/${id}/vendor-update`, data).then(res => res.data),
  deleteProfessional: (id) => api.delete(`/api/professionals/${id}`).then(res => res.data),
  
  // Professional endpoints
  getMyProfile: () => api.get('/api/professionals/me').then(res => res.data),
  updateMyProfile: (data) => api.put('/api/professionals/me', data).then(res => res.data),
  
  // Public endpoints
  getVendorProfessionals: (vendorId) => api.get(`/api/professionals/vendor/${vendorId}`).then(res => res.data),
  getProfessional: (id) => api.get(`/api/professionals/${id}`).then(res => res.data),
  
  // Invite acceptance
  acceptInvite: (data) => api.post('/api/professionals/accept-invite', data).then(res => res.data),
};

// ========== SERVICES ==========
export const servicesAPI = {
  getVendorServices: (vendorId) => api.get(`/api/services/vendor/${vendorId}`).then(res => res.data),
  getProfessionalServices: (professionalId) => api.get(`/api/services/professional/${professionalId}`).then(res => res.data),
  getMyServices: () => api.get('/api/services/me').then(res => res.data),
  getService: (id) => api.get(`/api/services/${id}`).then(res => res.data),
  createService: (data) => api.post('/api/services', data).then(res => res.data),
  updateService: (id, data) => api.put(`/api/services/${id}`, data).then(res => res.data),
  deleteService: (id) => api.delete(`/api/services/${id}`).then(res => res.data),
  uploadImage: (serviceId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/services/${serviceId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  deleteImage: (imageId) => api.delete(`/api/services/images/${imageId}`).then(res => res.data),
};

// ========== AVAILABILITY ==========
export const availabilityAPI = {
  getMySchedule: () => api.get('/api/availability/schedule/me').then(res => res.data),
  getProfessionalSchedule: (professionalId) => api.get(`/api/availability/schedule/professional/${professionalId}`).then(res => res.data),
  updateScheduleDay: (scheduleId, data) => api.put(`/api/availability/schedule/${scheduleId}`, data).then(res => res.data),
  
  getMyBlockers: () => api.get('/api/availability/blockers/me').then(res => res.data),
  getProfessionalBlockers: (professionalId) => api.get(`/api/availability/blockers/professional/${professionalId}`).then(res => res.data),
  createBlocker: (data) => api.post('/api/availability/blockers', data).then(res => res.data),
  deleteBlocker: (blockerId) => api.delete(`/api/availability/blockers/${blockerId}`).then(res => res.data),
  
  getAvailableSlots: (params) => api.get('/api/availability/slots', { params }).then(res => res.data),
};

// ========== BOOKINGS ==========
export const bookingsAPI = {
  createBooking: (data) => api.post('/api/bookings', data).then(res => res.data),
  getCustomerBookings: () => api.get('/api/bookings/me/customer').then(res => res.data),
  getProfessionalBookings: () => api.get('/api/bookings/me/professional').then(res => res.data),
  getBooking: (id) => api.get(`/api/bookings/${id}`).then(res => res.data),
  updateBooking: (id, data) => api.put(`/api/bookings/${id}`, data).then(res => res.data),
  cancelBooking: (id, reason) => api.post(`/api/bookings/${id}/cancel`, { reason }).then(res => res.data),
  markNoShow: (id) => api.post(`/api/bookings/${id}/no-show`).then(res => res.data),
  
  // Calendar endpoints (NEW)
  getMyCalendar: (params) => api.get('/api/bookings/calendar/me', { params }).then(res => res.data),
  getVendorCalendar: (params) => api.get('/api/bookings/calendar/vendor', { params }).then(res => res.data),
};

// ========== REVIEWS ==========
export const reviewsAPI = {
  createReview: (data) => api.post('/api/reviews', data).then(res => res.data),
  updateReview: (id, data) => api.put(`/api/reviews/${id}`, data).then(res => res.data),
  getProfessionalReviews: (professionalId) => api.get(`/api/reviews/professional/${professionalId}`).then(res => res.data),
  getVendorReviews: (vendorId) => api.get(`/api/reviews/vendor/${vendorId}`).then(res => res.data),
  getProfessionalSummary: (professionalId) => api.get(`/api/reviews/professional/${professionalId}/summary`).then(res => res.data),
  getVendorSummary: (vendorId) => api.get(`/api/reviews/vendor/${vendorId}/summary`).then(res => res.data),
  getMyReviews: () => api.get('/api/reviews/my').then(res => res.data),
  getBookingReview: (bookingId) => api.get(`/api/reviews/booking/${bookingId}`).then(res => res.data),
};

// ========== CATEGORIES ==========
export const categoriesAPI = {
  getAll: () => api.get('/api/categories').then(res => res.data),
};

export default api;