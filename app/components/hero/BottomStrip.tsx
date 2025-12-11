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
}

// Fallback banners removed - only shops will be shown

export default function BottomStrip({ banners, onBannerClick }: BottomStripProps) {
  // Show all shops (up to 30), no rotation
  const currentBanners = useMemo(() => {
    // Show all shops (with or without websites)
    return banners.slice(0, 30);
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

  // Split banners into 3 rows of 10 each for desktop (total 30)
  const row1 = currentBanners.slice(0, 10);
  const row2 = currentBanners.slice(10, 20);
  const row3 = currentBanners.slice(20, 30);
  // Split banners into 6 rows of 5 each for mobile (total 30)
  const mobileRow1 = currentBanners.slice(0, 5);
  const mobileRow2 = currentBanners.slice(5, 10);
  const mobileRow3 = currentBanners.slice(10, 15);
  const mobileRow4 = currentBanners.slice(15, 20);
  const mobileRow5 = currentBanners.slice(20, 25);
  const mobileRow6 = currentBanners.slice(25, 30);

  return (
    <div className="w-full mt-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 px-2">
        Nearby Shops (30)
      </h2>
      {/* Desktop: 3 Rows of 10 images each (total 30 shops, 25% bigger) */}
      <div className="hidden md:block relative" aria-live="polite">
        <div>
          {/* Row 1: 10 images */}
          <div className="flex flex-wrap justify-center gap-2 mb-2">
          {[...Array(10)].map((_, index) => {
            const banner = row1[index];
            return banner ? (
              <div key={`bottom-row1-${index}-${banner.bannerId || index}`} className="relative group flex-1 max-w-[112px] min-w-[94px]">
                <a
                  href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                  target={banner.website ? '_blank' : undefined}
                  rel={banner.website ? 'noopener noreferrer' : undefined}
                  onClick={() => onBannerClick(banner.bannerId, 'bottom', index, banner.website || banner.link)}
                  className="relative w-full inline-flex items-center justify-center h-19 md:h-21 px-2 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-lg transition-all duration-200 overflow-hidden animate-bottom-strip-glow"
                  aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${index + 1}`}
                  style={{
                    animationDelay: `${index * 0.5}s`,
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
                  {/* Distance, time, and visitor badge overlay */}
                  {(banner.distance !== undefined || banner.visitorCount !== undefined) && (
                    <div className="absolute top-1 right-1 z-10">
                      <div className="bg-blue-600 text-white px-1 py-0.5 rounded text-[8px] font-bold shadow-lg flex flex-col items-center gap-0.5">
                        {banner.distance !== undefined && (
                          <div className="flex items-center gap-0.5">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{banner.distance.toFixed(1)}km</span>
                          </div>
                        )}
                        {banner.distance !== undefined && (
                          <div className="flex items-center gap-0.5">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{Math.round(banner.distance * 1.5)}min</span>
                          </div>
                        )}
                        {banner.visitorCount !== undefined && (
                          <div className="flex items-center gap-0.5">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{banner.visitorCount || 0}</span>
                          </div>
                        )}
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
              <div key={`bottom-row2-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[112px] min-w-[94px]">
                <a
                  href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                  target={banner.website ? '_blank' : undefined}
                  rel={banner.website ? 'noopener noreferrer' : undefined}
                  onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.website || banner.link)}
                  className="relative w-full inline-flex items-center justify-center h-15 md:h-17 px-2 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-lg transition-all duration-200 overflow-hidden animate-bottom-strip-glow"
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
                  {/* Distance, time, and visitor badge overlay */}
                  {(banner.distance !== undefined || banner.visitorCount !== undefined) && (
                    <div className="absolute top-1 right-1 z-10">
                      <div className="bg-blue-600 text-white px-1 py-0.5 rounded text-[8px] font-bold shadow-lg flex flex-col items-center gap-0.5">
                        {banner.distance !== undefined && (
                          <div className="flex items-center gap-0.5">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{banner.distance.toFixed(1)}km</span>
                          </div>
                        )}
                        {banner.distance !== undefined && (
                          <div className="flex items-center gap-0.5">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{Math.round(banner.distance * 1.5)}min</span>
                          </div>
                        )}
                        {banner.visitorCount !== undefined && (
                          <div className="flex items-center gap-0.5">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{banner.visitorCount || 0}</span>
                          </div>
                        )}
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
          {/* Row 3: 10 images */}
          <div className="flex flex-wrap justify-center gap-2">
          {[...Array(10)].map((_, index) => {
            const banner = row3[index];
            const actualIndex = index + 20;
            return banner ? (
              <div key={`bottom-row3-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[112px] min-w-[94px]">
                <a
                  href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                  target={banner.website ? '_blank' : undefined}
                  rel={banner.website ? 'noopener noreferrer' : undefined}
                  onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.website || banner.link)}
                  className="relative w-full inline-flex items-center justify-center h-15 md:h-17 px-2 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-lg transition-all duration-200 overflow-hidden animate-bottom-strip-glow"
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
                  {/* Distance, time, and visitor badge overlay */}
                  {(banner.distance !== undefined || banner.visitorCount !== undefined) && (
                    <div className="absolute top-1 right-1 z-10">
                      <div className="bg-blue-600 text-white px-1 py-0.5 rounded text-[8px] font-bold shadow-lg flex flex-col items-center gap-0.5">
                        {banner.distance !== undefined && (
                          <div className="flex items-center gap-0.5">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{banner.distance.toFixed(1)}km</span>
                          </div>
                        )}
                        {banner.distance !== undefined && (
                          <div className="flex items-center gap-0.5">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{Math.round(banner.distance * 1.5)}min</span>
                          </div>
                        )}
                        {banner.visitorCount !== undefined && (
                          <div className="flex items-center gap-0.5">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{banner.visitorCount || 0}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </a>
              </div>
            ) : (
              <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[112px]">
                {renderPlaceholder(actualIndex)}
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Mobile: 6 Rows of 5 images each (smaller sizes) */}
      <div className="md:hidden relative" aria-live="polite">
        <div>
          {/* Row 1: 5 images */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            {[...Array(5)].map((_, index) => {
              const banner = mobileRow1[index];
              return banner ? (
                <div key={`bottom-mobile-row1-${index}-${banner.bannerId || index}`} className="relative group flex-1 max-w-[49px] sm:max-w-[56px] min-w-[38px] sm:min-w-[45px]">
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
                <div key={`bottom-mobile-row2-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[49px] sm:max-w-[56px] min-w-[38px] sm:min-w-[45px]">
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
                  {/* Distance, time, and visitor badge for businesses */}
                  {banner.isBusiness && (banner.distance !== undefined || banner.visitorCount !== undefined) && (
                    <div className="absolute top-0.5 right-0.5 z-10">
                      <div className="bg-blue-600 text-white px-0.5 py-0 rounded text-[6px] font-bold shadow-lg flex flex-col items-center gap-0">
                        {banner.distance !== undefined && (
                          <>
                            <span>{banner.distance.toFixed(1)}</span>
                            <span className="text-[5px]">{Math.round(banner.distance * 1.5)}m</span>
                          </>
                        )}
                        {banner.visitorCount !== undefined && (
                          <span className="text-[5px]">👁️{banner.visitorCount || 0}</span>
                        )}
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
                <div key={`bottom-mobile-row3-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[49px] sm:max-w-[56px] min-w-[38px] sm:min-w-[45px]">
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
                  {/* Distance, time, and visitor badge for businesses */}
                  {banner.isBusiness && (banner.distance !== undefined || banner.visitorCount !== undefined) && (
                    <div className="absolute top-0.5 right-0.5 z-10">
                      <div className="bg-blue-600 text-white px-0.5 py-0 rounded text-[6px] font-bold shadow-lg flex flex-col items-center gap-0">
                        {banner.distance !== undefined && (
                          <>
                            <span>{banner.distance.toFixed(1)}</span>
                            <span className="text-[5px]">{Math.round(banner.distance * 1.5)}m</span>
                          </>
                        )}
                        {banner.visitorCount !== undefined && (
                          <span className="text-[5px]">👁️{banner.visitorCount || 0}</span>
                        )}
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
                <div key={`bottom-mobile-row4-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[49px] sm:max-w-[56px] min-w-[38px] sm:min-w-[45px]">
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
                  {/* Distance, time, and visitor badge for businesses */}
                  {banner.isBusiness && (banner.distance !== undefined || banner.visitorCount !== undefined) && (
                    <div className="absolute top-0.5 right-0.5 z-10">
                      <div className="bg-blue-600 text-white px-0.5 py-0 rounded text-[6px] font-bold shadow-lg flex flex-col items-center gap-0">
                        {banner.distance !== undefined && (
                          <>
                            <span>{banner.distance.toFixed(1)}</span>
                            <span className="text-[5px]">{Math.round(banner.distance * 1.5)}m</span>
                          </>
                        )}
                        {banner.visitorCount !== undefined && (
                          <span className="text-[5px]">👁️{banner.visitorCount || 0}</span>
                        )}
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
          {/* Row 5: 5 images */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5">
            {[...Array(5)].map((_, index) => {
              const banner = mobileRow5[index];
              const actualIndex = index + 20;
              return banner ? (
                <div key={`bottom-mobile-row5-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[61px] sm:max-w-[70px] min-w-[48px] sm:min-w-[56px]">
                  <button
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-13 sm:h-14 px-1 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden animate-bottom-strip-glow"
                    aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Bottom slot ${actualIndex + 1}`}
                    data-banner-id={banner.bannerId}
                    data-section="bottom"
                    data-position={actualIndex}
                    style={{
                      animationDelay: `${actualIndex * 0.5}s`,
                    }}
                  >
                    {banner.imageUrl ? (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.alt}
                        width={41}
                        height={33}
                        className={`${banner.isBusiness ? 'object-cover' : 'object-contain'} max-h-full max-w-full`}
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-700 line-clamp-2 text-center">
                        {banner.advertiser || banner.alt}
                      </span>
                    )}
                    {banner.isBusiness && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    )}
                  </button>
                  {/* Distance, time, and visitor badge for businesses */}
                  {banner.isBusiness && (banner.distance !== undefined || banner.visitorCount !== undefined) && (
                    <div className="absolute top-0.5 right-0.5 z-10">
                      <div className="bg-blue-600 text-white px-0.5 py-0 rounded text-[7px] font-bold shadow-lg flex flex-col items-center gap-0">
                        {banner.distance !== undefined && (
                          <>
                            <span>{banner.distance.toFixed(1)}</span>
                            <span className="text-[6px]">{Math.round(banner.distance * 1.5)}m</span>
                          </>
                        )}
                        {banner.visitorCount !== undefined && (
                          <span className="text-[6px]">👁️{banner.visitorCount || 0}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[61px] sm:max-w-[70px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-11 sm:h-12 px-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[48px] sm:min-w-[56px]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Advertise here - Bottom position ${actualIndex + 1}`}
                  >
                    <span className="text-[7px] sm:text-[8px] font-medium text-gray-500">Ad</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Row 6: 5 images */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5">
            {[...Array(5)].map((_, index) => {
              const banner = mobileRow6[index];
              const actualIndex = index + 25;
              return banner ? (
                <div key={`bottom-mobile-row6-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[61px] sm:max-w-[70px] min-w-[48px] sm:min-w-[56px]">
                  <button
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-13 sm:h-14 px-1 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden animate-bottom-strip-glow"
                    aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Bottom slot ${actualIndex + 1}`}
                    data-banner-id={banner.bannerId}
                    data-section="bottom"
                    data-position={actualIndex}
                    style={{
                      animationDelay: `${actualIndex * 0.5}s`,
                    }}
                  >
                    {banner.imageUrl ? (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.alt}
                        width={41}
                        height={33}
                        className={`${banner.isBusiness ? 'object-cover' : 'object-contain'} max-h-full max-w-full`}
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-700 line-clamp-2 text-center">
                        {banner.advertiser || banner.alt}
                      </span>
                    )}
                    {banner.isBusiness && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    )}
                  </button>
                  {/* Distance, time, and visitor badge for businesses */}
                  {banner.isBusiness && (banner.distance !== undefined || banner.visitorCount !== undefined) && (
                    <div className="absolute top-0.5 right-0.5 z-10">
                      <div className="bg-blue-600 text-white px-0.5 py-0 rounded text-[7px] font-bold shadow-lg flex flex-col items-center gap-0">
                        {banner.distance !== undefined && (
                          <>
                            <span>{banner.distance.toFixed(1)}</span>
                            <span className="text-[6px]">{Math.round(banner.distance * 1.5)}m</span>
                          </>
                        )}
                        {banner.visitorCount !== undefined && (
                          <span className="text-[6px]">👁️{banner.visitorCount || 0}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[61px] sm:max-w-[70px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-11 sm:h-12 px-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[48px] sm:min-w-[56px]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Advertise here - Bottom position ${actualIndex + 1}`}
                  >
                    <span className="text-[7px] sm:text-[8px] font-medium text-gray-500">Ad</span>
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
