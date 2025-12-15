'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useLocation } from '@/app/contexts/LocationContext';
import Navbar from '@/app/components/Navbar';
import type { BusinessSummary } from '@/app/types';
import { calculateDistance } from '@/app/utils/distance';

type BusinessDetail = BusinessSummary & {
  distance?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  website?: string;
  openingHours?: string;
};

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { location } = useLocation();
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setIsLoading(true);
        const businessId = params.id as string;

        // Try to fetch from API first
        try {
          const response = await fetch(`/api/businesses/${businessId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.business) {
              setBusiness(data.business);
              setIsLoading(false);
              return;
            }
          }
        } catch (apiError) {
          console.warn('API fetch failed, using mock data');
        }

        // Fallback to mock data
        const mockBusiness: BusinessDetail = {
          id: businessId,
          name: `Business ${businessId}`,
          category: 'Restaurant',
          imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&auto=format&fit=crop',
          rating: 4.5 + Math.random() * 0.5,
          reviews: Math.floor(Math.random() * 300) + 50,
          city: location.city,
          state: location.state,
          address: '123 Main Street, ' + location.city,
          phone: '+91 9876543210',
          email: 'contact@business.com',
          description: 'A wonderful place to visit with excellent service and great atmosphere.',
          website: 'https://example.com',
          openingHours: 'Mon-Sun: 9:00 AM - 10:00 PM',
          latitude: location.latitude ? location.latitude + (Math.random() - 0.5) * 0.1 : undefined,
          longitude: location.longitude ? location.longitude + (Math.random() - 0.5) * 0.1 : undefined,
        };

        // Calculate distance if coordinates are available
        if (mockBusiness.latitude && mockBusiness.longitude && location.latitude && location.longitude) {
          mockBusiness.distance = calculateDistance(
            location.latitude,
            location.longitude,
            mockBusiness.latitude,
            mockBusiness.longitude
          );
        }

        setBusiness(mockBusiness);
      } catch (err) {
        setError('Failed to load business details');
        console.error('Error fetching business:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchBusiness();
    }
  }, [params.id, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-xl mb-6" />
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The business you are looking for does not exist.'}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-custom-gradient text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const estimatedTime = business.distance ? Math.round(business.distance * 1.5) : null;

  // Generate structured data for SEO
  const structuredData = business ? {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    image: business.imageUrl,
    description: business.description || `${business.name} - ${business.category} in ${business.city || ''}`,
    address: business.address ? {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: business.city || '',
      addressRegion: business.state || '',
      addressCountry: 'IN',
    } : undefined,
    geo: business.latitude && business.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: business.latitude,
      longitude: business.longitude,
    } : undefined,
    telephone: business.phone,
    email: business.email,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/contact/${params.id}`,
    priceRange: '$$',
    servesCuisine: business.category,
    areaServed: {
      '@type': 'City',
      name: business.city || 'Patna',
    },
    aggregateRating: business.rating ? {
      '@type': 'AggregateRating',
      ratingValue: business.rating,
      reviewCount: business.reviews || 0,
    } : undefined,
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </button>

        {/* Business Image */}
        <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-xl mb-6">
          <Image
            src={business.imageUrl}
            alt={business.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Distance and Time Badge */}
          {(business.distance || estimatedTime) && (
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-lg border border-white/50">
              <div className="flex flex-col gap-1.5">
                {business.distance && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-base font-bold text-gray-900">{business.distance.toFixed(1)} km</span>
                  </div>
                )}
                {estimatedTime && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-base font-bold text-gray-900">{estimatedTime} min</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Business Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{business.name}</h1>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-lg">{business.category}</span>
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <div>
                  <div className="text-xl font-bold text-gray-900">{business.rating.toFixed(1)}</div>
                  <div className="text-xs text-gray-600">{business.reviews} reviews</div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {business.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-700 leading-relaxed">{business.description}</p>
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Address */}
            {business.address && (
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-gray-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                  <p className="text-gray-700">{business.address}</p>
                  <p className="text-gray-600">{business.city}{business.state ? `, ${business.state}` : ''}</p>
                </div>
              </div>
            )}

            {/* Phone */}
            {business.phone && (
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-gray-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.129a11.042 11.042 0 005.516 5.516l1.129-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 19.72V23a2 2 0 01-2 2h-1C9.163 25 3 18.837 3 11V5z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                  <a href={`tel:${business.phone}`} className="text-gray-700 hover:text-amber-600 transition-colors">
                    {business.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {business.email && (
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-gray-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <a href={`mailto:${business.email}`} className="text-gray-700 hover:text-amber-600 transition-colors">
                    {business.email}
                  </a>
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {business.openingHours && (
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-gray-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Opening Hours</h3>
                  <p className="text-gray-700">{business.openingHours}</p>
                </div>
              </div>
            )}
          </div>

          {/* Call Now Button */}
          {business.phone && (
            <div className="pt-6 border-t border-gray-200">
              <a
                href={`tel:${business.phone}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-custom-gradient text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl hover:opacity-95 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.129a11.042 11.042 0 005.516 5.516l1.129-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 19.72V23a2 2 0 01-2 2h-1C9.163 25 3 18.837 3 11V5z" />
                </svg>
                <span>Call Now</span>
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


