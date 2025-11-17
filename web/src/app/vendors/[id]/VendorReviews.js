'use client';
import { useState, useEffect } from 'react';
import { reviewsAPI } from '@/lib/api';

export default function VendorReviews({ vendorId }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
    loadSummary();
  }, [vendorId]);

  const loadReviews = async () => {
    try {
      const data = await reviewsAPI.getVendorReviews(vendorId);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await reviewsAPI.getVendorSummary(vendorId);
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 border border-primary-200">
        <h2 className="text-2xl font-serif mb-4 text-neutral-900">⭐ Reviews</h2>
        <div className="text-center py-8 text-neutral-600">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 border border-primary-200">
      <h2 className="text-2xl font-serif mb-6 text-neutral-900">⭐ Reviews</h2>

      {summary && summary.total_reviews > 0 ? (
        <>
          {/* Rating Summary */}
          <div className="bg-primary-50 rounded-xl p-6 mb-8 border border-primary-200">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-5xl font-serif text-neutral-900 mb-2">
                  {summary.average_rating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(summary.average_rating))}
                </div>
                <div className="text-neutral-600">
                  Based on {summary.total_reviews} {summary.total_reviews === 1 ? 'review' : 'reviews'}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.rating_distribution[star.toString()] || 0;
                  const percentage = summary.total_reviews > 0 
                    ? (count / summary.total_reviews) * 100 
                    : 0;

                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-neutral-700 w-12">
                        {star} ★
                      </span>
                      <div className="flex-1 bg-neutral-200 rounded-full h-2.5">
                        <div
                          className="bg-yellow-400 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-neutral-600 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-primary-100 pb-6 last:border-b-0">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-neutral-900 mb-1">
                      {review.customer_name}
                    </div>
                    <div className="flex items-center gap-3">
                      {renderStars(review.rating)}
                      <span className="text-xs text-neutral-500">
                        • {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                  <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-1 rounded border border-primary-300">
                    ✓ Verified Booking
                  </span>
                </div>

                {review.review_text && (
                  <p className="text-neutral-700 leading-relaxed mb-3">
                    {review.review_text}
                  </p>
                )}

                {/* ADDED: Professional and Service info */}
                <div className="flex flex-wrap gap-3 text-sm text-neutral-500">
                  {review.professional_name && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-neutral-700">Professional:</span>
                      <span>{review.professional_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-neutral-700">Service:</span>
                    <span>{review.service_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-primary-50 rounded-lg p-12 text-center border border-primary-200">
          <div className="text-5xl mb-3">⭐</div>
          <p className="text-neutral-600 mb-2">No reviews yet</p>
          <p className="text-sm text-neutral-500">
            Be the first to review this vendor!
          </p>
        </div>
      )}
    </div>
  );
}