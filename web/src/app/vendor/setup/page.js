'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { vendorsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import ProtectedRoute from '@/components/ProtectedRoute';
export default function VendorSetup() {
  const { user } = useAuth();
  const router = useRouter();
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  
  const [formData, setFormData] = useState({
    business_name: user?.full_name || '',
    bio: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const initAutocomplete = () => {
    if (!addressInputRef.current || autocompleteRef.current) return;
    if (!window.google?.maps?.places) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'au' },
          fields: ['formatted_address']
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          setFormData(prev => ({
            ...prev,
            location: place.formatted_address
          }));
        }
      });
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
  };

  useEffect(() => {
    if (mapsLoaded) {
      initAutocomplete();
    }
  }, [mapsLoaded]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.bio.length < 50) {
      setError('Bio must be at least 50 characters');
      return;
    }

    setLoading(true);

    try {
      await vendorsAPI.setupProfile(formData);
      router.push('/vendor/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to set up profile');
    } finally {
      setLoading(false);
    }
  };

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <ProtectedRoute allowedUserTypes={['vendor']}>
      {googleMapsApiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`}
          onLoad={() => setMapsLoaded(true)}
          strategy="afterInteractive"
        />
      )}
      
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white p-10 rounded-2xl shadow-sm max-w-2xl w-full border border-neutral-200">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif mb-3 text-neutral-900">Set Up Your Profile</h1>
            <p className="text-lg text-neutral-600">
              Let's get your professional profile ready for customers
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-200">
              {error}
            </div>
          )}

          {!googleMapsApiKey && (
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl mb-6 text-sm border border-yellow-200">
              ⚠️ Google Maps API key not configured. Address autocomplete disabled.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white transition"
                placeholder="e.g. Maria's Beauty Studio"
              />
              <p className="text-xs text-neutral-500 mt-2">
                This is how customers will find you
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Bio *
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white transition resize-none"
                placeholder="Tell customers about your experience, specialties, and what makes you unique..."
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-neutral-500">
                  Minimum 50 characters
                </p>
                <p className={`text-xs ${formData.bio.length >= 50 ? 'text-green-600' : 'text-neutral-400'}`}>
                  {formData.bio.length}/50
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Business Address *
              </label>
              <input
                ref={addressInputRef}
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white transition"
                placeholder="Start typing your address..."
              />
              <p className="text-xs text-neutral-500 mt-2">
                {mapsLoaded 
                  ? '📍 Start typing and select your address from the dropdown'
                  : googleMapsApiKey 
                    ? '⏳ Loading address autocomplete...'
                    : '✍️ Enter your business address'}
              </p>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
              <p className="text-sm text-neutral-700">
                <span className="font-medium">💡 Next steps:</span> After setup, you can add services, upload photos, and set your availability
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-4 rounded-xl font-medium hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition shadow-sm hover:shadow-md"
            >
              {loading ? 'Setting up...' : 'Complete Setup & Go to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}