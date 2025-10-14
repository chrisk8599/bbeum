'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.user_type === 'vendor') {
        router.push('/vendor/dashboard');
      } else {
        router.push('/browse');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-100">
        <div className="text-xl text-neutral-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-neutral-900">Beauty Booking</h1>
          <div className="flex items-center gap-3">
            <Link 
              href="/login"
              className="px-5 py-2 text-neutral-700 hover:text-neutral-900 font-medium transition"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="px-6 py-2.5 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 font-medium transition shadow-sm hover:shadow-md"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-block mb-4 px-4 py-2 bg-primary-200 rounded-full text-sm font-medium text-neutral-800">
            ✨ Welcome to the future of beauty booking
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
            Find Your Perfect
            <span className="block bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              Beauty Professional
            </span>
          </h2>
          <p className="text-xl text-neutral-600 mb-12 leading-relaxed max-w-2xl mx-auto">
            Skip the DMs. Book beauty services instantly with local professionals.
            See portfolios, read reviews, and schedule appointments in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register?type=customer"
              className="group px-8 py-4 bg-neutral-900 text-white rounded-full text-lg font-semibold hover:bg-neutral-800 transition shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              Find a Professional
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link 
              href="/register?type=vendor"
              className="px-8 py-4 bg-white text-neutral-900 border-2 border-neutral-900 rounded-full text-lg font-semibold hover:bg-primary-50 transition shadow-md hover:shadow-lg"
            >
              I'm a Professional
            </Link>
          </div>
        </div>

        {/* Features - Staggered Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          <div className="group bg-white p-8 rounded-3xl border border-primary-200 hover:border-primary-300 transition-all hover:shadow-xl hover:-translate-y-2 transform duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-200 to-primary-300 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              📸
            </div>
            <h3 className="text-xl font-bold mb-3 text-neutral-900">Browse Portfolios</h3>
            <p className="text-neutral-600 leading-relaxed">
              See real work from beauty professionals before booking
            </p>
          </div>
          
          <div className="group bg-white p-8 rounded-3xl border border-primary-200 hover:border-primary-300 transition-all hover:shadow-xl hover:-translate-y-2 transform duration-300 md:mt-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-200 to-primary-300 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              📅
            </div>
            <h3 className="text-xl font-bold mb-3 text-neutral-900">Instant Booking</h3>
            <p className="text-neutral-600 leading-relaxed">
              No more back-and-forth DMs. Book available time slots directly
            </p>
          </div>
          
          <div className="group bg-white p-8 rounded-3xl border border-primary-200 hover:border-primary-300 transition-all hover:shadow-xl hover:-translate-y-2 transform duration-300 md:mt-16">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-200 to-primary-300 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              ⭐
            </div>
            <h3 className="text-xl font-bold mb-3 text-neutral-900">Verified Reviews</h3>
            <p className="text-neutral-600 leading-relaxed">
              Read authentic reviews from real customers
            </p>
          </div>
        </div>

        {/* For Vendors - Split Layout */}
        <div className="bg-gradient-to-br from-white to-primary-50 rounded-3xl overflow-hidden border border-primary-200 shadow-xl">
          <div className="grid md:grid-cols-2 gap-12 p-12">
            {/* Left Side - Content */}
            <div className="flex flex-col justify-center">
              <div className="inline-block mb-4 px-4 py-2 bg-primary-200 rounded-full text-sm font-medium text-neutral-800 w-fit">
                For Professionals
              </div>
              <h3 className="text-4xl font-bold mb-4 text-neutral-900">
                Grow Your Beauty Business
              </h3>
              <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                Showcase your work, manage bookings, and attract more clients with our professional tools.
              </p>
              <Link 
                href="/register?type=vendor"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full font-semibold hover:bg-neutral-800 transition w-fit group"
              >
                Get Started Free
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            {/* Right Side - Feature Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-primary-200 hover:border-primary-300 transition-all hover:shadow-md">
                <div className="text-3xl mb-3">✨</div>
                <h4 className="font-semibold mb-2 text-neutral-900">Portfolio Showcase</h4>
                <p className="text-sm text-neutral-600">Display your best work</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-primary-200 hover:border-primary-300 transition-all hover:shadow-md mt-6">
                <div className="text-3xl mb-3">📆</div>
                <h4 className="font-semibold mb-2 text-neutral-900">Smart Booking</h4>
                <p className="text-sm text-neutral-600">Automated scheduling</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-primary-200 hover:border-primary-300 transition-all hover:shadow-md">
                <div className="text-3xl mb-3">💰</div>
                <h4 className="font-semibold mb-2 text-neutral-900">Secure Payments</h4>
                <p className="text-sm text-neutral-600">PRO: Collect deposits</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-primary-200 hover:border-primary-300 transition-all hover:shadow-md mt-6">
                <div className="text-3xl mb-3">📊</div>
                <h4 className="font-semibold mb-2 text-neutral-900">Analytics</h4>
                <p className="text-sm text-neutral-600">Track your growth</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="mt-32 text-center">
          <p className="text-neutral-500 text-sm uppercase tracking-wide mb-6">Trusted by beauty professionals</p>
          <div className="flex flex-wrap justify-center gap-12 items-center opacity-50">
            <div className="text-2xl font-bold text-neutral-400">💅 Nail Artists</div>
            <div className="text-2xl font-bold text-neutral-400">💇‍♀️ Hair Stylists</div>
            <div className="text-2xl font-bold text-neutral-400">💄 Makeup Artists</div>
            <div className="text-2xl font-bold text-neutral-400">🧖‍♀️ Estheticians</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-primary-200 mt-32">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-neutral-600 text-sm">
          <p>© 2025 Beauty Booking. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}