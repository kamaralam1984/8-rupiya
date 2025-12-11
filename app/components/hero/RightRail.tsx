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
      className={`flex flex-col gap-1 sm:gap-2 ${height} overflow-hidden items-end`} 
      aria-live="polite"
    >
      <div className="w-full h-full flex flex-col gap-1 sm:gap-2">
        {[0, 1, 2].map((index) => {
          const banner = currentBanners[index];
          const distance = banner ? getBannerDistance(banner, userLat ?? null, userLng ?? null) : null;
          return banner ? (
            <div
              key={`right-rail-${index}-${banner.bannerId || index}`}
              className="relative group w-full"
            >
              {/* Show shop with image */}
              <a
                href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                target={banner.website ? '_blank' : undefined}
                rel={banner.website ? 'noopener noreferrer' : undefined}
                onClick={() => onBannerClick(banner.bannerId, 'right', index, banner.website || banner.link)}
                className="relative block w-full flex-1 min-h-[56px] sm:min-h-[125px] rounded-lg bg-white shadow-sm overflow-hidden hover:scale-[1.02] hover:shadow-md transition-all duration-150 group"
                aria-label={`Shop: ${banner.advertiser || banner.alt} - ${banner.area || ''} - Right slot ${index + 1}`}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col justify-end p-2 sm:p-3">
                  <h3 className="text-[10px] sm:text-xs font-bold text-white mb-0.5 line-clamp-2 drop-shadow-lg">
                    {banner.advertiser || banner.alt}
                  </h3>
                  {(banner.area || banner.city) && (
                    <p className="text-[8px] sm:text-[10px] text-white/90 mb-1 line-clamp-1 drop-shadow">
                      📍 {banner.area || banner.city}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    {(distance !== null || banner.distance !== undefined) && (
                      <p className="text-[8px] sm:text-[10px] text-amber-300 font-semibold drop-shadow">
                        {((distance ?? banner.distance) || 0).toFixed(1)} km
                      </p>
                    )}
                    {banner.visitorCount !== undefined && (
                      <p className="text-[8px] sm:text-[10px] text-white/80 font-semibold drop-shadow">
                        👁️ {banner.visitorCount || 0}
                      </p>
                    )}
                  </div>
                  {(distance !== null || banner.distance !== undefined) && (
                    <p className="text-[7px] sm:text-[9px] text-amber-300 font-semibold drop-shadow">
                      ⏱️ {Math.round(((distance ?? banner.distance) || 0) * 1.5)} min
                    </p>
                  )}
                  {banner.website && (
                    <p className="text-[7px] sm:text-[9px] text-white/80 mt-1 truncate">
                      {banner.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </p>
                  )}
                </div>
              </a>
              {/* Distance and Call Button Overlay */}
              {(distance !== null || banner.isBusiness) && (
                <>
                  {/* Distance, Time, Visitor - Simple text format (Mobile) */}
                  {(distance !== null || banner.distance || banner.visitorCount !== undefined) && (
                    <div className="absolute bottom-1 left-1 right-1 sm:hidden z-10">
                      <div className="text-blue-700 text-[8px] font-bold text-center bg-white/90 px-1 py-0.5 rounded">
                        {((distance ?? banner.distance) || 0).toFixed(1).padStart(4, '0')}km / {Math.round(((distance ?? banner.distance) || 0) * 1.5).toString().padStart(2, '0')}min / {(banner.visitorCount || 0).toString().padStart(2, '0')}visitor
                      </div>
                    </div>
                  )}
                  {/* Distance, Time, Visitor - Simple text format (Desktop) */}
                  {(distance !== null || banner.distance || banner.visitorCount !== undefined) && (
                    <div className="hidden sm:block absolute bottom-1 left-1 right-1 z-10">
                      <div className="text-blue-700 text-xs font-bold text-center bg-white/90 px-2 py-1 rounded">
                        {((distance ?? banner.distance) || 0).toFixed(1).padStart(4, '0')}km / {Math.round(((distance ?? banner.distance) || 0) * 1.5).toString().padStart(2, '0')}min / {(banner.visitorCount || 0).toString().padStart(2, '0')}visitor
                      </div>
                    </div>
                  )}
                </>
              )}
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
