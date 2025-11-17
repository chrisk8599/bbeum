'use client';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

/**
 * ProtectedRoute component - wraps pages that require authentication
 * 
 * Usage:
 * <ProtectedRoute allowedUserTypes={['vendor']}>
 *   <YourPageContent />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedUserTypes = [] }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // No user - redirect to landing page
    if (!user) {
      console.log('No user found, redirecting to home');
      router.push('/');
      return;
    }

    // User exists but wrong type - redirect to their correct dashboard
    if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(user.user_type)) {
      console.log(`Wrong user type: ${user.user_type}, redirecting...`);
      
      // Redirect to appropriate page based on user type
      if (user.user_type === 'vendor') {
        router.push('/vendor/dashboard');
      } else if (user.user_type === 'professional') {
        router.push('/professional/dashboard');
      } else if (user.user_type === 'customer') {
        router.push('/browse');
      } else {
        router.push('/');
      }
      return;
    }
  }, [user, loading, router, allowedUserTypes]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // No user - don't render anything (redirecting)
  if (!user) {
    return null;
  }

  // Wrong user type - don't render anything (redirecting)
  if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(user.user_type)) {
    return null;
  }

  // All checks passed - render the protected content
  return <>{children}</>;
}