'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { vendorsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function VendorSetup() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    business_name: user?.full_name || '',
    bio: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await vendorsAPI.setupProfile(formData);
      router.push('/vendor/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to set up profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige-300 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-beige-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-neutral-900">Set Up Your Profile</h1>
          <p className="text-neutral-600">
            Let's get your professional profile ready for customers
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-beige-400 focus:border-transparent bg-white"
              placeholder="e.g. Maria's Beauty Studio"
            />
            <p className="text-xs text-neutral-500 mt-1">
              This is how customers will find you
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bio *
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-beige-400 focus:border-transparent bg-white"
              placeholder="Tell customers about your experience, specialties, and what makes you unique..."
            />
            <p className="text-xs text-neutral-500 mt-1">
              Minimum 50 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-beige-400 focus:border-transparent bg-white"
              placeholder="e.g. Bondi, Sydney"
            />
            <p className="text-xs text-neutral-500 mt-1">
              City or suburb where you provide services
            </p>
          </div>

          <div className="bg-beige-100 border border-beige-300 rounded-lg p-4">
            <p className="text-sm text-neutral-700">
              💡 <strong>Coming soon:</strong> Portfolio upload, services setup, and availability settings
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Setting up...' : 'Complete Setup & Go to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}