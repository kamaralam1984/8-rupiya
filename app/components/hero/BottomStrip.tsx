'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { getBannerDistance } from '../../utils/shopDistance';
import { calculateTravelTime, formatTravelTime } from '../../utils/distance';
import { useLocation } from '../../contexts/LocationContext';

interface Banner {
  bannerId: string;
  imageUrl?: string;
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

interface BottomStripProps {
  banners: Banner[];
  onBannerClick: (
    bannerId: string,
    section: 'bottom',
    position: number,
    link: string
  ) => void;
  maxCount?: number; // Maximum number of shops to display
}

// Fallback banners removed - only shops will be shown

export default function BottomStrip({ banners, onBannerClick, maxCount = 10 }: BottomStripProps) {
  const { location } = useLocation();
  
  // Show shops based on maxCount setting
  const currentBanners = useMemo(() => {
    const count = Math.max(0, Math.min(maxCount || 10, 30)); // Limit between 0-30
    return banners.slice(0, count);
  }, [banners, maxCount]);

  // Split banners dynamically based on actual count
  // Desktop: Show shops in rows, but only show actual shops (no placeholders)
  const desktopRows: Banner[][] = [];
  for (let i = 0; i < currentBanners.length; i += 10) {
    desktopRows.push(currentBanners.slice(i, i + 10));
  }
  
  // Mobile: Show shops in rows of 5, but only show actual shops (no placeholders)
  const mobileRows: Banner[][] = [];
  for (let i = 0; i < currentBanners.length; i += 5) {
    mobileRows.push(currentBanners.slice(i, i + 5));
  }

  return (
    <div className="w-full mt-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 px-2">
        Nearby Shops ({currentBanners.length})
      </h2>
      {/* Desktop: Dynamic rows based on actual shop count (no placeholders) */}
      <div className="hidden md:block relative" aria-live="polite">
        {desktopRows.map((row, rowIndex) => (
          <div key={`desktop-row-${rowIndex}`} className="flex flex-wrap justify-center gap-2 mb-2 last:mb-0">
            {row.map((banner, index) => {
              const actualIndex = rowIndex * 10 + index;
              return (
                <div key={`bottom-row${rowIndex}-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[135px] min-w-[113px]">
                  <a
                    href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                    target={banner.website ? '_blank' : undefined}
                    rel={banner.website ? 'noopener noreferrer' : undefined}
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.website || banner.link)}
                    className="relative block w-full h-24 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-lg transition-all duration-200 overflow-hidden"
                    aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${actualIndex + 1}`}
                    style={{
                      animationDelay: `${actualIndex * 0.5}s`,
                    }}
                  >
                    {banner.imageUrl && (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.advertiser || banner.alt}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 1024px) 10vw, 135px"
                      />
                    )}
                    {/* Km, Time, Visitor - Transparent background with colored text */}
                    {(() => {
                      const distance = banner ? getBannerDistance(banner, location.latitude ?? null, location.longitude ?? null) : null;
                      const travelTimeMinutes = distance && distance > 0 ? calculateTravelTime(distance) : 0;
                      const travelTimeText = travelTimeMinutes > 0 ? formatTravelTime(travelTimeMinutes) : '';
                      return (distance !== null || banner.visitorCount !== undefined) ? (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                          <div className="flex flex-wrap items-center gap-0.5 justify-center">
                            {/* Distance - Red */}
                            {distance !== null && distance > 0 && (
                              <>
                                <span className="text-[6px] font-semibold text-red-400 drop-shadow-lg">
                                  {distance.toFixed(1)}km
                                </span>
                                {(travelTimeText || banner.visitorCount !== undefined) && (
                                  <span className="text-[6px] text-white/60">|</span>
                                )}
                              </>
                            )}
                            {/* Time - Yellow */}
                            {travelTimeText && (
                              <>
                                <span className="text-[6px] font-semibold text-yellow-400 drop-shadow-lg">
                                  {travelTimeText}
                                </span>
                                {banner.visitorCount !== undefined && (
                                  <span className="text-[6px] text-white/60">|</span>
                                )}
                              </>
                            )}
                            {/* Visitor - Blue */}
                            {banner.visitorCount !== undefined && (
                              <span className="text-[6px] font-semibold text-blue-400 drop-shadow-lg">
                                {banner.visitorCount || 0}v
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </a>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Mobile: Dynamic rows based on actual shop count (no placeholders) */}
      <div className="md:hidden relative" aria-live="polite">
        {mobileRows.map((row, rowIndex) => (
          <div key={`mobile-row-${rowIndex}`} className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5 last:mb-0">
            {row.map((banner, index) => {
              const actualIndex = rowIndex * 5 + index;
              return (
                <div key={`bottom-mobile-row${rowIndex}-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[73px] sm:max-w-[84px] min-w-[58px] sm:min-w-[67px]">
                  <a
                    href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.website || banner.link)}
                    className="relative block w-full h-[58px] sm:h-[68px] rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 overflow-hidden"
                    aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${actualIndex + 1}`}
                    style={{
                      animationDelay: `${actualIndex * 0.5}s`,
                    }}
                  >
                    {banner.imageUrl && (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.advertiser || banner.alt}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 640px) 20vw, 84px"
                      />
                    )}
                    {/* Km, Time, Visitor - Transparent background with colored text (Mobile) */}
                    {(() => {
                      const distance = banner ? getBannerDistance(banner, location.latitude ?? null, location.longitude ?? null) : null;
                      const travelTimeMinutes = distance && distance > 0 ? calculateTravelTime(distance) : 0;
                      const travelTimeText = travelTimeMinutes > 0 ? formatTravelTime(travelTimeMinutes) : '';
                      return (distance !== null || banner.visitorCount !== undefined) ? (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-0.5">
                          <div className="flex flex-wrap items-center gap-0.5 justify-center">
                            {/* Distance - Red */}
                            {distance !== null && distance > 0 && (
                              <>
                                <span className="text-[5px] font-semibold text-red-400 drop-shadow-lg">
                                  {distance.toFixed(1)}km
                                </span>
                                {(travelTimeText || banner.visitorCount !== undefined) && (
                                  <span className="text-[5px] text-white/60">|</span>
                                )}
                              </>
                            )}
                            {/* Time - Yellow */}
                            {travelTimeText && (
                              <>
                                <span className="text-[5px] font-semibold text-yellow-400 drop-shadow-lg">
                                  {travelTimeText}
                                </span>
                                {banner.visitorCount !== undefined && (
                                  <span className="text-[5px] text-white/60">|</span>
                                )}
                              </>
                            )}
                            {/* Visitor - Blue */}
                            {banner.visitorCount !== undefined && (
                              <span className="text-[5px] font-semibold text-blue-400 drop-shadow-lg">
                                {banner.visitorCount || 0}v
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </a>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
