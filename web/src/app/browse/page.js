'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { vendorsAPI, servicesAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Browse() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [vendorServices, setVendorServices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const data = await vendorsAPI.getAll();
      setVendors(data);
      
      // Load services for each vendor
      const servicesPromises = data.map(vendor => 
        servicesAPI.getVendorServices(vendor.id)
          .then(services => ({ vendorId: vendor.id, services }))
          .catch(() => ({ vendorId: vendor.id, services: [] }))
      );
      
      const servicesResults = await Promise.all(servicesPromises);
      const servicesMap = {};
      servicesResults.forEach(({ vendorId, services }) => {
        servicesMap[vendorId] = services;
      });
      setVendorServices(servicesMap);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (services) => {
    if (!services || services.length === 0) return null;
    const prices = services.map(s => s.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `$${min.toFixed(0)}`;
    return `$${min.toFixed(0)} - $${max.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-primary-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Beauty Booking</h1>
            <p className="text-sm text-neutral-600">Welcome, {user?.full_name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-neutral-600 hover:text-neutral-900 font-medium transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-neutral-900 mb-3">
            Find Beauty Professionals
          </h2>
          <p className="text-lg text-neutral-600">
            Browse portfolios and book appointments with local professionals
          </p>
        </div>

        {/* Search & Filters - Coming Soon */}
        <div className="mb-8 p-4 bg-primary-100 border border-primary-200 rounded-lg">
          <p className="text-neutral-700 text-sm">
            🔍 Search and filters coming in Phase 2!
          </p>
        </div>

        {/* Vendors Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-lg text-neutral-600">Loading vendors...</div>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-primary-200">
            <div className="text-6xl mb-4">💇‍♀️</div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              No vendors yet
            </h3>
            <p className="text-neutral-600">
              Check back soon as professionals join the platform!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => {
              const services = vendorServices[vendor.id] || [];
              const priceRange = formatPrice(services);
              
              return (
                <Link
                  href={`/vendors/${vendor.id}`}
                  key={vendor.id}
                  className="bg-white rounded-2xl hover:shadow-md transition-all p-6 cursor-pointer border border-primary-200 hover:border-primary-300 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-1 group-hover:text-primary-700 transition">
                        {vendor.business_name}
                      </h3>
                      {vendor.location && (
                        <p className="text-sm text-neutral-600">📍 {vendor.location}</p>
                      )}
                    </div>
                    {vendor.is_pro && (
                      <span className="bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1 rounded">
                        PRO
                      </span>
                    )}
                  </div>

                  <p className="text-neutral-700 mb-4 line-clamp-2 leading-relaxed">
                    {vendor.bio || 'No bio provided'}
                  </p>

                  {/* Services Preview */}
                  {services.length > 0 && (
                    <div className="mb-4 pb-4 border-b border-primary-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700">
                          💅 {services.length} {services.length === 1 ? 'Service' : 'Services'}
                        </span>
                        {priceRange && (
                          <span className="text-sm font-semibold text-neutral-900">
                            {priceRange}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {services.slice(0, 2).map((service) => (
                          <div key={service.id} className="text-sm text-neutral-600">
                            • {service.name} - ${service.price.toFixed(0)} • {service.duration_minutes}min
                          </div>
                        ))}
                        {services.length > 2 && (
                          <div className="text-sm text-neutral-500 italic">
                            +{services.length - 2} more {services.length - 2 === 1 ? 'service' : 'services'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold text-neutral-900">{vendor.rating.toFixed(1)}</span>
                      <span className="text-sm text-neutral-500">(0 reviews)</span>
                    </div>
                    <span className="text-neutral-900 font-medium text-sm group-hover:translate-x-1 transition-transform">
                      View Profile →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}