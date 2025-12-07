'use client';

import { useEffect, useState } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { useDistance } from '../contexts/DistanceContext';
import type { BusinessSummary } from '../types';
import { safeJsonParse } from '../utils/fetchHelpers';
import ShopCard from './ShopCard';

interface ShopWithDistance extends BusinessSummary {
  distance: number; // Distance in kilometers
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  offerPercent?: number;
  priceLevel?: string;
  tags?: string[];
  featured?: boolean;
  sponsored?: boolean;
  visitorCount?: number; // Number of visitors
  planType?: 'BASIC' | 'PREMIUM' | 'FEATURED'; // Pricing plan
  priorityRank?: number; // Priority ranking
}

interface NearbyBusinessesProps {
  limit?: number; // Number of shops to show
}

export default function NearbyBusinesses({ limit = 6 }: NearbyBusinessesProps) {
  const { location } = useLocation();
  const { distance, isMounted } = useDistance(); // Get distance and isMounted from context
  const [businesses, setBusinesses] = useState<ShopWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for distance to be loaded from localStorage to avoid hydration mismatch
    if (!isMounted) {
      return;
    }

    // Only fetch if we have location coordinates
    if (!location.latitude || !location.longitude) {
      // Try to get location from browser if not set
      if (navigator.geolocation && !location.latitude) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Location will be set by LocationContext, so we'll refetch
          },
          () => {
            setIsLoading(false);
          }
        );
      } else {
        setIsLoading(false);
      }
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Use radiusKm parameter (0 = all shops)
        const radiusParam = distance > 0 ? `&radiusKm=${distance}` : '&radiusKm=0';
        const res = await fetch(
          `/api/shops/nearby?userLat=${location.latitude}&userLng=${location.longitude}${radiusParam}&useMongoDB=true${location.city ? `&city=${encodeURIComponent(location.city)}` : ''}${location.area ? `&area=${encodeURIComponent(location.area)}` : ''}${location.pincode ? `&pincode=${location.pincode}` : ''}`
        );
        const data = await safeJsonParse<{ shops?: ShopWithDistance[]; success?: boolean }>(res);
        
        if (data?.success && data?.shops) {
          setBusinesses(data.shops.slice(0, limit));
        } else {
          // Fallback to featured if nearby fails
          const fallbackRes = await fetch('/api/businesses/featured');
          const fallbackData = await safeJsonParse<{ businesses?: BusinessSummary[] }>(fallbackRes);
          // Map featured businesses to ShopWithDistance format (without distance)
          const mappedBusinesses: ShopWithDistance[] = (fallbackData?.businesses || []).map(biz => ({
            ...biz,
            distance: 0, // No distance info for featured
          }));
          setBusinesses(mappedBusinesses.slice(0, limit));
        }
      } catch (e) {
        console.error('Failed to load nearby businesses:', e);
        // Fallback to featured if nearby fails
        try {
          const res = await fetch('/api/businesses/featured');
          const data = await safeJsonParse<{ businesses?: BusinessSummary[] }>(res);
          // Map featured businesses to ShopWithDistance format (without distance)
          const mappedBusinesses: ShopWithDistance[] = (data?.businesses || []).map(biz => ({
            ...biz,
            distance: 0, // No distance for featured businesses
          }));
          setBusinesses(mappedBusinesses.slice(0, limit));
        } catch (err) {
          console.error('Failed to load featured businesses', err);
          setBusinesses([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [location.latitude, location.longitude, distance, limit, isMounted]);

  if (isLoading) {
    return (
      <section className="py-10 px-2 sm:px-3 lg:px-4 bg-linear-to-b from-white to-gray-50">
        <div className="max-w-[98%] mx-auto">
          <div className="h-8 w-56 bg-linear-to-r from-gray-200 to-gray-300 rounded-lg mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
                <div className="h-60 bg-linear-to-br from-gray-200 to-gray-300 animate-pulse" />
                <div className="p-6">
                  <div className="h-6 w-3/4 bg-gray-200 rounded-lg mb-4 animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded mb-3 animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-8 px-2 sm:px-3 lg:px-4 bg-linear-to-b from-white to-gray-50 border-t border-gray-200">
      <div className="max-w-[98%] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {distance === 0 ? 'Nearby Shops' : `Shops within ${distance} km`}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              {distance === 0 
                ? `Shops near ${location.displayName || 'your location'}`
                : `Shops within ${distance} km of ${location.displayName || 'your location'}`
              }
            </p>
          </div>
          <a href="/search?type=nearby" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors self-start sm:self-auto group">
            <span>View all</span>
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </a>
        </div>

        {businesses.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm mb-1">No shops found</p>
            <p className="text-gray-500 text-xs">
              {!location.latitude || !location.longitude
                ? 'Please enable location access to see nearby shops'
                : distance > 0
                ? `No shops found within ${distance} km`
                : 'No shops available in your area'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 -mx-2 sm:-mx-3 lg:-mx-4 px-2 sm:px-3 lg:px-4">
            <div className="flex gap-4 sm:gap-5 min-w-max">
              {businesses.map((biz) => (
                <div key={biz.id} className="flex-shrink-0 w-72 sm:w-80">
                  <ShopCard
                    id={biz.id}
                    name={biz.name}
                    category={biz.category}
                    imageUrl={biz.imageUrl}
                    rating={biz.rating}
                    reviews={biz.reviews}
                    city={biz.city}
                    state={biz.state}
                    distance={biz.distance}
                    visitorCount={biz.visitorCount}
                    planType={biz.planType || 'BASIC'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

