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
    <article className="group rounded-2xl bg-white shadow-lg border-2 border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 cursor-pointer flex flex-col h-full">
      {/* Clean Image Section - No Overlays */}
      <div className="relative h-44 sm:h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <Image 
          src={imageUrl} 
          alt={name} 
          fill 
          className="object-cover transition-transform duration-700 group-hover:scale-110" 
          sizes="(max-width: 1024px) 50vw, 33vw" 
        />
      </div>

      {/* All Content Below Image */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col bg-gradient-to-b from-white via-white to-gray-50">
        {/* Top Row: Category and Rating */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          {/* Category Badge */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black bg-gray-100 text-gray-900 shadow-sm border border-gray-300 uppercase tracking-wide">
            {category}
          </span>
          
          {/* Rating Badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-50 border border-yellow-200">
            <span className="text-yellow-500 text-xs sm:text-sm font-black">★</span>
            <span className="text-xs sm:text-sm font-black text-gray-900">{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Plan Badge */}
        {planType === 'FEATURED' && (
          <div className="mb-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md border border-purple-500/50">
              ⭐ Featured
            </span>
          </div>
        )}
        {planType === 'PREMIUM' && (
          <div className="mb-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md border border-green-500/50">
              ✨ Premium
            </span>
          </div>
        )}

        {/* Shop Name */}
        <h3 className="text-sm sm:text-base font-black text-gray-900 mb-2.5 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
          {name}
        </h3>
        
        {/* Location */}
        {city && (
          <div className="flex items-start gap-1.5 mb-3">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="text-xs sm:text-sm font-semibold text-gray-700 break-words flex-1 leading-relaxed line-clamp-1">
              {city}{state ? `, ${state}` : ''}
            </span>
          </div>
        )}

        {/* Stats Row */}
        <div className="mt-auto pt-2.5 border-t-2 border-gray-200">
          <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
            {/* Distance */}
            {distance > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md border border-blue-200/80">
                <svg className="w-3 h-3 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] sm:text-xs font-bold text-blue-700">{distance.toFixed(1)}km</span>
              </div>
            )}
            
            {/* Travel Time */}
            {travelTimeText && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-md border border-orange-200/80">
                <svg className="w-3 h-3 text-orange-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[10px] sm:text-xs font-bold text-orange-700">{travelTimeText}</span>
              </div>
            )}
            
            {/* Visitor Count */}
            {visitorCount !== undefined && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md border border-gray-300/80">
                <svg className="w-3 h-3 text-gray-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-[10px] sm:text-xs font-bold text-gray-800">{visitorCount || 0}visitor</span>
              </div>
            )}
          </div>

          {/* Bottom: Rating and Call Button */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/50">
            {/* Rating */}
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
              <span className="text-gray-500 font-normal text-[10px]">({reviews})</span>
            </div>

            {/* Call Button */}
            <a 
              href={`/contact/${id}`} 
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-[10px] sm:text-xs font-black text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                if (onCall) onCall();
              }}
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.129a11.042 11.042 0 005.516 5.516l1.129-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 19.72V23a2 2 0 01-2 2h-1C9.163 25 3 18.837 3 11V5z" />
              </svg>
              <span className="hidden sm:inline">Call</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

