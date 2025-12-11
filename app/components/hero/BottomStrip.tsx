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
      {/* Desktop: 3 Rows of 10 images each (total 30 shops, same size) */}
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
                  className="relative w-full inline-flex items-center justify-center h-20 px-2 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-lg transition-all duration-200 overflow-hidden animate-bottom-strip-glow"
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
                  {/* Distance, Time, Visitor - Simple text format */}
                  <div className="absolute bottom-1 left-1 right-1 z-10">
                    <div className="text-blue-700 text-[8px] font-bold text-center bg-white/80 px-1 py-0.5 rounded">
                      {(banner.distance ? banner.distance.toFixed(1) : '0.0').padStart(4, '0')}km / {(banner.distance ? Math.round(banner.distance * 1.5) : 0).toString().padStart(2, '0')}min / {(banner.visitorCount || 0).toString().padStart(2, '0')}visitor
                    </div>
                  </div>
                </a>
              </div>
            ) : (
              <div key={`bottom-placeholder-${index}`} className="flex-1 max-w-[112px]">
                {renderPlaceholder(index)}
              </div>
            );
          })}
        </div>
          {/* Row 2: 10 images */}
          <div className="flex flex-wrap justify-center gap-2 mb-2">
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
                  className="relative w-full inline-flex items-center justify-center h-20 px-2 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-lg transition-all duration-200 overflow-hidden animate-bottom-strip-glow"
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
            ) : (
              <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[112px]">
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
                  className="relative w-full inline-flex items-center justify-center h-20 px-2 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-lg transition-all duration-200 overflow-hidden animate-bottom-strip-glow"
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
            ) : (
              <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[112px]">
                {renderPlaceholder(actualIndex)}
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Mobile: 6 Rows of 5 images each (same size) */}
      <div className="md:hidden relative" aria-live="polite">
        <div>
          {/* Row 1: 5 images */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            {[...Array(5)].map((_, index) => {
              const banner = mobileRow1[index];
              return banner ? (
                <div key={`bottom-mobile-row1-${index}-${banner.bannerId || index}`} className="relative group flex-1 max-w-[61px] sm:max-w-[70px] min-w-[48px] sm:min-w-[56px]">
                  <a
                    href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', index, banner.website || banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 overflow-hidden animate-bottom-strip-glow"
                    aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${index + 1}`}
                    style={{
                      animationDelay: `${index * 0.5}s`,
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
              ) : (
                <div key={`bottom-placeholder-${index}`} className="flex-1 max-w-[61px] sm:max-w-[70px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[48px] sm:min-w-[56px]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Advertise here - Bottom position ${index + 1}`}
                  >
                    <span className="text-[7px] sm:text-[8px] font-medium text-gray-500">Ad</span>
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
                <div key={`bottom-mobile-row2-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[61px] sm:max-w-[70px] min-w-[48px] sm:min-w-[56px]">
                  <a
                    href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.website || banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 overflow-hidden animate-bottom-strip-glow"
                    aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${actualIndex + 1}`}
                    style={{
                      animationDelay: `${actualIndex * 0.5}s`,
                    }}
                  >
                    {banner.imageUrl && (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.alt}
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
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[61px] sm:max-w-[70px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[48px] sm:min-w-[56px]"
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
          {/* Row 3: 5 images */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            {[...Array(5)].map((_, index) => {
              const banner = mobileRow3[index];
              const actualIndex = index + 10;
              return banner ? (
                <div key={`bottom-mobile-row3-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[61px] sm:max-w-[70px] min-w-[48px] sm:min-w-[56px]">
                  <a
                    href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.website || banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 overflow-hidden animate-bottom-strip-glow"
                    aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${actualIndex + 1}`}
                    style={{
                      animationDelay: `${actualIndex * 0.5}s`,
                    }}
                  >
                    {banner.imageUrl && (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.alt}
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
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[61px] sm:max-w-[70px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[48px] sm:min-w-[56px]"
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
          {/* Row 4: 5 images */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            {[...Array(5)].map((_, index) => {
              const banner = mobileRow4[index];
              const actualIndex = index + 15;
              return banner ? (
                <div key={`bottom-mobile-row4-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[61px] sm:max-w-[70px] min-w-[48px] sm:min-w-[56px]">
                  <a
                    href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.website || banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 overflow-hidden animate-bottom-strip-glow"
                    aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${actualIndex + 1}`}
                    style={{
                      animationDelay: `${actualIndex * 0.5}s`,
                    }}
                  >
                    {banner.imageUrl && (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.alt}
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
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[61px] sm:max-w-[70px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[48px] sm:min-w-[56px]"
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
          {/* Row 5: 5 images */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            {[...Array(5)].map((_, index) => {
              const banner = mobileRow5[index];
              const actualIndex = index + 20;
              return banner ? (
                <div key={`bottom-mobile-row5-${actualIndex}-${banner.bannerId || actualIndex}`} className="relative group flex-1 max-w-[61px] sm:max-w-[70px] min-w-[48px] sm:min-w-[56px]">
                  <a
                    href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.website || banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 overflow-hidden animate-bottom-strip-glow"
                    aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${actualIndex + 1}`}
                    style={{
                      animationDelay: `${actualIndex * 0.5}s`,
                    }}
                  >
                    {banner.imageUrl && (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.alt}
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
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[61px] sm:max-w-[70px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[48px] sm:min-w-[56px]"
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
                  <a
                    href={banner.website || banner.link || `/shop/${banner.bannerId}`}
                    onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.website || banner.link)}
                    className="relative w-full inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 overflow-hidden animate-bottom-strip-glow"
                    aria-label={`Shop: ${banner.advertiser || banner.alt} - Bottom slot ${actualIndex + 1}`}
                    style={{
                      animationDelay: `${actualIndex * 0.5}s`,
                    }}
                  >
                    {banner.imageUrl && (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.alt}
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
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[61px] sm:max-w-[70px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-12 sm:h-14 px-1 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[48px] sm:min-w-[56px]"
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
