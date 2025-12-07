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
}

interface LeftRailProps {
  banners: Banner[];
  onBannerClick: (bannerId: string, section: 'left', position: number, link: string) => void;
  height?: string; // To match center height
  userLat?: number | null;
  userLng?: number | null;
}

const encodeAssetPath = (path: string) =>
  encodeURI(path).replace(/#/g, '%23');

const createBanner = (id: string, fileName: string, alt: string): Banner => ({
  bannerId: id,
  imageUrl: encodeAssetPath(`/Assets/${fileName}`),
  alt,
  link: '#',
});

const fallbackSetA: Banner[] = [
  createBanner('left-asset-swiggy', 'Swiggy-logo.jpg', 'Swiggy'),
  createBanner('left-asset-ola', 'Ola-Cabs-Logo-2048x1153.jpg', 'Ola'),
  createBanner('left-asset-nykaa', 'Nykaa_New_Logo.svg', 'Nykaa'),
  createBanner('left-asset-tata', 'Tata_logo.svg.png', 'Tata'),
];

const fallbackSetB: Banner[] = [
  createBanner('left-asset-reliance', 'Reliance-Industries-Limited-Logo.png', 'Reliance'),
  createBanner('left-asset-amul', 'Amul-Logo.png', 'Amul'),
  createBanner('left-asset-infosys', 'Infosys-Logo.jpg', 'Infosys'),
  createBanner('left-asset-lic', 'LIC-Logo.png', 'LIC'),
];

export default function LeftRail({ banners, onBannerClick, height = 'h-[480px]', userLat, userLng }: LeftRailProps) {
  // Sort banners by distance if user location is available
  const sortedBanners = useMemo(() => {
    if (userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined) {
      const sorted = sortBannersByDistance(banners, userLat, userLng);
      return sorted.map(item => item.banner);
    }
    return banners;
  }, [banners, userLat, userLng]);

  // Show only first 4 banners (no rotation)
  const currentBanners = useMemo(() => {
    if (sortedBanners.length > 0) {
      return sortedBanners.slice(0, 4);
    }
    return fallbackSetA.slice(0, 4);
  }, [sortedBanners]);

  const renderPlaceholder = (position: number) => (
    <div
      className="w-full flex-1 min-h-[56px] sm:min-h-[125px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
      onClick={() => window.location.href = '/advertise'}
      role="button"
      tabIndex={0}
      aria-label={`Advertise here - Left position ${position + 1}`}
    >
      <svg className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400 mb-0.5 sm:mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="text-[10px] sm:text-xs font-medium text-gray-600">Advertise</span>
    </div>
  );

  return (
    <div 
      className={`flex flex-col gap-1 sm:gap-2 ${height} overflow-hidden`} 
      aria-live="polite"
    >
      <div className="h-full flex flex-col gap-1 sm:gap-2">
        {[0, 1, 2, 3].map((index) => {
          const banner = currentBanners[index];
          const distance = banner ? getBannerDistance(banner, userLat ?? null, userLng ?? null) : null;
          return banner ? (
            <div
              key={banner.bannerId}
              className="relative group"
            >
              <button
                onClick={() => onBannerClick(banner.bannerId, 'left', index, banner.link)}
                className="relative w-full flex-1 min-h-[56px] sm:min-h-[125px] rounded-lg bg-white shadow-sm overflow-hidden hover:scale-[1.02] hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Left slot ${index + 1}`}
                data-banner-id={banner.bannerId}
                data-section="left"
                data-position={index}
              >
                <Image
                  src={banner.imageUrl}
                  alt={banner.alt}
                  fill
                  className={`${banner.isBusiness ? 'object-cover' : 'object-contain'} p-1 sm:p-2`}
                  loading="lazy"
                  sizes="(max-width: 640px) 22vw, (max-width: 1024px) 18vw, 20vw"
                />
                {/* Gradient overlay for businesses */}
                {banner.isBusiness && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                )}
              </button>
              {/* Distance and Call Button Overlay */}
              {(distance !== null || banner.isBusiness) && (
                <>
                  {/* Mobile: Always visible distance and time badge */}
                  {(distance !== null || banner.distance) && (
                    <div className="absolute top-1 right-1 sm:hidden z-10">
                      <div className="bg-blue-600 text-white px-1.5 py-0.5 rounded-md shadow-lg flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-[8px] font-bold leading-tight">
                            {((distance ?? banner.distance) || 0).toFixed(1)}km
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[7px] font-semibold leading-tight">
                            {Math.round(((distance ?? banner.distance) || 0) * 1.5)}min
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Desktop: Hover overlay with distance and time */}
                  <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex flex-col items-center justify-end pb-2 sm:pb-3 pointer-events-none">
                    {(distance !== null || banner.distance) && (
                      <div className="bg-white/95 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-lg border border-white/20">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-[10px] sm:text-xs font-bold text-gray-900">
                              {((distance ?? banner.distance) || 0).toFixed(1)} km
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[10px] sm:text-xs font-bold text-gray-900">
                              {Math.round(((distance ?? banner.distance) || 0) * 1.5)} min
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div key={`left-placeholder-${index}`}>
              {renderPlaceholder(index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
