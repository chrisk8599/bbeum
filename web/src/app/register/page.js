'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const searchParams = useSearchParams();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    user_type: searchParams.get('type') || 'customer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white p-10 rounded-2xl shadow-sm max-w-md w-full border border-primary-200">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-900">Create Account</h1>
        <p className="text-center text-neutral-600 mb-8">
          Sign up as a {formData.user_type === 'vendor' ? 'Professional' : 'Customer'}
        </p>

        {/* Account Type Toggle */}
        <div className="flex gap-2 mb-8 bg-primary-100 p-1.5 rounded-lg border border-primary-200">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, user_type: 'customer' })}
            className={`flex-1 py-2.5 rounded-md font-medium transition ${
              formData.user_type === 'customer'
                ? 'bg-white shadow-sm text-neutral-900 border border-primary-200'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, user_type: 'vendor' })}
            className={`flex-1 py-2.5 rounded-md font-medium transition ${
              formData.user_type === 'vendor'
                ? 'bg-white shadow-sm text-neutral-900 border border-primary-200'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Professional
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition"
              placeholder="04XX XXX XXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition"
              placeholder="Min 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-3.5 rounded-lg font-semibold hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition shadow-sm mt-6"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-neutral-900 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}