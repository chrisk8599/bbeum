'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('main');

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-beige-dark">
        <div className="text-xl text-neutral-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#F5F0EB] border-b border-[#E5DDD5] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-serif text-neutral-900">bbeum</h1>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-neutral-700 hover:text-neutral-900 transition">
              Features
            </Link>
            <Link href="#pricing" className="text-neutral-700 hover:text-neutral-900 transition">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link 
              href="/login"
              className="px-5 py-2 text-neutral-700 hover:text-neutral-900 font-medium transition"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="px-6 py-2.5 bg-[#B8A188] text-white rounded-full hover:bg-[#A89178] font-medium transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50/30 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8A188]/20 rounded-full text-sm text-[#8B7355] font-medium mb-6">
                <span className="w-2 h-2 bg-[#B8A188] rounded-full"></span>
                Trusted by 50,000+ Beauty Professionals
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
                Online Booking System<br />
                <span className="text-[#B8A188]">For Beauty Services</span>
              </h1>
              
              <p className="text-xl text-neutral-600 mb-4 leading-relaxed">
                <strong>Skip the DMs.</strong> Book instantly with verified beauty pros near you.
              </p>
              
              <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                Manage your services, showcase your work, and accept bookings 24/7. Attract new clients and grow your beauty business effortlessly.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link 
                  href="/register?type=customer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#B8A188] text-white rounded-full text-lg font-medium hover:bg-[#A89178] transition shadow-md hover:shadow-lg"
                >
                  Get Started Free
                </Link>
              </div>

              <p className="text-sm text-neutral-500">
                <strong className="text-neutral-900">No credit card required</strong>
              </p>

              <div className="flex items-center gap-4 mt-8 pt-8 border-t border-neutral-200">
                <Link href="#" className="opacity-70 hover:opacity-100 transition">
                  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" className="h-10" />
                </Link>
                <Link href="#" className="opacity-70 hover:opacity-100 transition">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-10" />
                </Link>
              </div>

              <p className="text-sm text-neutral-600 mt-4">
                Accept payments with <strong>Stripe</strong> or <strong>PayPal</strong> 
                <span className="text-neutral-500"> (and many other providers available)</span>
              </p>
            </div>

            {/* Right Side - Dashboard Preview */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-neutral-200">
                {/* Mock Dashboard */}
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                    <h3 className="font-semibold text-neutral-900">bbeum</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-[#B8A188]/20 rounded-full h-2">
                        <div className="w-3/4 bg-[#B8A188] rounded-full h-2"></div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">245</div>
                      <div className="text-xs text-blue-700">Total bookings</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">$9,281</div>
                      <div className="text-xs text-green-700">Revenue</div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-gradient-to-br from-[#B8A188]/10 to-[#D4C4B0]/20 p-4 rounded-xl">
                    <div className="text-3xl font-bold text-[#8B7355] mb-2">$3457</div>
                    <div className="flex items-end gap-1 h-24">
                      {[40, 65, 45, 80, 60, 95, 70, 85, 55, 75, 90, 100].map((height, i) => (
                        <div 
                          key={i}
                          className="flex-1 bg-gradient-to-t from-[#B8A188] to-[#D4C4B0] rounded-t"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming Bookings */}
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 mb-3">Upcoming bookings</h4>
                    <div className="space-y-2">
                      {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#B8A188]/30 rounded-full"></div>
                            <div>
                              <div className="text-xs font-medium text-neutral-900">10:00 AM - 11:00 AM</div>
                              <div className="text-xs text-neutral-500">Hair Styling Appointment</div>
                            </div>
                          </div>
                          <button className="text-[#B8A188] text-xs font-medium">View →</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Client Activity Chart */}
                  <div className="bg-white border border-neutral-200 p-4 rounded-xl">
                    <h4 className="text-sm font-semibold text-neutral-900 mb-3">Client activity</h4>
                    <div className="h-32 flex items-end gap-1">
                      {[
                        { height: 60, color: 'bg-red-400' },
                        { height: 75, color: 'bg-red-400' },
                        { height: 55, color: 'bg-red-400' },
                        { height: 85, color: 'bg-blue-400' },
                        { height: 70, color: 'bg-blue-400' },
                        { height: 90, color: 'bg-blue-400' },
                        { height: 65, color: 'bg-green-400' },
                        { height: 95, color: 'bg-green-400' },
                        { height: 80, color: 'bg-green-400' },
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end h-full">
                          <div 
                            className={`${bar.color} rounded-t`}
                            style={{ height: `${bar.height}%` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Features</h2>
            <div className="flex items-center justify-center gap-4 mt-8">
              <button 
                onClick={() => setActiveTab('main')}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  activeTab === 'main' 
                    ? 'bg-[#B8A188] text-white' 
                    : 'bg-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Main
              </button>
              <button 
                onClick={() => setActiveTab('business')}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  activeTab === 'business' 
                    ? 'bg-[#B8A188] text-white' 
                    : 'bg-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                For Businesses
              </button>
              <button 
                onClick={() => setActiveTab('customer')}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  activeTab === 'customer' 
                    ? 'bg-[#B8A188] text-white' 
                    : 'bg-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                For Customers
              </button>
            </div>
          </div>

          {/* Main Features Tab */}
          {activeTab === 'main' && (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Online Booking</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Mobile-optimized booking website or integrate with your existing site seamlessly
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Notifications via WhatsApp, SMS & Email</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Send automated reminders and updates to your customers across multiple channels
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Customer & Admin Apps</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Provide customers with scheduled appointments and service providers with management tools
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Accept Online Payments</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Accept payments online through Stripe, PayPal, and other trusted payment processors
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Customer Database Management</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Keep track of your clients, their preferences, and booking history all in one place
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Reports & Analytics</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Track your business performance with detailed analytics and reporting tools
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Business Features Tab */}
          {activeTab === 'business' && (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Portfolio Showcase</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Display your best work with beautiful image galleries and detailed service descriptions
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Flexible Scheduling</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Set your availability, buffer times, and manage multiple service providers with ease
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Marketing Tools</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Promote your services, send email campaigns, and attract new clients with built-in marketing features
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Service Management</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Create unlimited services with custom pricing, durations, and descriptions
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Reviews & Ratings</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Build trust with authentic client reviews and showcase your 5-star service quality
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Revenue Tracking</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Monitor your earnings, track payments, and manage your business finances all in one dashboard
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Features Tab */}
          {activeTab === 'customer' && (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Easy Discovery</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Browse beauty professionals by location, service type, ratings, and availability
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Instant Booking</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Book appointments in seconds without waiting for confirmation or back-and-forth messages
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Secure Payments</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Pay safely online with encrypted payment processing and multiple payment options
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Booking Management</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    View, reschedule, or cancel appointments easily from your personal dashboard
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Smart Reminders</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Get timely notifications about upcoming appointments so you never miss a booking
                  </p>
                </div>
              </div>

              <div className="text-center group">
                <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F0EB] rounded-2xl flex items-center justify-center group-hover:bg-[#E5DDD5] transition">
                  <svg className="w-12 h-12 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div className="min-h-[160px] flex flex-col">
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">Favorites & History</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Save your favorite professionals and easily rebook services you've loved before
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-[#F5F0EB]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#8B7355] mb-2">50,000+</div>
              <div className="text-neutral-600">Active Businesses</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#8B7355] mb-2">2M+</div>
              <div className="text-neutral-600">Monthly Bookings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#8B7355] mb-2">98%</div>
              <div className="text-neutral-600">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#8B7355] mb-2">24/7</div>
              <div className="text-neutral-600">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Choose the plan that works best for your beauty business
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-[#F5F0EB] rounded-3xl p-8 md:p-10 border-2 border-[#E5DDD5] hover:border-[#B8A188] transition">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">Free</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-neutral-900">$0</span>
                  <span className="text-neutral-600">/month</span>
                </div>
                <p className="text-neutral-600">Perfect for getting started</p>
              </div>

              <Link 
                href="/register?plan=free"
                className="block w-full px-8 py-4 bg-white text-neutral-900 border-2 border-neutral-300 rounded-full text-center text-lg font-medium hover:border-[#B8A188] hover:bg-[#F5F0EB] transition mb-8"
              >
                Get Started Free
              </Link>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#8B7355] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-700">Basic portfolio showcase (up to 10 images)</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#8B7355] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-700">Online booking calendar</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#8B7355] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-700">Up to 3 service listings</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#8B7355] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-700">Email notifications</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#8B7355] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-700">Client reviews & ratings</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#8B7355] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-700">Basic customer database</span>
                </div>
                <div className="flex items-start gap-3 opacity-50">
                  <svg className="w-6 h-6 text-neutral-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-neutral-500">5% transaction fee on bookings</span>
                </div>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-[#B8A188] to-[#A89178] rounded-3xl p-8 md:p-10 border-2 border-[#8B7355] relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white text-[#8B7355] px-4 py-1 rounded-full text-sm font-semibold">
                Popular
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-white">$5</span>
                  <span className="text-white/80">/month</span>
                </div>
                <p className="text-white/90">Everything you need to grow</p>
              </div>

              <Link 
                href="/register?plan=pro"
                className="block w-full px-8 py-4 bg-white text-[#8B7355] rounded-full text-center text-lg font-medium hover:bg-neutral-50 transition mb-8 shadow-lg"
              >
                Start Pro Trial
              </Link>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white font-medium">Everything in Free, plus:</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Unlimited portfolio images</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Unlimited service listings</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">SMS & WhatsApp notifications</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Advanced analytics & reports</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Online payment processing (Stripe, PayPal)</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Priority support</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">Custom branding options</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white font-semibold">No transaction fees</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-neutral-600 mt-12 text-sm">
            All plans include secure booking management and mobile-friendly interfaces. Cancel anytime, no questions asked.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">How bbeum Works</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Get started in minutes and start accepting bookings today
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#B8A188] text-white rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div className="bg-[#F5F0EB] rounded-2xl p-8 pt-12 min-h-[280px] flex flex-col">
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Create Your Profile</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Set up your business profile, add your services, and showcase your portfolio in minutes.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#B8A188] text-white rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div className="bg-[#F5F0EB] rounded-2xl p-8 pt-12 min-h-[280px] flex flex-col">
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Set Your Availability</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Define your working hours, breaks, and special availability. Your calendar updates in real-time.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#B8A188] text-white rounded-full flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div className="bg-[#F5F0EB] rounded-2xl p-8 pt-12 min-h-[280px] flex flex-col">
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Start Accepting Bookings</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Clients discover you, book instantly, and you get notified. It's that simple!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#B8A188] to-[#A89178]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Beauty Business?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of beauty professionals already using bbeum to grow their business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register?type=vendor"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-[#8B7355] rounded-full text-lg font-medium hover:bg-neutral-50 transition shadow-lg"
            >
              Start Free Trial
              <span>→</span>
            </Link>
          </div>
          <p className="text-white/80 mt-6">No credit card required • Free forever plan available</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-serif text-2xl mb-4">bbeum</h3>
              <p className="text-sm leading-relaxed">
                Making beauty booking effortless for professionals and clients.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition">About</Link></li>
                <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 pt-8 text-center text-sm">
            <p>© 2025 bbeum. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}