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
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 px-2">
        Featured Shops
      </h2>
      
      {/* Grid layout - 3 columns on mobile, 4 on tablet, 6 on desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((index) => {
          const banner = currentBanners[index];
          const distance = banner ? getBannerDistance(banner, userLat ?? null, userLng ?? null) : null;
          const finalDistance = distance ?? banner?.distance;
          
          return banner ? (
            <article
              key={`bottom-rail-${index}-${banner.bannerId || index}`}
              className="group rounded-xl bg-white shadow-lg border-2 border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 cursor-pointer flex flex-col"
            >
              <a
                href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                target={banner.website ? '_blank' : undefined}
                rel={banner.website ? 'noopener noreferrer' : undefined}
                onClick={() => onBannerClick(banner.bannerId, 'bottomrail', index, banner.website || banner.link)}
                className="flex flex-col h-full"
                aria-label={`Shop: ${banner.advertiser || banner.alt} - ${banner.area || ''} - Bottom Rail slot ${index + 1}`}
              >
                {/* Image Section */}
                <div className="relative h-36 sm:h-40 md:h-44 overflow-hidden bg-gray-100">
                {banner.imageUrl && (
                  <Image
                    src={banner.imageUrl}
                    alt={banner.advertiser || banner.alt}
                    fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  />
                )}
                  {/* Visitor Count Badge */}
                  {banner.visitorCount !== undefined && (
                    <div className="absolute top-2 left-2 z-20 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-sm shadow-md border border-gray-200">
                      <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-xs font-black text-gray-900">{banner.visitorCount || 0}</span>
                    </div>
                  )}
                </div>

                {/* Text Content Section */}
                <div className="p-3 flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50">
                  <h3 className="text-xs sm:text-sm font-black text-gray-900 mb-2 line-clamp-2 min-h-[2rem] group-hover:text-blue-600 transition-colors leading-tight">
                    {banner.advertiser || banner.alt}
                  </h3>
                  
                  {/* Location and Distance */}
                  <div className="mt-auto pt-2 border-t-2 border-gray-200">
                  {(banner.area || banner.city) && (
                      <div className="flex items-start gap-1 mb-2">
                        <svg className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-800 break-words flex-1 leading-relaxed line-clamp-1">
                          {banner.area || banner.city}
                        </span>
                      </div>
                  )}
                    {typeof finalDistance === 'number' && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md border border-blue-200 w-fit">
                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[10px] sm:text-xs font-bold text-blue-700">{finalDistance.toFixed(1)} km</span>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            </article>
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

