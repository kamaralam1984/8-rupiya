'use client';

import Image from 'next/image';
import { useMemo } from 'react';

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
                <div key={`bottom-row${rowIndex}-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[112px] min-w-[94px]">
                  <a
                    href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                    target={banner.website ? '_blank' : undefined}
                    rel={banner.website ? 'noopener noreferrer' : undefined}
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.website || banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-20 px-2 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-lg transition-all duration-200 overflow-hidden"
                    aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${actualIndex + 1}`}
                    style={{
                      animationDelay: `${actualIndex * 0.5}s`,
                    }}
                  >
                    {banner.imageUrl && (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.advertiser || banner.alt}
                        width={66}
                        height={53}
                        className="object-cover max-h-full max-w-full"
                        loading="lazy"
                      />
                    )}
                    {/* Distance, Time, Visitor - Simple text format */}
                    <div className="absolute bottom-1 left-1 right-1 z-10">
                      <div className="text-blue-700 text-[8px] font-bold text-center bg-white/80 px-1 py-0.5 rounded">
                        {(banner.distance ? banner.distance.toFixed(1) : '0.0').padStart(4, '0')}km / {(banner.distance ? Math.round(banner.distance * 1.5) : 0).toString().padStart(2, '0')}min / {(banner.visitorCount || 0).toString().padStart(2, '0')}visitor
                      </div>
                    </div>
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
                <div key={`bottom-mobile-row${rowIndex}-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[61px] sm:max-w-[70px] min-w-[48px] sm:min-w-[56px]">
                  <a
                    href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.website || banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 overflow-hidden"
                    aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${actualIndex + 1}`}
                    style={{
                      animationDelay: `${actualIndex * 0.5}s`,
                    }}
                  >
                    {banner.imageUrl && (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.advertiser || banner.alt}
                        width={41}
                        height={33}
                        className="object-cover max-h-full max-w-full"
                        loading="lazy"
                      />
                    )}
                    {/* Distance, Time, Visitor - Simple text format */}
                    <div className="absolute bottom-0.5 left-0.5 right-0.5 z-10">
                      <div className="text-blue-700 text-[6px] font-bold text-center bg-white/80 px-0.5 py-0 rounded">
                        {(banner.distance ? banner.distance.toFixed(1) : '0.0').padStart(4, '0')}km / {(banner.distance ? Math.round(banner.distance * 1.5) : 0).toString().padStart(2, '0')}min / {(banner.visitorCount || 0).toString().padStart(2, '0')}visitor
                      </div>
                    </div>
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
