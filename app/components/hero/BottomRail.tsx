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

  const renderPlaceholder = (position: number) => (
    <div
      className="w-full flex-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer p-4"
      onClick={() => window.location.href = '/advertise'}
      role="button"
      tabIndex={0}
      aria-label={`Advertise here - Bottom Rail position ${position + 1}`}
    >
      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="text-xs sm:text-sm font-medium text-gray-600">Advertise Here</span>
    </div>
  );

  return (
    <div 
      className="w-full mt-4"
      aria-live="polite"
    >
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 px-2">
        Featured Shops
      </h2>
      
      {/* Grid layout - 3 columns on mobile, 4 on tablet, 6 on desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((index) => {
          const banner = currentBanners[index];
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
                className={`relative block w-full h-32 sm:h-40 md:h-44 lg:h-48 rounded-lg bg-white overflow-hidden border-2 hover:scale-[1.05] transition-all duration-300 group animate-bottom-rail-glow`}
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
                  
                  {(banner.area || banner.city) && (
                    <p className="text-[10px] sm:text-xs text-white/90 mb-1 line-clamp-1 drop-shadow">
                      📍 {banner.area || banner.city}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    {(distance !== null || banner.distance !== undefined) && (
                      <p className="text-[10px] sm:text-xs text-blue-300 font-semibold drop-shadow">
                        {((distance ?? banner.distance) || 0).toFixed(1)} km
                      </p>
                    )}
                    {banner.visitorCount !== undefined && (
                      <p className="text-[10px] sm:text-xs text-white/80 font-semibold drop-shadow">
                        👁️ {banner.visitorCount || 0}
                      </p>
                    )}
                  </div>
                  
                  {(distance !== null || banner.distance !== undefined) && (
                    <p className="text-[9px] sm:text-[10px] text-amber-300 font-semibold drop-shadow">
                      ⏱️ {Math.round(((distance ?? banner.distance) || 0) * 1.5)} min
                    </p>
                  )}
                  
                  {banner.website && (
                    <p className="text-[8px] sm:text-[9px] text-white/80 mt-1 truncate">
                      {banner.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </p>
                  )}
                </div>
              </a>
              
              {/* Distance, Time, Visitor - Simple text format */}
              {(distance !== null || banner.distance || banner.visitorCount !== undefined) && (
                <div className="absolute bottom-1 left-1 right-1 z-10">
                  <div className="text-blue-700 text-[8px] sm:text-xs font-bold text-center bg-white/90 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                    {((distance ?? banner.distance) || 0).toFixed(1).padStart(4, '0')}km / {Math.round(((distance ?? banner.distance) || 0) * 1.5).toString().padStart(2, '0')}min / {(banner.visitorCount || 0).toString().padStart(2, '0')}visitor
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div key={`bottom-rail-placeholder-${index}`}>
              {renderPlaceholder(index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

