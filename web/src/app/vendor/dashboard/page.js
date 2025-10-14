'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { vendorsAPI, servicesAPI } from '@/lib/api';
import Link from 'next/link';
import ServicesManagement from './ServicesManagement';

export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    bio: '',
    location: '',
    is_active: true,
  });

  useEffect(() => {
    loadProfile();
    loadServices();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await vendorsAPI.getMyProfile();
      setVendor(data);
      setFormData({
        business_name: data.business_name,
        bio: data.bio || '',
        location: data.location || '',
        is_active: data.is_active,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
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

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await vendorsAPI.updateProfile(formData);
      await loadProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige-50">
        <div className="text-xl text-neutral-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-beige-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Beauty Booking</h1>
            <p className="text-sm text-neutral-600">Vendor Dashboard</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-neutral-600 hover:text-neutral-900 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-beige-300 rounded-xl p-8 mb-8 border border-beige-400">
          <h2 className="text-3xl font-bold mb-2 text-neutral-900">
            Welcome back, {user?.full_name}! 👋
          </h2>
          <p className="text-neutral-700">
            Manage your profile, services, and grow your business
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-beige-200">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold text-neutral-900">0</div>
            <div className="text-sm text-neutral-600">Upcoming Bookings</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-beige-200">
            <div className="text-3xl mb-2">💅</div>
            <div className="text-2xl font-bold text-neutral-900">{services.length}</div>
            <div className="text-sm text-neutral-600">Active Services</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-beige-200">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-neutral-900">{vendor?.rating.toFixed(1)}</div>
            <div className="text-sm text-neutral-600">Average Rating</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-beige-200">
            <div className="text-3xl mb-2">{vendor?.is_active ? '✅' : '⏸️'}</div>
            <div className="text-2xl font-bold text-neutral-900">{vendor?.is_active ? 'Active' : 'Inactive'}</div>
            <div className="text-sm text-neutral-600">Profile Status</div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-beige-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-neutral-900">Your Profile</h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900 transition"
              >
                Cancel
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-beige-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-beige-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-beige-300 rounded-lg focus:ring-2 focus:ring-beige-400 bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-neutral-900 rounded focus:ring-beige-400"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-neutral-700">
                  Profile is active (visible to customers)
                </label>
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-500">Business Name</label>
                <p className="text-lg text-neutral-900">{vendor?.business_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">Bio</label>
                <p className="text-lg text-neutral-900">{vendor?.bio || 'No bio provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">Location</label>
                <p className="text-lg text-neutral-900">{vendor?.location || 'No location set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">Phone</label>
                <p className="text-lg text-neutral-900">{user?.phone || 'No phone set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">Email</label>
                <p className="text-lg text-neutral-900">{user?.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Services Management Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-beige-200">
          <ServicesManagement 
            services={services} 
            onUpdate={loadServices}
            isPro={vendor?.is_pro || false}
          />
        </div>

        {/* Coming Soon Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-beige-200">
            <h3 className="text-xl font-bold mb-4 text-neutral-900">🕐 Availability</h3>
            <p className="text-neutral-600 mb-4">
              Set your working hours and manage your schedule
            </p>
            <div className="bg-beige-50 rounded-lg p-8 text-center border border-beige-200">
              <p className="text-neutral-500">Coming in Phase 2</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-beige-200">
            <h3 className="text-xl font-bold mb-4 text-neutral-900">📅 Bookings</h3>
            <p className="text-neutral-600 mb-4">
              View and manage your upcoming appointments
            </p>
            <div className="bg-beige-50 rounded-lg p-8 text-center border border-beige-200">
              <p className="text-neutral-500">Coming in Phase 2</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}