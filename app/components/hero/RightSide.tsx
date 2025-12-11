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

interface RightSideProps {
  banners: Banner[];
  onBannerClick: (bannerId: string, section: 'right', position: number, link: string) => void;
  height?: string; // To match center height
  userLat?: number | null;
  userLng?: number | null;
}

export default function RightSide({ banners, onBannerClick, height = 'h-[480px]', userLat, userLng }: RightSideProps) {
  // Sort banners by distance if user location is available
  const sortedBanners = useMemo(() => {
    if (userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined) {
      const sorted = sortBannersByDistance(banners || [], userLat, userLng);
      return sorted.map(item => item.banner);
    }
    return banners || [];
  }, [banners, userLat, userLng]);

  // Show only first banner (single shop)
  const banner = useMemo(() => {
    return sortedBanners[0];
  }, [sortedBanners]);

  const renderPlaceholder = () => (
    <div
      className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
      onClick={() => window.location.href = '/advertise'}
      role="button"
      tabIndex={0}
      aria-label="Advertise here - Right Side"
    >
      <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="text-sm sm:text-base font-medium text-gray-600">Advertise Here</span>
    </div>
  );

  const distance = banner ? getBannerDistance(banner, userLat ?? null, userLng ?? null) : null;

  return (
    <div 
      className={`${height} overflow-hidden`} 
      aria-live="polite"
    >
      {banner ? (
        <div className="relative group w-full h-full">
          {/* Show shop with image */}
          <a
            href={banner.website || banner.link || `/shop/${banner.bannerId}`}
            target={banner.website ? '_blank' : undefined}
            rel={banner.website ? 'noopener noreferrer' : undefined}
            onClick={() => onBannerClick(banner.bannerId, 'right', 0, banner.website || banner.link)}
            className="relative block w-full h-full rounded-lg bg-white shadow-sm overflow-hidden hover:scale-[1.02] hover:shadow-md transition-all duration-150 group"
            aria-label={`Shop: ${banner.advertiser || banner.alt} - ${banner.area || ''} - Right Side`}
          >
            {/* Shop Image */}
            {banner.imageUrl && (
              <Image
                src={banner.imageUrl}
                alt={banner.advertiser || banner.alt}
                fill
                className="object-cover"
                loading="lazy"
                sizes="(max-width: 640px) 22vw, (max-width: 1024px) 18vw, 20vw"
              />
            )}
            
            {/* Overlay with shop info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col justify-end p-3 sm:p-4">
              <h3 className="text-sm sm:text-lg font-bold text-white mb-2 line-clamp-2 drop-shadow-lg">
                {banner.advertiser || banner.alt}
              </h3>
              
              {(banner.area || banner.city) && (
                <p className="text-xs sm:text-sm text-white/90 mb-2 line-clamp-1 drop-shadow">
                  📍 {banner.area || banner.city}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {(distance !== null || banner.distance !== undefined) && (
                  <p className="text-xs sm:text-sm text-blue-300 font-semibold drop-shadow">
                    {((distance ?? banner.distance) || 0).toFixed(1)} km
                  </p>
                )}
                {banner.visitorCount !== undefined && (
                  <p className="text-xs sm:text-sm text-white/80 font-semibold drop-shadow">
                    👁️ {banner.visitorCount || 0}
                  </p>
                )}
              </div>
              
              {(distance !== null || banner.distance !== undefined) && (
                <p className="text-xs sm:text-sm text-amber-300 font-semibold drop-shadow">
                  ⏱️ {Math.round(((distance ?? banner.distance) || 0) * 1.5)} min
                </p>
              )}
              
              {banner.website && (
                <p className="text-xs text-white/80 mt-2 truncate">
                  {banner.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                </p>
              )}
            </div>
          </a>
          
          {/* Distance Badge - Mobile */}
          {(distance !== null || banner.distance || banner.visitorCount !== undefined) && (
            <>
              <div className="absolute top-2 right-2 sm:hidden z-10">
                <div className="bg-blue-600 text-white px-2 py-1 rounded-md shadow-lg flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-bold leading-tight">
                      {((distance ?? banner.distance) || 0).toFixed(1)}km
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-semibold leading-tight">
                      {Math.round(((distance ?? banner.distance) || 0) * 1.5)}min
                    </span>
                  </div>
                  {banner.visitorCount !== undefined && (
                    <div className="flex items-center gap-0.5">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-[10px] font-semibold leading-tight">
                        {banner.visitorCount || 0}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Desktop: Hover overlay */}
              <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex flex-col items-center justify-end pb-4 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-white/20">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-bold text-gray-900">
                        {((distance ?? banner.distance) || 0).toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round(((distance ?? banner.distance) || 0) * 1.5)} min
                      </span>
                    </div>
                    {banner.visitorCount !== undefined && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="text-sm font-bold text-gray-900">
                          {banner.visitorCount || 0} visitors
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        renderPlaceholder()
      )}
    </div>
  );
}

