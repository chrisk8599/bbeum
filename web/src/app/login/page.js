'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Login() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-beige-dark flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[550px]">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-4xl font-serif text-neutral-900">bbeum</h1>
          </Link>
          <h2 className="text-3xl font-serif text-neutral-900 mb-2">Welcome Back</h2>
          <p className="text-neutral-600 text-lg">
            Login to your account
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/90 backdrop-blur-sm p-12 rounded-3xl border border-primary-300/50 shadow-lg">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-8 text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full text-black px-5 py-4 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition text-lg"
                placeholder="jane@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full text-black px-5 py-4 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition text-lg"
                placeholder="Enter your password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-5 rounded-xl font-semibold text-lg hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg mt-8"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-neutral-600 mt-8 text-lg">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-700 font-semibold hover:text-primary-800 transition">
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer Note */}
        <p className="text-center text-neutral-500 text-sm mt-8">
          Secure login powered by bbeum
        </p>
      </div>
    </div>
  );
}