'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { BusinessSummary } from '../types';
import { useLocation } from '../contexts/LocationContext';
import { useSearch } from '../contexts/SearchContext';
import { safeJsonParse } from '../utils/fetchHelpers';

export default function FeaturedBusinesses() {
  const { location } = useLocation();
  const { searchParams, isSearchActive } = useSearch();
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Build API URL with filters
        let url = '/api/shops/nearby?useMongoDB=true&radiusKm=1000';
        
        // Add location coordinates if available
        if (location.latitude && location.longitude) {
          url += `&userLat=${location.latitude}&userLng=${location.longitude}`;
        }
        
        // Add search filters
        if (searchParams.pincode) {
          url += `&pincode=${encodeURIComponent(searchParams.pincode)}`;
        }
        if (searchParams.city) {
          url += `&city=${encodeURIComponent(searchParams.city)}`;
        }
        if (searchParams.category) {
          url += `&category=${encodeURIComponent(searchParams.category)}`;
        }
        if (searchParams.shopName) {
          url += `&shopName=${encodeURIComponent(searchParams.shopName)}`;
        }
        
        const res = await fetch(url);
        const data = await safeJsonParse<{ success?: boolean; shops?: any[] }>(res);
        
        if (data?.success && data?.shops) {
          // Filter visible shops and map to BusinessSummary format
          const visibleShops = data.shops
            .filter((shop: any) => shop.isVisible !== false)
            .map((shop: any) => ({
              id: shop.id || shop._id,
              name: shop.shopName || shop.name || 'Unnamed Shop',
              category: shop.category || 'Uncategorized',
              imageUrl: shop.photoUrl || shop.iconUrl || shop.imageUrl || '/placeholder-shop.jpg',
              rating: shop.rating || 4.0,
              reviews: shop.reviews || 0,
              city: shop.city || 'Unknown',
              state: shop.state,
              distance: shop.distance,
              visitorCount: shop.visitorCount || 0,
            }));
          
          // Filter by shop name if search query provided
          let filteredShops = visibleShops;
          if (searchParams.shopName) {
            const query = searchParams.shopName.toLowerCase();
            filteredShops = visibleShops.filter(shop =>
              shop.name.toLowerCase().includes(query)
            );
          }
          
          // Sort by featured/priority, then by distance
          filteredShops.sort((a: any, b: any) => {
            if (a.distance !== undefined && b.distance !== undefined) {
              return a.distance - b.distance;
            }
            return (b.visitorCount || 0) - (a.visitorCount || 0);
          });
          
          // Take top 10 for featured
          setBusinesses(filteredShops.slice(0, 10));
        } else {
          // Fallback to featured API if no shops found
          const fallbackRes = await fetch('/api/businesses/featured');
          const fallbackData = await safeJsonParse<{ businesses?: BusinessSummary[] }>(fallbackRes);
          setBusinesses(fallbackData?.businesses || []);
        }
      } catch (e) {
        console.error('Failed to load featured businesses', e);
        // Fallback to featured API on error
        try {
          const fallbackRes = await fetch('/api/businesses/featured');
          const fallbackData = await safeJsonParse<{ businesses?: BusinessSummary[] }>(fallbackRes);
          setBusinesses(fallbackData?.businesses || []);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [location, searchParams, isSearchActive]);

  if (isLoading) {
    return (
      <section className="py-10 px-2 sm:px-3 lg:px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[98%] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-0">
            <div>
              <div className="h-8 w-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-2 animate-pulse" />
              <div className="h-5 w-80 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl bg-white shadow-lg border-2 border-gray-200 overflow-hidden">
                <div className="h-44 sm:h-52 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                <div className="p-4">
                  <div className="h-6 w-3/4 bg-gray-200 rounded-lg mb-3 animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-12 px-2 sm:px-3 lg:px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-[98%] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-0">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
              Featured Businesses {location.city || 'Patna'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2 font-medium">Discover top-rated businesses in your area</p>
          </div>
          <Link href="/search?featured=1" className="inline-flex items-center gap-2 px-4 py-2 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg self-start sm:self-auto group">
            <span>View all</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        {businesses.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-2">No shops found</p>
            <p className="text-gray-500 text-sm">
              {isSearchActive 
                ? 'Try adjusting your search filters'
                : 'No featured shops available at the moment'}
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {businesses.map((biz: any, index) => {
              const distance = biz.distance !== undefined ? biz.distance.toFixed(1) : 'N/A';
            
            return (
                <Link key={biz.id} href={`/shop/${biz.id}`}>
                  <article className="group rounded-xl bg-white shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-300 cursor-pointer">
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  <Image 
                    src={biz.imageUrl} 
                    alt={biz.name} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-110" 
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" 
                  />
                  {index < 3 && !isSearchActive && (
                    <span className="absolute top-2 right-2 z-20 inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-500 text-white shadow-md">
                      Featured
                    </span>
                  )}
                  {/* Rating Badge */}
                  <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm shadow-md border border-gray-200">
                    <span className="text-yellow-500 text-sm font-black">★</span>
                    <span className="text-sm font-black text-gray-900">{biz.rating.toFixed(1)}</span>
                    {biz.reviews > 0 && (
                      <span className="text-xs text-gray-500 ml-1">({biz.reviews})</span>
                    )}
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
                    {biz.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">
                      {distance !== 'N/A' && `${distance}km`} {biz.city}
                    </span>
                  </div>
                </div>
              </article>
                </Link>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}
