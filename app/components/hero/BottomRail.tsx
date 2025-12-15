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

interface BottomRailProps {
  banners: Banner[];
  onBannerClick: (bannerId: string, section: 'bottomrail', position: number, link: string) => void;
  userLat?: number | null;
  userLng?: number | null;
}

export default function BottomRail({ banners, onBannerClick, userLat, userLng }: BottomRailProps) {
  // Sort banners by distance if user location is available
  const sortedBanners = useMemo(() => {
    if (userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined) {
      const sorted = sortBannersByDistance(banners, userLat, userLng);
      return sorted.map(item => item.banner);
    }
    return banners;
  }, [banners, userLat, userLng]);

  // Show first 12 banners
  const currentBanners = useMemo(() => {
    return sortedBanners.slice(0, 12);
  }, [sortedBanners]);

  return (
    <div 
      className="w-full mt-4"
      aria-live="polite"
    >
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 px-2">
        Featured Shops
      </h2>
      
      {/* Grid layout - 3 columns on mobile, 4 on tablet, 6 on desktop */}
      {currentBanners.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {currentBanners.map((banner, index) => {
            const distance = banner ? getBannerDistance(banner, userLat ?? null, userLng ?? null) : null;
            
            return banner ? (
            <div
              key={`bottom-rail-${index}-${banner.bannerId || index}`}
              className="relative group"
            >
              <a
                href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                target={banner.website ? '_blank' : undefined}
                rel={banner.website ? 'noopener noreferrer' : undefined}
                onClick={() => onBannerClick(banner.bannerId, 'bottomrail', index, banner.website || banner.link)}
                className={`relative block w-full h-32 sm:h-40 md:h-44 lg:h-48 rounded-lg bg-white overflow-hidden border-2 hover:scale-[1.05] transition-all duration-300 group`}
                aria-label={`Shop: ${banner.advertiser || banner.alt} - ${banner.area || ''} - Bottom Rail slot ${index + 1}`}
                style={{
                  animationDelay: `${index * 1}s`,
                }}
              >
                {/* Shop Image */}
                {banner.imageUrl && (
                  <Image
                    src={banner.imageUrl}
                    alt={banner.advertiser || banner.alt}
                    fill
                    className="object-cover"
                    loading="lazy"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                )}
                
                {/* Overlay with shop info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col justify-end p-2 sm:p-3">
                  <h3 className="text-xs sm:text-sm font-bold text-white mb-1 line-clamp-2 drop-shadow-lg">
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
                            <span className="text-[8px] sm:text-[10px] font-semibold text-red-400 drop-shadow-lg">
                              {distance.toFixed(1)}km
                            </span>
                            {(travelTimeText || banner.visitorCount !== undefined) && (
                              <span className="text-[8px] sm:text-[10px] text-white/60">|</span>
                            )}
                          </>
                        )}
                        {/* Time - Yellow */}
                        {travelTimeText && (
                          <>
                            <span className="text-[8px] sm:text-[10px] font-semibold text-yellow-400 drop-shadow-lg">
                              {travelTimeText}
                            </span>
                            {banner.visitorCount !== undefined && (
                              <span className="text-[8px] sm:text-[10px] text-white/60">|</span>
                            )}
                          </>
                        )}
                        {/* Visitor - Blue */}
                        {banner.visitorCount !== undefined && (
                          <span className="text-[8px] sm:text-[10px] font-semibold text-blue-400 drop-shadow-lg">
                            {banner.visitorCount || 0}visitor
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  
                  {(banner.area || banner.city) && (
                    <p className="text-[10px] sm:text-xs text-white/90 mb-1 line-clamp-1 drop-shadow">
                      📍 {banner.area || banner.city}
                    </p>
                  )}
                  
                  {banner.website && (
                    <p className="text-[8px] sm:text-[9px] text-white/80 mt-1 truncate">
                      {banner.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </p>
                  )}
                </div>
              </a>
              
            </div>
            ) : null;
          })}
        </div>
      ) : null}
    </div>
  );
}

