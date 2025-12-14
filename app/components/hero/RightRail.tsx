'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { sortBannersByDistance, getBannerDistance } from '../../utils/shopDistance';

interface Banner {
  bannerId: string;
  imageUrl: string;
  alt: string;
  link: string;
  advertiser?: string;
  lat?: number;
  lng?: number;
  distance?: number;
  isBusiness?: boolean;
  website?: string;
  area?: string;
  city?: string;
  visitorCount?: number;
}

interface RightRailProps {
  banners: Banner[];
  onBannerClick: (bannerId: string, section: 'right', position: number, link: string) => void;
  height?: string; // To match center height
  userLat?: number | null;
  userLng?: number | null;
}

// Fallback banners removed - only shops will be shown

export default function RightRail({ banners, onBannerClick, height = 'h-[480px]', userLat, userLng }: RightRailProps) {
  // Sort banners by distance if user location is available
  const sortedBanners = useMemo(() => {
    if (userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined) {
      const sorted = sortBannersByDistance(banners || [], userLat, userLng);
      return sorted.map(item => item.banner);
    }
    return banners || [];
  }, [banners, userLat, userLng]);

  // Show only first 3 banners (no rotation) - only shops
  const currentBanners = useMemo(() => {
    // Show all shops (with or without websites)
    return sortedBanners.slice(0, 3);
  }, [sortedBanners]);

  const renderPlaceholder = (position: number) => (
    <div
      className="w-full flex-1 min-h-[56px] sm:min-h-[125px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
      onClick={() => window.location.href = '/advertise'}
      role="button"
      tabIndex={0}
      aria-label={`Advertise here - Right position ${position + 1}`}
    >
      <svg className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400 mb-0.5 sm:mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="text-[10px] sm:text-xs font-medium text-gray-600">Advertise</span>
    </div>
  );

  return (
    <div 
      className={`flex flex-col gap-2 ${height} overflow-hidden items-end`} 
      aria-live="polite"
    >
      <div className="w-full h-full flex flex-col gap-2">
        {[0, 1, 2].map((index) => {
          const banner = currentBanners[index];
          const distance = banner ? getBannerDistance(banner, userLat ?? null, userLng ?? null) : null;
          return banner ? (
            <div
              key={`right-rail-${index}-${banner.bannerId || index}`}
              className="group w-full flex-1 min-h-0"
            >
              {/* Professional Card Layout: Image on top, Text below - Flexible height */}
              <a
                href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                target={banner.website ? '_blank' : undefined}
                rel={banner.website ? 'noopener noreferrer' : undefined}
                onClick={() => onBannerClick(banner.bannerId, 'right', index, banner.website || banner.link)}
                className="w-full h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col"
                aria-label={`Shop: ${banner.advertiser || banner.alt} - ${banner.area || ''} - Right slot ${index + 1}`}
              >
                {/* Image Section - Full width and height */}
                <div className="relative w-full flex-1 bg-gray-100 overflow-hidden min-h-[80px]">
                  {banner.imageUrl ? (
                  <Image
                    src={banner.imageUrl}
                    alt={banner.advertiser || banner.alt}
                    fill
                      sizes="(max-width: 640px) 22vw, (max-width: 1024px) 18vw, 20vw"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      style={{ 
                        objectFit: 'cover',
                        objectPosition: 'center',
                        width: '100%',
                        height: '100%'
                      }}
                    loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                )}
                </div>

                {/* Text Content Section - Professional and visible */}
                <div className="p-3.5 shrink-0 bg-gradient-to-b from-white to-gray-50 relative z-10 border-t border-gray-200">
                  {/* Shop Name */}
                  <h3 className="text-sm sm:text-base font-black text-gray-900 leading-snug mb-2.5 break-words tracking-tight">
                    {banner.advertiser || banner.alt}
                  </h3>

                  {/* Location */}
                  {(banner.area || banner.city) && (
                    <div className="flex items-start gap-1.5 text-xs sm:text-sm font-bold text-gray-700 mb-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span className="break-words flex-1 leading-relaxed">{banner.area || banner.city}</span>
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="flex items-center justify-between pt-2.5 border-t-2 border-gray-200">
                    {((distance !== null && distance !== undefined) || (banner.distance !== null && banner.distance !== undefined)) && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md border border-blue-200">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs sm:text-sm font-bold text-blue-700">{((distance ?? banner.distance) ?? 0).toFixed(1)} km</span>
                      </div>
                    )}
                    {banner.visitorCount !== undefined && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md border border-gray-300">
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="text-xs sm:text-sm font-bold text-gray-800">{banner.visitorCount || 0}</span>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            </div>
          ) : (
            <div key={`right-placeholder-${index}`} className="w-full">
              {renderPlaceholder(index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
