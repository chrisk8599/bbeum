'use client';
export const dynamic = 'force-dynamic'
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
    <div className="min-h-screen bg-gradient-beige-dark flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[900px]">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-4xl font-serif text-neutral-900">bbeum</h1>
          </Link>
          <h2 className="text-3xl font-serif text-neutral-900 mb-2">Create Account</h2>
          <p className="text-neutral-600 text-lg">
            Sign up as a {formData.user_type === 'vendor' ? 'Professional' : 'Customer'}
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/90 backdrop-blur-sm p-12 rounded-3xl border border-primary-300/50 shadow-lg">
          {/* Account Type Toggle */}
          <div className="flex gap-3 mb-10 bg-primary-100 p-2 rounded-2xl border border-primary-200">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, user_type: 'customer' })}
              className={`flex-1 py-4 rounded-xl font-semibold text-lg transition ${
                formData.user_type === 'customer'
                  ? 'bg-white shadow-md text-neutral-900 border border-primary-300'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, user_type: 'vendor' })}
              className={`flex-1 py-4 rounded-xl font-semibold text-lg transition ${
                formData.user_type === 'vendor'
                  ? 'bg-white shadow-md text-neutral-900 border border-primary-300'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Professional
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-8 text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition text-lg"
                  placeholder="Jane Smith"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition text-lg"
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition text-lg"
                  placeholder="04XX XXX XXX"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-5 py-4 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition text-lg"
                  placeholder="Min 8 characters"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-5 rounded-xl font-semibold text-lg hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg mt-8"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-neutral-600 mt-8 text-lg">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-700 font-semibold hover:text-primary-800 transition">
              Login
            </Link>
          </p>
        </div>

        {/* Footer Note */}
        <p className="text-center text-neutral-500 text-sm mt-8">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}