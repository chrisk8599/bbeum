'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { vendorsAPI, servicesAPI, reviewsAPI, categoriesAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Browse() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [vendorServices, setVendorServices] = useState({});
  const [vendorReviewCounts, setVendorReviewCounts] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Search filters
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      // Build filters object
      const filters = {};
      if (location.trim()) filters.location = location.trim();
      if (selectedCategory) filters.category_slug = selectedCategory;
      if (searchText.trim()) filters.search = searchText.trim();
      
      // Backend filtering
      const data = await vendorsAPI.getAll(filters);
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
      
      // Load review counts
      const reviewPromises = data.map(vendor =>
        reviewsAPI.getVendorSummary(vendor.id)
          .then(summary => ({ vendorId: vendor.id, count: summary.total_reviews }))
          .catch(() => ({ vendorId: vendor.id, count: 0 }))
      );
      
      const reviewResults = await Promise.all(reviewPromises);
      const reviewCountsMap = {};
      reviewResults.forEach(({ vendorId, count }) => {
        reviewCountsMap[vendorId] = count;
      });
      setVendorReviewCounts(reviewCountsMap);
    } catch (error) {
      console.error('Error searching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatPrice = (services) => {
    if (!services || services.length === 0) return null;
    const prices = services.map(s => s.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `${min.toFixed(0)}`;
    return `${min.toFixed(0)} - ${max.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-beige-dark">
      {/* Header */}
      <header className="bg-primary-100/90 backdrop-blur-md border-b border-primary-300/50 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
          <Link href="/" className="text-3xl font-serif text-neutral-900 hover:text-primary-700 transition">
            bbeum
          </Link>
          <div className="flex items-center gap-6">
            <Link 
              href="/bookings" 
              className="px-6 py-2.5 text-neutral-700 hover:text-neutral-900 font-medium transition"
            >
              My Bookings
            </Link>
            <button
              onClick={logout}
              className="px-7 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 font-medium transition shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-8 py-12">
        {/* Search Bar */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-primary-300/50 shadow-lg mb-10">
          <h2 className="text-3xl font-serif text-neutral-900 mb-6">
            Find Your Perfect Beauty Professional
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {/* Location Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                📍 Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., Bondi, Sydney"
                className="w-full px-4 py-3 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                💅 Service Type
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="">All Services</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Text */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                🔍 Search
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Salon name or keyword..."
                className="w-full px-4 py-3 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="w-full py-4 bg-primary-600 text-white rounded-xl text-lg font-medium hover:bg-primary-700 transition shadow-md hover:shadow-lg"
          >
            Search Beauty Professionals
          </button>
        </div>

        {/* Quick Category Filters */}
        {hasSearched && (
          <div className="flex gap-3 overflow-x-auto pb-4 mb-8">
            <button
              onClick={() => {
                setSelectedCategory('');
                handleSearch();
              }}
              className={`px-6 py-3 rounded-full text-base font-medium whitespace-nowrap transition ${
                !selectedCategory
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white/90 backdrop-blur-sm text-neutral-900 hover:bg-primary-100 border border-primary-300/50'
              }`}
            >
              All Services
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  setTimeout(handleSearch, 0);
                }}
                className={`px-6 py-3 rounded-full text-base font-medium whitespace-nowrap transition ${
                  selectedCategory === cat.slug
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white/90 backdrop-blur-sm text-neutral-900 hover:bg-primary-100 border border-primary-300/50'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {!hasSearched ? (
          <div className="text-center py-32 bg-white/90 backdrop-blur-sm rounded-3xl border border-primary-300/50 shadow-sm">
            <div className="text-7xl mb-6">🔍</div>
            <h3 className="text-3xl font-serif text-neutral-900 mb-3">
              Start Your Search
            </h3>
            <p className="text-xl text-neutral-600">
              Enter your location and preferences to find beauty professionals near you
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-32">
            <div className="text-xl text-neutral-600">Searching...</div>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-32 bg-white/90 backdrop-blur-sm rounded-3xl border border-primary-300/50 shadow-sm">
            <div className="text-7xl mb-6">😔</div>
            <h3 className="text-2xl font-serif text-neutral-900 mb-3">
              No Results Found
            </h3>
            <p className="text-lg text-neutral-600 mb-6">
              Try adjusting your search criteria or location
            </p>
            <button
              onClick={() => {
                setHasSearched(false);
                setVendors([]);
                setLocation('');
                setSelectedCategory('');
                setSearchText('');
              }}
              className="px-8 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition"
            >
              New Search
            </button>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-serif text-neutral-900 mb-2">
                Found {vendors.length} {vendors.length === 1 ? 'Professional' : 'Professionals'}
              </h2>
              {location && (
                <p className="text-lg text-neutral-600">
                  in {location}
                </p>
              )}
            </div>

            {/* Vendors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => {
                const services = vendorServices[vendor.id] || [];
                const reviewCount = vendorReviewCounts[vendor.id] || 0;
                
                return (
                  <Link
                    href={`/vendors/${vendor.id}`}
                    key={vendor.id}
                    className="bg-white/90 backdrop-blur-sm rounded-3xl border border-primary-300/50 overflow-hidden hover:shadow-xl transition-all group"
                  >
                    {/* Image */}
                    <div className="relative h-[260px] bg-primary-100 overflow-hidden">
                      {vendor.avatar_url ? (
                        <img
                          src={vendor.avatar_url}
                          alt={vendor.business_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-200 flex items-center justify-center">
                          <span className="text-7xl font-serif text-primary-500">
                            {vendor.business_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      {vendor.is_pro && (
                        <div className="absolute top-4 right-4 bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-md">
                          PRO
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Name and Rating */}
                      <div className="mb-4">
                        <h3 className="text-xl font-serif text-neutral-900 mb-2 line-clamp-1 group-hover:text-primary-700 transition">
                          {vendor.business_name}
                        </h3>
                        <div className="flex items-center gap-3 text-base">
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-900 font-semibold">{vendor.rating.toFixed(1)}</span>
                            <span className="text-xl">⭐</span>
                          </div>
                          <span className="text-neutral-500">({reviewCount} reviews)</span>
                        </div>
                      </div>

                      {/* Location */}
                      {vendor.location && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">📍</span>
                          <p className="text-base text-neutral-600 line-clamp-1">
                            {vendor.location}
                          </p>
                        </div>
                      )}

                      {/* Professional Count - NEW! */}
                      {vendor.professional_count > 0 && (
                        <div className="flex items-center gap-2 mb-5">
                          <span className="text-lg">👥</span>
                          <p className="text-base text-neutral-600">
                            {vendor.professional_count} {vendor.professional_count === 1 ? 'Professional' : 'Professionals'}
                          </p>
                        </div>
                      )}

                      {/* Services Preview */}
                      {services.length > 0 ? (
                        <div className="space-y-3 mb-4">
                          {services.slice(0, 3).map((service) => (
                            <div key={service.id} className="flex items-center justify-between text-base pb-3 border-b border-primary-100 last:border-0 last:pb-0">
                              <div className="flex-1 min-w-0">
                                <p className="text-neutral-900 font-medium truncate">{service.name}</p>
                                <p className="text-neutral-500 text-sm">{service.duration_minutes} min</p>
                              </div>
                              <span className="text-neutral-900 font-semibold ml-4 flex-shrink-0">
                                ${service.price.toFixed(0)}
                              </span>
                            </div>
                          ))}
                          {services.length > 3 && (
                            <p className="text-base text-primary-700 font-medium mt-4 group-hover:underline">
                              +{services.length - 3} more services →
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-base text-neutral-500 mb-4 italic">No services listed yet</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}