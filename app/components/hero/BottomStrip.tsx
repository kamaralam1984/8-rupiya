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
}

interface BottomStripProps {
  banners: Banner[];
  onBannerClick: (
    bannerId: string,
    section: 'bottom',
    position: number,
    link: string
  ) => void;
}

// Fallback banners removed - only shops will be shown

export default function BottomStrip({ banners, onBannerClick }: BottomStripProps) {
  // Show all shops (up to 20), no rotation
  const currentBanners = useMemo(() => {
    // Show all shops (with or without websites)
    return banners.slice(0, 20);
  }, [banners]);
  const renderPlaceholder = (position: number) => (
    <div
      onClick={() => window.location.href = '/advertise'}
      className="inline-flex items-center justify-center h-12 md:h-15 px-3 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[75px]"
      role="button"
      tabIndex={0}
      aria-label={`Advertise here - Bottom position ${position + 1}`}
    >
      <span className="text-[10px] font-medium text-gray-500">Ad</span>
    </div>
  );

  // Split banners into 2 rows of 10 each for desktop
  const row1 = currentBanners.slice(0, 10);
  const row2 = currentBanners.slice(10, 20);
  // Split banners into 4 rows of 5 each for mobile
  const mobileRow1 = currentBanners.slice(0, 5);
  const mobileRow2 = currentBanners.slice(5, 10);
  const mobileRow3 = currentBanners.slice(10, 15);
  const mobileRow4 = currentBanners.slice(15, 20);

  return (
    <div className="w-full mt-6">
      {/* Desktop: 2 Rows of 10 images each */}
      <div className="hidden md:block relative" aria-live="polite">
        <div>
          {/* Row 1: 10 images */}
          <div className="flex flex-wrap justify-center gap-2 mb-2">
          {[...Array(10)].map((_, index) => {
            const banner = row1[index];
            return banner ? (
              <div key={banner.bannerId} className="relative group flex-1 max-w-[90px] min-w-[75px]">
                <a
                  href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                  target={banner.website ? '_blank' : undefined}
                  rel={banner.website ? 'noopener noreferrer' : undefined}
                  onClick={() => onBannerClick(banner.bannerId, 'bottom', index, banner.website || banner.link)}
                  className="relative w-full inline-flex items-center justify-center h-15 md:h-17 px-2 rounded-md border border-gray-200 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 overflow-hidden"
                  aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${index + 1}`}
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
                  {/* Distance badge overlay */}
                  {banner.distance !== undefined && (
                    <div className="absolute top-1 right-1 z-10">
                      <div className="bg-blue-600 text-white px-1 py-0.5 rounded text-[8px] font-bold shadow-lg">
                        {banner.distance.toFixed(1)}km
                      </div>
                    </div>
                  )}
                </a>
              </div>
            ) : (
              <div key={`bottom-placeholder-${index}`} className="flex-1 max-w-[90px]">
                {renderPlaceholder(index)}
              </div>
            );
          })}
        </div>
          {/* Row 2: 10 images */}
          <div className="flex flex-wrap justify-center gap-2">
          {[...Array(10)].map((_, index) => {
            const banner = row2[index];
            const actualIndex = index + 10;
            return banner ? (
              <div key={banner.bannerId} className="relative group flex-1 max-w-[90px] min-w-[75px]">
                <a
                  href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                  target={banner.website ? '_blank' : undefined}
                  rel={banner.website ? 'noopener noreferrer' : undefined}
                  onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.website || banner.link)}
                  className="relative w-full inline-flex items-center justify-center h-12 md:h-14 px-2 rounded-md border border-gray-200 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 overflow-hidden"
                  aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${actualIndex + 1}`}
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
                  {/* Distance badge overlay */}
                  {banner.distance !== undefined && (
                    <div className="absolute top-1 right-1 z-10">
                      <div className="bg-blue-600 text-white px-1 py-0.5 rounded text-[8px] font-bold shadow-lg">
                        {banner.distance.toFixed(1)}km
                      </div>
                    </div>
                  )}
                </a>
              </div>
            ) : (
              <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[90px]">
                {renderPlaceholder(actualIndex)}
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Mobile: 4 Rows of 5 images each (smaller sizes) */}
      <div className="md:hidden relative" aria-live="polite">
        <div>
          {/* Row 1: 5 images */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            {[...Array(5)].map((_, index) => {
              const banner = mobileRow1[index];
              return banner ? (
                <div key={banner.bannerId} className="relative group flex-1 max-w-[49px] sm:max-w-[56px] min-w-[38px] sm:min-w-[45px]">
                  <a
                    href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', index, banner.website || banner.link)}
                    className="relative w-full inline-flex flex-col items-center justify-center h-10 sm:h-11 px-1 py-0.5 rounded-md border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150"
                    aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${index + 1}`}
                  >
                    <h4 className="text-[6px] font-bold text-gray-900 line-clamp-2 text-center">
                      {banner.advertiser || banner.alt}
                    </h4>
                    {banner.distance !== undefined && (
                      <p className="text-[5px] text-blue-600 font-semibold mt-0.5">
                        {banner.distance.toFixed(1)}km
                      </p>
                    )}
                  </a>
                </div>
              ) : (
                <div key={`bottom-placeholder-${index}`} className="flex-1 max-w-[49px] sm:max-w-[56px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-8 sm:h-9 px-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[38px] sm:min-w-[45px]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Advertise here - Bottom position ${index + 1}`}
                  >
                    <span className="text-[6px] sm:text-[7px] font-medium text-gray-500">Ad</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Row 2: 5 images */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            {[...Array(5)].map((_, index) => {
              const banner = mobileRow2[index];
              const actualIndex = index + 5;
              return banner ? (
                <div key={banner.bannerId} className="relative group flex-1 max-w-[49px] sm:max-w-[56px] min-w-[38px] sm:min-w-[45px]">
                  <button
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-10 sm:h-11 px-1 rounded-md border border-gray-200 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden"
                    aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Bottom slot ${actualIndex + 1}`}
                    data-banner-id={banner.bannerId}
                    data-section="bottom"
                    data-position={actualIndex}
                  >
                    {banner.imageUrl ? (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.alt}
                        width={33}
                        height={26}
                        className={`${banner.isBusiness ? 'object-cover' : 'object-contain'} max-h-full max-w-full`}
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[8px] font-semibold text-gray-700 line-clamp-2 text-center">
                        {banner.advertiser || banner.alt}
                      </span>
                    )}
                    {banner.isBusiness && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    )}
                  </button>
                  {/* Distance and time badge for businesses */}
                  {banner.isBusiness && banner.distance !== undefined && (
                    <div className="absolute top-0.5 right-0.5 z-10">
                      <div className="bg-blue-600 text-white px-0.5 py-0 rounded text-[6px] font-bold shadow-lg flex flex-col items-center gap-0">
                        <span>{banner.distance.toFixed(1)}</span>
                        <span className="text-[5px]">{Math.round(banner.distance * 1.5)}m</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[49px] sm:max-w-[56px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-8 sm:h-9 px-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[38px] sm:min-w-[45px]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Advertise here - Bottom position ${actualIndex + 1}`}
                  >
                    <span className="text-[6px] sm:text-[7px] font-medium text-gray-500">Ad</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Row 3: 5 images */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            {[...Array(5)].map((_, index) => {
              const banner = mobileRow3[index];
              const actualIndex = index + 10;
              return banner ? (
                <div key={banner.bannerId} className="relative group flex-1 max-w-[49px] sm:max-w-[56px] min-w-[38px] sm:min-w-[45px]">
                  <button
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-10 sm:h-11 px-1 rounded-md border border-gray-200 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden"
                    aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Bottom slot ${actualIndex + 1}`}
                    data-banner-id={banner.bannerId}
                    data-section="bottom"
                    data-position={actualIndex}
                  >
                    {banner.imageUrl ? (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.alt}
                        width={33}
                        height={26}
                        className={`${banner.isBusiness ? 'object-cover' : 'object-contain'} max-h-full max-w-full`}
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[8px] font-semibold text-gray-700 line-clamp-2 text-center">
                        {banner.advertiser || banner.alt}
                      </span>
                    )}
                    {banner.isBusiness && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    )}
                  </button>
                  {/* Distance and time badge for businesses */}
                  {banner.isBusiness && banner.distance !== undefined && (
                    <div className="absolute top-0.5 right-0.5 z-10">
                      <div className="bg-blue-600 text-white px-0.5 py-0 rounded text-[6px] font-bold shadow-lg flex flex-col items-center gap-0">
                        <span>{banner.distance.toFixed(1)}</span>
                        <span className="text-[5px]">{Math.round(banner.distance * 1.5)}m</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[49px] sm:max-w-[56px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-8 sm:h-9 px-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[38px] sm:min-w-[45px]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Advertise here - Bottom position ${actualIndex + 1}`}
                  >
                    <span className="text-[6px] sm:text-[7px] font-medium text-gray-500">Ad</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Row 4: 5 images */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5">
            {[...Array(5)].map((_, index) => {
              const banner = mobileRow4[index];
              const actualIndex = index + 15;
              return banner ? (
                <div key={banner.bannerId} className="relative group flex-1 max-w-[49px] sm:max-w-[56px] min-w-[38px] sm:min-w-[45px]">
                  <button
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-10 sm:h-11 px-1 rounded-md border border-gray-200 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden"
                    aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Bottom slot ${actualIndex + 1}`}
                    data-banner-id={banner.bannerId}
                    data-section="bottom"
                    data-position={actualIndex}
                  >
                    {banner.imageUrl ? (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.alt}
                        width={33}
                        height={26}
                        className={`${banner.isBusiness ? 'object-cover' : 'object-contain'} max-h-full max-w-full`}
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[8px] font-semibold text-gray-700 line-clamp-2 text-center">
                        {banner.advertiser || banner.alt}
                      </span>
                    )}
                    {banner.isBusiness && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    )}
                  </button>
                  {/* Distance and time badge for businesses */}
                  {banner.isBusiness && banner.distance !== undefined && (
                    <div className="absolute top-0.5 right-0.5 z-10">
                      <div className="bg-blue-600 text-white px-0.5 py-0 rounded text-[6px] font-bold shadow-lg flex flex-col items-center gap-0">
                        <span>{banner.distance.toFixed(1)}</span>
                        <span className="text-[5px]">{Math.round(banner.distance * 1.5)}m</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[49px] sm:max-w-[56px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-8 sm:h-9 px-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[38px] sm:min-w-[45px]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Advertise here - Bottom position ${actualIndex + 1}`}
                  >
                    <span className="text-[6px] sm:text-[7px] font-medium text-gray-500">Ad</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
