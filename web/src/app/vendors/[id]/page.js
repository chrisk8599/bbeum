'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { vendorsAPI, servicesAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function VendorDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendor();
    loadServices();
  }, [params.id]);

  const loadVendor = async () => {
    try {
      const data = await vendorsAPI.getById(params.id);
      setVendor(data);
    } catch (error) {
      console.error('Error loading vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const data = await servicesAPI.getVendorServices(params.id);
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige-50">
        <div className="text-xl text-neutral-700">Loading...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige-50">
        <div className="text-xl text-red-600">Vendor not found</div>
      </div>
    );
  }

  const totalServices = services.length;
  const priceRange = services.length > 0 
    ? (() => {
        const prices = services.map(s => s.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `$${min.toFixed(0)}` : `$${min.toFixed(0)} - $${max.toFixed(0)}`;
      })()
    : null;

  return (
    <div className="min-h-screen bg-beige-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-beige-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="text-neutral-900 hover:text-neutral-700 font-medium transition"
          >
            ← Back
          </button>
          {user && (
            <Link 
              href={user.user_type === 'vendor' ? '/vendor/dashboard' : '/browse'}
              className="text-neutral-900 hover:text-neutral-700 font-medium transition"
            >
              Dashboard
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Vendor Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-beige-200">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-neutral-900">{vendor.business_name}</h1>
                {vendor.is_pro && (
                  <span className="bg-neutral-900 text-white text-sm font-semibold px-3 py-1 rounded">
                    PRO
                  </span>
                )}
              </div>
              {vendor.location && (
                <p className="text-lg text-neutral-600 mb-4">📍 {vendor.location}</p>
              )}
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <div className="font-bold text-neutral-900">{vendor.rating.toFixed(1)}</div>
                    <div className="text-neutral-500">Rating</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💅</span>
                  <div>
                    <div className="font-bold text-neutral-900">{totalServices}</div>
                    <div className="text-neutral-500">Services</div>
                  </div>
                </div>
                {priceRange && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <div>
                      <div className="font-bold text-neutral-900">{priceRange}</div>
                      <div className="text-neutral-500">Price Range</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-neutral-900">About</h2>
            <p className="text-neutral-700 leading-relaxed">
              {vendor.bio || 'No bio provided'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-neutral-700 mb-2">Contact</h3>
              <p className="text-neutral-600">📞 {vendor.phone || 'Not provided'}</p>
              <p className="text-neutral-600">✉️ {vendor.email}</p>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-beige-200">
          <h2 className="text-2xl font-bold mb-6 text-neutral-900">Services & Pricing</h2>
          
          {services.length === 0 ? (
            <div className="bg-beige-50 rounded-lg p-12 text-center border border-beige-200">
              <div className="text-5xl mb-3">💅</div>
              <p className="text-neutral-600">No services listed yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service) => (
                <div 
                  key={service.id} 
                  className="border border-primary-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  {/* Service Images */}
                  {service.images && service.images.length > 0 && (
                    <div className="mb-4">
                      <div className="flex gap-2 overflow-x-auto">
                        {service.images.map((img) => (
                          <img
                            key={img.id}
                            src={img.image_url}
                            alt={service.name}
                            className="w-24 h-24 object-cover rounded-lg border border-primary-200"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    {service.name}
                  </h3>
                  
                  {service.description && (
                    <p className="text-neutral-600 mb-4 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center pt-4 border-t border-primary-100">
                    <div>
                      <div className="text-2xl font-bold text-neutral-900">
                        ${service.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {service.duration_minutes} minutes
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition text-sm font-medium">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Portfolio */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-beige-200">
          <h2 className="text-2xl font-bold mb-4 text-neutral-900">📸 Portfolio</h2>
          <div className="bg-beige-50 rounded-lg p-12 text-center border border-beige-200">
            <p className="text-neutral-500">Portfolio upload coming soon</p>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-beige-200">
          <h2 className="text-2xl font-bold mb-4 text-neutral-900">⭐ Reviews</h2>
          <div className="bg-beige-50 rounded-lg p-12 text-center border border-beige-200">
            <p className="text-neutral-500">No reviews yet</p>
          </div>
        </div>
      </main>
    </div>
  );
}