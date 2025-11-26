"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  vendorsAPI,
  servicesAPI,
  reviewsAPI,
  categoriesAPI,
  availabilityAPI,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

export default function Browse() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [vendorServices, setVendorServices] = useState({});
  const [vendorReviewCounts, setVendorReviewCounts] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Search filters
  const [suburb, setSuburb] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchRadius, setSearchRadius] = useState(10);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Google Places Autocomplete
  const suburbInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (mapsLoaded) {
      initializeAutocomplete();
    }
  }, [mapsLoaded]);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const initializeAutocomplete = () => {
    if (!window.google || !suburbInputRef.current || autocompleteRef.current)
      return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      suburbInputRef.current,
      {
        componentRestrictions: { country: "au" },
        fields: ["formatted_address", "geometry", "name"],
        types: ["(regions)"],
      }
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        setSuburb(place.formatted_address);
      }
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const geocodeLocation = async (locationString) => {
    if (!window.google) return null;

    const geocoder = new window.google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { address: locationString, componentRestrictions: { country: "au" } },
        (results, status) => {
          if (status === "OK" && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              formatted_address: results[0].formatted_address,
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  const checkVendorAvailability = async (vendorId, date, time) => {
    if (!date || !time) return true;

    try {
      console.log(
        `🔍 Checking vendor ${vendorId} availability on ${date} at ${time}`
      );

      const result = await availabilityAPI.checkVendorAvailability(vendorId, {
        date: date,
        time: time,
      });

      console.log(`  Result:`, result);
      console.log(
        `  → ${result.available ? "✅ AVAILABLE" : "❌ NOT AVAILABLE"}`
      );
      if (result.available_professionals) {
        console.log(`  → ${result.available_count} professional(s) available`);
      }

      return result.available;
    } catch (error) {
      console.error("Error checking availability:", error);
      return true; // Show vendor if check fails
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      const filters = {};
      if (selectedCategory) filters.category_slug = selectedCategory;
      if (searchText.trim()) filters.search = searchText.trim();

      const allVendors = await vendorsAPI.getAll(filters);

      // Filter by suburb/radius
      let filteredVendors = allVendors;

      if (suburb.trim()) {
        const userLocation = await geocodeLocation(suburb.trim());

        if (userLocation) {
          filteredVendors = await Promise.all(
            allVendors.map(async (vendor) => {
              if (!vendor.location) return null;

              const vendorLocation = await geocodeLocation(vendor.location);
              if (!vendorLocation) return null;

              const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                vendorLocation.lat,
                vendorLocation.lng
              );

              if (distance <= searchRadius) {
                return { ...vendor, distance: distance.toFixed(1) };
              }
              return null;
            })
          );

          filteredVendors = filteredVendors
            .filter((v) => v !== null)
            .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        }
      }

      // Filter by date/time availability
      if (selectedDate && selectedTime) {
        console.log(
          `\n📅 Filtering by availability: ${selectedDate} at ${selectedTime}\n`
        );

        const availabilityPromises = filteredVendors.map(async (vendor) => {
          const isAvailable = await checkVendorAvailability(
            vendor.id,
            selectedDate,
            selectedTime
          );
          return isAvailable ? vendor : null;
        });

        filteredVendors = (await Promise.all(availabilityPromises)).filter(
          (v) => v !== null
        );

        console.log(
          `\n✅ Found ${filteredVendors.length} vendors with availability\n`
        );
      }

      setVendors(filteredVendors);

      // Load services
      const servicesPromises = filteredVendors.map((vendor) =>
        servicesAPI
          .getVendorServices(vendor.id)
          .then((services) => ({ vendorId: vendor.id, services }))
          .catch(() => ({ vendorId: vendor.id, services: [] }))
      );

      const servicesResults = await Promise.all(servicesPromises);
      const servicesMap = {};
      servicesResults.forEach(({ vendorId, services }) => {
        servicesMap[vendorId] = services;
      });
      setVendorServices(servicesMap);

      // Load review counts
      const reviewPromises = filteredVendors.map((vendor) =>
        reviewsAPI
          .getVendorSummary(vendor.id)
          .then((summary) => ({
            vendorId: vendor.id,
            count: summary.total_reviews,
          }))
          .catch(() => ({ vendorId: vendor.id, count: 0 }))
      );

      const reviewResults = await Promise.all(reviewPromises);
      const reviewCountsMap = {};
      reviewResults.forEach(({ vendorId, count }) => {
        reviewCountsMap[vendorId] = count;
      });
      setVendorReviewCounts(reviewCountsMap);
    } catch (error) {
      console.error("Error searching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-beige-dark">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setMapsLoaded(true)}
        strategy="afterInteractive"
      />

      {/* Header */}
      <header className="bg-primary-100/90 backdrop-blur-md border-b border-primary-300/50 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
          <Link
            href="/"
            className="text-3xl font-serif text-neutral-900 hover:text-primary-700 transition"
          >
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

      <main className="max-w-[1400px] mx-auto px-8 py-12">
        {/* Search Bar */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-primary-300/50 shadow-lg mb-10">
          <h2 className="text-3xl font-serif text-neutral-900 mb-6">
            Find Your Perfect Beauty Professional
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* Suburb Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                📍 Suburb
              </label>
              <input
                ref={suburbInputRef}
                type="text"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., Auburn, Bondi"
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
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                📅 Date (optional)
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Time Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                🕐 Time (optional)
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                step="900"
                className="w-full px-4 py-3 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Search Text - Full Width */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              🔍 Search by name or keyword
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

          {/* Search Radius Slider */}
          {suburb && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                📏 Search Radius: {searchRadius} km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>1 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>
          )}

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
                setSelectedCategory("");
                handleSearch();
              }}
              className={`px-6 py-3 rounded-full text-base font-medium whitespace-nowrap transition ${
                !selectedCategory
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-white/90 backdrop-blur-sm text-neutral-900 hover:bg-primary-100 border border-primary-300/50"
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
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-white/90 backdrop-blur-sm text-neutral-900 hover:bg-primary-100 border border-primary-300/50"
                }`}
              >
                {cat.name}
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
              Enter your suburb and preferences to find beauty professionals
              near you
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-32">
            <div className="text-xl text-neutral-600">
              {selectedDate && selectedTime
                ? "Checking availability..."
                : "Searching nearby locations..."}
            </div>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-32 bg-white/90 backdrop-blur-sm rounded-3xl border border-primary-300/50 shadow-sm">
            <div className="text-7xl mb-6">😔</div>
            <h3 className="text-2xl font-serif text-neutral-900 mb-3">
              No Results Found
            </h3>
            <p className="text-lg text-neutral-600 mb-6">
              {selectedDate && selectedTime
                ? "No professionals available at this time. Try a different time or remove the date filter."
                : "Try increasing your search radius or adjusting your filters"}
            </p>
            <button
              onClick={() => {
                setHasSearched(false);
                setVendors([]);
                setSuburb("");
                setSelectedCategory("");
                setSearchText("");
                setSearchRadius(10);
                setSelectedDate("");
                setSelectedTime("");
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
                Found {vendors.length}{" "}
                {vendors.length === 1 ? "Professional" : "Professionals"}
              </h2>
              {suburb && (
                <p className="text-lg text-neutral-600">
                  within {searchRadius} km of {suburb}
                  {selectedDate && selectedTime && (
                    <>
                      {" "}
                      • Available on{" "}
                      {new Date(selectedDate).toLocaleDateString()} at{" "}
                      {selectedTime}
                    </>
                  )}
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
                            {vendor.business_name?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </span>
                        </div>
                      )}
                      {vendor.is_pro && (
                        <div className="absolute top-4 right-4 bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-md">
                          PRO
                        </div>
                      )}
                      {vendor.distance && (
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-neutral-900 text-sm font-medium px-3 py-1.5 rounded-full shadow-md">
                          {vendor.distance} km away
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-serif text-neutral-900 mb-2 line-clamp-1 group-hover:text-primary-700 transition">
                          {vendor.business_name}
                        </h3>
                        <div className="flex items-center gap-3 text-base">
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-900 font-semibold">
                              {vendor.rating.toFixed(1)}
                            </span>
                            <span className="text-xl">⭐</span>
                          </div>
                          <span className="text-neutral-500">
                            ({reviewCount} reviews)
                          </span>
                        </div>
                      </div>

                      {vendor.location && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">📍</span>
                          <p className="text-base text-neutral-600 line-clamp-1">
                            {vendor.location}
                          </p>
                        </div>
                      )}

                      {services.length > 0 ? (
                        <div className="space-y-3 mb-4">
                          {services.slice(0, 3).map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center justify-between text-base pb-3 border-b border-primary-100 last:border-0 last:pb-0"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-neutral-900 font-medium truncate">
                                  {service.name}
                                </p>
                                <p className="text-neutral-500 text-sm">
                                  {service.duration_minutes} min
                                </p>
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
                        <p className="text-base text-neutral-500 mb-4 italic">
                          No services listed yet
                        </p>
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
