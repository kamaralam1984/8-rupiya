'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { calculateTravelTime, formatTravelTime } from '../utils/distance';

interface ShopCardProps {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  city?: string;
  state?: string;
  distance: number;
  visitorCount?: number;
  planType?: 'BASIC' | 'PREMIUM' | 'FEATURED';
  onCall?: () => void;
}

export default function ShopCard({
  id,
  name,
  category,
  imageUrl,
  rating,
  reviews,
  city,
  state,
  distance,
  visitorCount,
  planType = 'BASIC',
  onCall,
}: ShopCardProps) {
  // Track visit when shop card is viewed
  useEffect(() => {
    if (id) {
      fetch(`/api/shops/${id}/visit`, { method: 'POST' }).catch(() => {
        // Silently fail if tracking doesn't work
      });
    }
  }, [id]);

  // Calculate travel time
  const travelTimeMinutes = distance > 0 ? calculateTravelTime(distance) : 0;
  const travelTimeText = travelTimeMinutes > 0 ? formatTravelTime(travelTimeMinutes) : '';

  return (
    <article className="group rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-green-200 h-full">
      <div className="relative h-48 sm:h-52 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent z-10" />
        <Image src={imageUrl} alt={name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 1024px) 50vw, 33vw" />
        <span className="absolute top-3 left-3 z-20 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-white/95 backdrop-blur-sm text-gray-800 shadow-md border border-gray-200/50">
          {category}
        </span>
                {/* Plan Badge */}
                {planType === 'FEATURED' && (
                  <span className="absolute top-3 right-3 z-20 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/95 backdrop-blur-sm text-white shadow-md border border-purple-300/50">
                    ⭐ Featured
                  </span>
                )}
                {planType === 'PREMIUM' && (
                  <span className="absolute top-3 right-3 z-20 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/95 backdrop-blur-sm text-white shadow-md border border-green-300/50">
                    ✨ Premium
                  </span>
                )}
                {planType === 'BASIC' && (
                  <span className="absolute top-3 right-3 z-20 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/95 backdrop-blur-sm text-white shadow-md border border-blue-300/50">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Nearby
                  </span>
                )}
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">{name}</h3>
        
        {/* All Info in One Line: km, min, visitor, location */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-4">
          {/* Distance */}
          {distance > 0 && (
            <span className="font-semibold text-gray-700">{distance.toFixed(1)} km</span>
          )}
          
          {/* Separator */}
          {distance > 0 && (travelTimeMinutes > 0 || visitorCount !== undefined || city) && (
            <span className="text-gray-400">•</span>
          )}
          
          {/* Travel Time */}
          {travelTimeMinutes > 0 && (
            <>
              <span className="font-semibold text-gray-700">{travelTimeMinutes} min</span>
              {(visitorCount !== undefined || city) && (
                <span className="text-gray-400">•</span>
              )}
            </>
          )}
          
          {/* Visitor Count */}
          {visitorCount !== undefined && (
            <>
              <span className="font-semibold text-gray-700">{visitorCount || 0} visitor</span>
              {city && (
                <span className="text-gray-400">•</span>
              )}
            </>
          )}
          
          {/* Location */}
          {city && (
            <span className="text-gray-700 truncate">
              📍 {city}{state ? `, ${state}` : ''}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <svg className="w-5 h-5 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-gray-900">{rating.toFixed(1)}</span>
            <span className="text-gray-500 font-normal">({reviews})</span>
          </div>

          <a href={`/contact/${id}`} className="inline-flex items-center gap-2 rounded-xl bg-custom-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all w-full sm:w-auto justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.129a11.042 11.042 0 005.516 5.516l1.129-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 19.72V23a2 2 0 01-2 2h-1C9.163 25 3 18.837 3 11V5z" />
            </svg>
            <span>Call Now</span>
          </a>
        </div>
      </div>
    </article>
  );
}

