'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { sortBannersByDistance, getBannerDistance } from '../../utils/shopDistance';
import { calculateTravelTime, formatTravelTime } from '../../utils/distance';

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
  maxCount?: number; // Maximum number of shops to display
}

export default function RightSide({ banners, onBannerClick, height = 'h-[480px]', userLat, userLng, maxCount = 3 }: RightSideProps) {
  // Sort banners by distance if user location is available
  const sortedBanners = useMemo(() => {
    if (userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined) {
      const sorted = sortBannersByDistance(banners || [], userLat, userLng);
      return sorted.map(item => item.banner);
    }
    return banners || [];
  }, [banners, userLat, userLng]);

  // Show banners based on maxCount setting
  const currentBanners = useMemo(() => {
    const count = Math.max(0, Math.min(maxCount || 3, 10)); // Limit between 0-10
    return sortedBanners.slice(0, count);
  }, [sortedBanners, maxCount]);

  return (
    <div 
      className={`flex flex-col gap-1 sm:gap-2 ${height} overflow-hidden`} 
      aria-live="polite"
    >
      <div className="h-full flex flex-col gap-1 sm:gap-2">
        {currentBanners.map((banner, index) => {
          const distance = banner ? getBannerDistance(banner, userLat ?? null, userLng ?? null) : null;
          return banner ? (
            <div
              key={`right-rail-${index}-${banner.bannerId || index}`}
              className="relative group flex-1"
            >
              {/* Show shop with image */}
              <a
                href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                target={banner.website ? '_blank' : undefined}
                rel={banner.website ? 'noopener noreferrer' : undefined}
                onClick={() => onBannerClick(banner.bannerId, 'right', index, banner.website || banner.link)}
                className="relative block w-full h-full min-h-[56px] sm:min-h-[125px] rounded-lg bg-white shadow-sm overflow-hidden hover:scale-[1.02] hover:shadow-md transition-all duration-150 group"
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
                  {/* Km, Time, Visitor - Transparent background with colored text */}
                  {(distance !== null || banner.visitorCount !== undefined) && (() => {
                    const travelTimeMinutes = distance && distance > 0 ? calculateTravelTime(distance) : 0;
                    const travelTimeText = travelTimeMinutes > 0 ? formatTravelTime(travelTimeMinutes) : '';
                    return (
                      <div className="flex flex-wrap items-center gap-1 mb-1">
                        {/* Distance - Red */}
                        {distance !== null && distance > 0 && (
                          <>
                            <span className="text-[7px] sm:text-[9px] font-semibold text-red-400 drop-shadow-lg">
                              {distance.toFixed(1)}km
                            </span>
                            {(travelTimeText || banner.visitorCount !== undefined) && (
                              <span className="text-[7px] sm:text-[9px] text-white/60">|</span>
                            )}
                          </>
                        )}
                        {/* Time - Yellow */}
                        {travelTimeText && (
                          <>
                            <span className="text-[7px] sm:text-[9px] font-semibold text-yellow-400 drop-shadow-lg">
                              {travelTimeText}
                            </span>
                            {banner.visitorCount !== undefined && (
                              <span className="text-[7px] sm:text-[9px] text-white/60">|</span>
                            )}
                          </>
                        )}
                        {/* Visitor - Blue */}
                        {banner.visitorCount !== undefined && (
                          <span className="text-[7px] sm:text-[9px] font-semibold text-blue-400 drop-shadow-lg">
                            {banner.visitorCount || 0}visitor
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  {(banner.area || banner.city) && (
                    <p className="text-[8px] sm:text-[10px] text-white/90 mb-1 line-clamp-1 drop-shadow">
                      📍 {banner.area || banner.city}
                    </p>
                  )}
                  {banner.website && (
                    <p className="text-[7px] sm:text-[9px] text-white/80 mt-1 truncate">
                      {banner.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </p>
                  )}
                </div>
              </a>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

