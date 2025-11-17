'use client';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { vendorsAPI, professionalsAPI, servicesAPI, reviewsAPI, availabilityAPI } from '@/lib/api';
import BookingModal from './BookingModal';
import VendorReviews from './VendorReviews';

export default function VendorPublicProfile({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  
  const [vendor, setVendor] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [bookingService, setBookingService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [reviewCount, setReviewCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null); // For image modal
  const [schedule, setSchedule] = useState([]);
  const [showServicePicker, setShowServicePicker] = useState(false);

  useEffect(() => {
    loadVendorData();
  }, [id]);

  const loadVendorData = async () => {
    try {
      const vendorData = await vendorsAPI.getById(id);
      setVendor(vendorData);
      
      const profsData = await professionalsAPI.getVendorProfessionals(id);
      setProfessionals(profsData);
      
      const servicesData = await servicesAPI.getVendorServices(id);
      setServices(servicesData);
      
      // Get review count from the same API that VendorReviews uses
      try {
        const reviewSummary = await reviewsAPI.getVendorSummary(id);
        setReviewCount(reviewSummary.total_reviews || 0);
      } catch (reviewError) {
        console.error('Error loading review summary:', reviewError);
        setReviewCount(0);
      }

      // Load schedule from the first professional (owner)
      if (profsData.length > 0) {
        try {
          const scheduleData = await availabilityAPI.getProfessionalSchedule(profsData[0].id);
          setSchedule(scheduleData);
        } catch (scheduleError) {
          console.error('Error loading schedule:', scheduleError);
        }
      }
    } catch (error) {
      console.error('Error loading vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (service) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.user_type === 'vendor' || user.user_type === 'professional') {
      alert('Vendors and professionals cannot book services. Please use a customer account.');
      return;
    }
    setBookingService(service);
  };

  // Get unique categories from services - handle different possible data structures
  const availableCategories = ['all', ...new Set(
    services
      .map(s => s.category_name || s.category?.name || null)
      .filter(Boolean)
  )];
  
  // Filter services by category
  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(s => {
        const categoryName = s.category_name || s.category?.name;
        return categoryName === selectedCategory;
      });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-xl text-neutral-700">Loading...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-xl text-neutral-700">Vendor not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-[#F5F0EB] border-b border-[#E5DDD5] sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Back button – sticks to very left edge */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-neutral-900 hover:text-neutral-600 transition absolute left-6"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          {/* Centered content */}
          <div className="mx-auto text-center">
            <h1 className="text-3xl font-serif text-neutral-900">bbeum</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Hero Images Section - Business Photos */}
            {vendor.business_images && vendor.business_images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Large image */}
                <div 
                  className="col-span-2 h-80 cursor-pointer group relative overflow-hidden rounded-xl"
                  onClick={() => setSelectedImage(vendor.business_images[0])}
                >
                  <img
                    src={vendor.business_images[0]}
                    alt={vendor.business_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Zoom icon overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <svg 
                      className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                {/* Two smaller images */}
                {vendor.business_images.slice(1, 3).map((img, idx) => (
                  <div 
                    key={idx} 
                    className="h-48 relative cursor-pointer group overflow-hidden rounded-xl"
                    onClick={() => setSelectedImage(img)}
                  >
                    <img
                      src={img}
                      alt={`${vendor.business_name} ${idx + 2}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Zoom icon overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <svg 
                        className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                    {idx === 1 && vendor.business_images.length > 3 && (
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center pointer-events-none">
                        <span className="text-white text-sm font-medium">
                          See all {vendor.business_images.length} photos
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : vendor.avatar_url ? (
              // Fallback to avatar if no business images
              <div 
                className="w-full h-80 rounded-xl overflow-hidden cursor-pointer group relative"
                onClick={() => setSelectedImage(vendor.avatar_url)}
              >
                <img
                  src={vendor.avatar_url}
                  alt={vendor.business_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Zoom icon overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <svg 
                    className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            ) : null}

            {/* Vendor Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                    {vendor.business_name}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    {vendor.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-semibold text-neutral-900">
                          {vendor.rating.toFixed(1)}
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(vendor.rating)
                                  ? 'text-amber-400 fill-current'
                                  : 'text-neutral-300 fill-current'
                              }`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span>({reviewCount})</span>
                      </div>
                    )}
                    {vendor.location && (
                      <>
                        <span>•</span>
                        <span>{vendor.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {vendor.bio && (
                <p className="text-neutral-700 leading-relaxed">{vendor.bio}</p>
              )}
            </div>

            {/* Services Section */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Services</h2>
              
              {/* Category Filter Tabs - Always show if there are services */}
              {services.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-neutral-200">
                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {category === 'all' ? 'All Services' : category}
                      <span className={`ml-2 text-xs ${
                        selectedCategory === category ? 'opacity-75' : 'opacity-60'
                      }`}>
                        ({category === 'all' 
                          ? services.length 
                          : services.filter(s => (s.category_name || s.category?.name) === category).length
                        })
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Services List with Images */}
              {filteredServices.length > 0 ? (
                <div className="space-y-6">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className="border border-neutral-200 rounded-xl overflow-hidden hover:border-neutral-400 transition"
                    >
                      {/* Service Images Gallery - Always 3 columns */}
                      {service.images && service.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-50">
                          {service.images.slice(0, 3).map((img, idx) => (
                            <div 
                              key={idx} 
                              className="relative h-40 rounded-lg overflow-hidden cursor-pointer group"
                              onClick={() => setSelectedImage(img.image_url)}
                            >
                              <img
                                src={img.image_url}
                                alt={`${service.name} ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              {/* Zoom icon overlay on hover */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                <svg 
                                  className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Service Details */}
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg text-neutral-900">
                                {service.name}
                              </h3>
                              {service.category_name && (
                                <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">
                                  {service.category_name}
                                </span>
                              )}
                            </div>
                            {service.description && (
                              <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-neutral-500">
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{service.duration_minutes} mins</span>
                              </div>
                              {service.professional_name && (
                                <>
                                  <span>•</span>
                                  <span>with {service.professional_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-6">
                            <div className="mb-3">
                              <div className="text-xs text-neutral-500 mb-1">from</div>
                              <div className="text-2xl font-bold text-neutral-900">
                                ${service.price}
                              </div>
                            </div>
                            <button
                              onClick={() => handleBookNow(service)}
                              className="w-full px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition"
                            >
                              Book
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-neutral-600 text-lg mb-4">
                    No services in this category
                  </p>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                  >
                    Show All Services
                  </button>
                </div>
              )}
            </div>

            {/* Team Section */}
            {professionals.length > 0 && (
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Team</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {professionals.map((prof) => (
                    <div
                      key={prof.id}
                      className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg hover:border-neutral-400 transition"
                    >
                      {prof.avatar_url ? (
                        <img
                          src={prof.avatar_url}
                          alt={prof.display_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-xl">
                          {prof.display_name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-neutral-900">
                            {prof.display_name}
                          </h3>
                          {prof.is_owner && (
                            <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">
                              Owner
                            </span>
                          )}
                        </div>
                        {prof.specialty && (
                          <p className="text-sm text-neutral-600">{prof.specialty}</p>
                        )}
                        {prof.rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-sm font-medium">{prof.rating.toFixed(1)}</span>
                            <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <VendorReviews vendorId={vendor.id} />
          </div>

          {/* Sidebar - Right column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Book Now Card */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                {!showServicePicker ? (
                  <button
                    onClick={() => setShowServicePicker(true)}
                    className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
                  >
                    Book now
                  </button>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-neutral-900">Choose a service</h3>
                      <button
                        onClick={() => setShowServicePicker(false)}
                        className="text-neutral-500 hover:text-neutral-700 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {services.length > 0 ? (
                      <>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {services.map((service) => (
                            <button
                              key={service.id}
                              onClick={() => {
                                handleBookNow(service);
                                setShowServicePicker(false);
                              }}
                              className="w-full text-left px-4 py-3 border border-neutral-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition group"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="font-medium text-neutral-900 group-hover:text-primary-700">
                                    {service.name}
                                  </div>
                                  <div className="text-xs text-neutral-500 mt-0.5">
                                    {service.duration_minutes} mins
                                  </div>
                                </div>
                                <div className="text-right ml-3">
                                  <div className="font-bold text-neutral-900">
                                    ${service.price}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-neutral-500">
                        No services available
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Hours Card */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-neutral-900">Opening hours</span>
                </div>
                <div className="space-y-2 text-sm">
                  {schedule.length > 0 ? (
                    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      const daySchedule = schedule.find(s => s.day_of_week === day);
                      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                      
                      if (!daySchedule || !daySchedule.is_available) {
                        return (
                          <div key={day} className="flex justify-between items-center">
                            <span className="text-neutral-400">{dayName}</span>
                            <span className="text-neutral-400">Closed</span>
                          </div>
                        );
                      }
                      
                      // Format time from HH:MM:SS to h:mm am/pm
                      const formatTime = (timeStr) => {
                        if (!timeStr) return '';
                        const [hours, minutes] = timeStr.split(':');
                        const hour = parseInt(hours);
                        const ampm = hour >= 12 ? 'pm' : 'am';
                        const displayHour = hour % 12 || 12;
                        return `${displayHour}:${minutes} ${ampm}`;
                      };
                      
                      return (
                        <div key={day} className="flex justify-between items-center">
                          <span className="text-neutral-700">{dayName}</span>
                          <span className="text-neutral-900">
                            {formatTime(daySchedule.start_time)} - {formatTime(daySchedule.end_time)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-neutral-500">
                      No schedule available
                    </div>
                  )}
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-semibold text-neutral-900">Location</span>
                </div>
                {vendor.location && (
                  <>
                    <p className="text-sm text-neutral-700 mb-3">{vendor.location}</p>
                    
                    {/* Google Maps Embed */}
                    <div className="w-full h-48 bg-neutral-200 rounded-lg overflow-hidden mb-3">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(vendor.location)}`}
                        allowFullScreen
                      ></iframe>
                    </div>
                    
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Get directions
                    </a>
                  </>
                )}
              </div>

              {/* Additional Info Card */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="font-semibold text-neutral-900 mb-3">Additional information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-neutral-700">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Instant Confirmation</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Pay by card</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{vendor.total_professionals || 1} team member{(vendor.total_professionals || 1) > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image */}
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
            />
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingService && (
        <BookingModal
          vendor={vendor}
          professionals={professionals}
          service={bookingService}
          onClose={() => setBookingService(null)}
          onSuccess={() => {
            setBookingService(null);
            router.push('/bookings');
          }}
        />
      )}
    </div>
  );
}