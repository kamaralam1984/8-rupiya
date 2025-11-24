'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Banner {
  bannerId: string;
  imageUrl: string;
  alt: string;
  link: string;
  advertiser?: string;
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

const encodeAssetPath = (path: string) =>
  encodeURI(path).replace(/#/g, '%23');

const createBanner = (id: string, fileName: string, alt: string): Banner => ({
  bannerId: id,
  imageUrl: encodeAssetPath(`/Assets/${fileName}`),
  alt,
  link: '#',
});

const fallbackSetA: Banner[] = [
  createBanner('asset-swiggy', 'Swiggy-logo.jpg', 'Swiggy'),
  createBanner('asset-ola', 'Ola-Cabs-Logo-2048x1153.jpg', 'Ola'),
  createBanner('asset-nykaa', 'Nykaa_New_Logo.svg', 'Nykaa'),
  createBanner('asset-tata', 'Tata_logo.svg.png', 'Tata'),
  createBanner('asset-reliance', 'Reliance-Industries-Limited-Logo.png', 'Reliance'),
  createBanner('asset-parle', 'Parle-Logo-history.png', 'Parle'),
  createBanner('asset-amul', 'Amul-Logo.png', 'Amul'),
  createBanner('asset-itc', 'ITC_-_Company_Logo.jpg', 'ITC'),
  createBanner('asset-infosys', 'Infosys-Logo.jpg', 'Infosys'),
  createBanner('asset-lic', 'LIC-Logo.png', 'LIC'),
  createBanner('asset-godrej', 'Godrej_Logo.svg.png', 'Godrej'),
  createBanner('asset-dabur', 'Dabur_Logo.svg.png', 'Dabur'),
  createBanner('asset-adani', 'Adani_2012_logo.png', 'Adani'),
  createBanner('asset-bajaj', 'Bajaj_Motorcycles_logo.svg.png', 'Bajaj'),
  createBanner('asset-asianpaints', 'ASIANPAINT.NS-6124f67e.png', 'Asian Paints'),
  createBanner('asset-hdfc', 'HDFC-Bank-logo.jpg', 'HDFC Bank'),
  createBanner('asset-indigo', 'IndiGo-Logo.jpg', 'IndiGo'),
  createBanner('asset-flipkart', 'Flipkart-logo (1).jpg', 'Flipkart'),
  createBanner('asset-britannia', 'Britannia_images_Hero_600x400.jpg', 'Britannia'),
  createBanner('asset-parle-biscuit', 'The 100 Most Famous Logos Of All Time (2025 Brands Ranked).jpeg', 'Iconic Logos'),
];

const fallbackSetB: Banner[] = [
  createBanner('asset-sale', 'sale.jpg', 'Sale'),
  createBanner('asset-sprite', 'Sprite logo vector download free SVG PNG.jpeg', 'Sprite'),
  createBanner('asset-famous', 'The 100 Most Famous Logos Of All Time (2025 Brands Ranked).jpeg', 'Famous Logos'),
  createBanner('asset-minimal', '_.jpeg', 'Minimal Logo'),
  createBanner('asset-colors', 'colroful-abstract-circle-logo-design-template-vector.jpg', 'Abstract Logo'),
  createBanner('asset-mahindra', 'Mahindra-Logo.png', 'Mahindra'),
  createBanner('asset-meta', 'Meta Sticker PNG Images (Transparent HD Photo Clipart).jpeg', 'Meta'),
  createBanner('asset-nvidia', 'NVIDIA vector logo (_EPS + .AI + .CDR) download for free', 'NVIDIA'),
  createBanner('asset-visa', 'Visa logo png image #2017 - Free Transparent PNG Logos.jpeg', 'Visa'),
  createBanner('asset-starbucks', 'Starbucks Logo PNG Vector (EPS) Free Download.jpeg', 'Starbucks'),
  createBanner('asset-burgerking', 'Download Burger king new logo on transparent background.jpeg', 'Burger King'),
  createBanner('asset-adidas', 'Adidas Originals Blue Logo Sticker - Sticker Mania.jpeg', 'Adidas'),
  createBanner('asset-lays', 'Lay\'s White.jpeg', 'Lay\'s'),
  createBanner('asset-coca', 'Coca White _ M&I.jpeg', 'Coca'),
  createBanner('asset-sony', 'For the ps3 alone i love sony.jpeg', 'Sony'),
  createBanner('asset-britannia-alt', 'Britannia_images_Hero_600x400.jpg', 'Britannia'),
  createBanner('asset-lenovo', 'Lenovo Logo PNG Vector, Icon Free Download.jpeg', 'Lenovo'),
  createBanner('asset-parle-fmcg', 'parle-continues-to-be-indias-top-fmcg-brand-at-home-12th-time-in-a-row.webp', 'Parle FMCG'),
  createBanner('asset-graphic', 'Graphic Designer Replaces Wordmarks In Famous Logos With The Fonts They Use 2351.jpeg', 'Wordmark Graphics'),
  createBanner('asset-meta-alt', 'Graphic Designer Replaces Wordmarks In 30 Famous Logos With The Fonts They Use.jpeg', 'Wordmark Logos'),
];

const FADE_DURATION = 600;
const ROTATION_INTERVAL = 5000;

export default function BottomStrip({ banners, onBannerClick }: BottomStripProps) {
  const chunkBanners = (source: Banner[]) => {
    const chunks: Banner[][] = [];
    for (let i = 0; i < source.length; i += 20) {
      chunks.push(source.slice(i, i + 20));
    }
    return chunks;
  };

  const bannerSets = useMemo(() => {
    const dynamicSets = chunkBanners(banners);
    if (dynamicSets.length === 0) {
      return [fallbackSetA, fallbackSetB];
    }
    return [...dynamicSets, fallbackSetA, fallbackSetB];
  }, [banners]);

  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (bannerSets.length <= 1) return;
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Don't start interval if hovered
    if (isHovered) return;

    intervalRef.current = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setActiveSetIndex((prev) => (prev + 1) % bannerSets.length);
        setIsFading(false);
      }, FADE_DURATION);
    }, ROTATION_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bannerSets.length, isHovered]);

  useEffect(() => {
    setActiveSetIndex(0);
  }, [bannerSets.length]);

  const currentBanners = bannerSets[activeSetIndex] || [];
  const renderPlaceholder = (position: number) => (
    <div
      onClick={() => window.location.href = '/advertise'}
      className="inline-flex items-center justify-center h-16 md:h-20 px-4 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[100px]"
      role="button"
      tabIndex={0}
      aria-label={`Advertise here - Bottom position ${position + 1}`}
    >
      <span className="text-xs font-medium text-gray-500">Ad</span>
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
    <div 
      className="w-full mt-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Desktop: 2 Rows of 10 images each */}
      <div className="hidden md:block relative" aria-live="polite">
        <div
          className={`transition-opacity ${isFading ? 'opacity-0' : 'opacity-100'}`}
          style={{ transitionDuration: `${FADE_DURATION}ms` }}
        >
          {/* Row 1: 10 images */}
          <div className="flex flex-wrap justify-center gap-2 mb-2">
          {[...Array(10)].map((_, index) => {
            const banner = row1[index];
            return banner ? (
              <button
                key={banner.bannerId}
                onClick={() => onBannerClick(banner.bannerId, 'bottom', index, banner.link)}
                className="inline-flex items-center justify-center h-16 md:h-18 px-3 rounded-md border border-gray-200 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[100px] flex-1 max-w-[120px]"
                aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Bottom slot ${index + 1}`}
                data-banner-id={banner.bannerId}
                data-section="bottom"
                data-position={index}
              >
                <Image
                  src={banner.imageUrl}
                  alt={banner.alt}
                  width={70}
                  height={56}
                  className="object-contain max-h-full max-w-full"
                  loading="lazy"
                />
              </button>
            ) : (
              <div key={`bottom-placeholder-${index}`} className="flex-1 max-w-[120px]">
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
              <button
                key={banner.bannerId}
                onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.link)}
                className="inline-flex items-center justify-center h-16 md:h-18 px-3 rounded-md border border-gray-200 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[100px] flex-1 max-w-[120px]"
                aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Bottom slot ${actualIndex + 1}`}
                data-banner-id={banner.bannerId}
                data-section="bottom"
                data-position={actualIndex}
              >
                <Image
                  src={banner.imageUrl}
                  alt={banner.alt}
                  width={70}
                  height={56}
                  className="object-contain max-h-full max-w-full"
                  loading="lazy"
                />
              </button>
            ) : (
              <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[120px]">
                {renderPlaceholder(actualIndex)}
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Mobile: 4 Rows of 5 images each (smaller sizes) */}
      <div className="md:hidden relative" aria-live="polite">
        <div
          className={`transition-opacity ${isFading ? 'opacity-0' : 'opacity-100'}`}
          style={{ transitionDuration: `${FADE_DURATION}ms` }}
        >
          {/* Row 1: 5 images */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
            {[...Array(5)].map((_, index) => {
              const banner = mobileRow1[index];
              return banner ? (
                <button
                  key={banner.bannerId}
                  onClick={() => onBannerClick(banner.bannerId, 'bottom', index, banner.link)}
                  className="inline-flex items-center justify-center h-10 sm:h-12 px-1 sm:px-1.5 rounded-md border border-gray-200 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[50px] sm:min-w-[60px] flex-1 max-w-[65px] sm:max-w-[75px]"
                  aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Bottom slot ${index + 1}`}
                  data-banner-id={banner.bannerId}
                  data-section="bottom"
                  data-position={index}
                >
                  <Image
                    src={banner.imageUrl}
                    alt={banner.alt}
                    width={35}
                    height={28}
                    className="object-contain max-h-full max-w-full"
                    loading="lazy"
                  />
                </button>
              ) : (
                <div key={`bottom-placeholder-${index}`} className="flex-1 max-w-[65px] sm:max-w-[75px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-10 sm:h-12 px-1 sm:px-1.5 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[50px] sm:min-w-[60px]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Advertise here - Bottom position ${index + 1}`}
                  >
                    <span className="text-[8px] sm:text-[9px] font-medium text-gray-500">Ad</span>
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
                <button
                  key={banner.bannerId}
                  onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.link)}
                  className="inline-flex items-center justify-center h-10 sm:h-12 px-1 sm:px-1.5 rounded-md border border-gray-200 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[50px] sm:min-w-[60px] flex-1 max-w-[65px] sm:max-w-[75px]"
                  aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Bottom slot ${actualIndex + 1}`}
                  data-banner-id={banner.bannerId}
                  data-section="bottom"
                  data-position={actualIndex}
                >
                  <Image
                    src={banner.imageUrl}
                    alt={banner.alt}
                    width={35}
                    height={28}
                    className="object-contain max-h-full max-w-full"
                    loading="lazy"
                  />
                </button>
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[65px] sm:max-w-[75px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-10 sm:h-12 px-1 sm:px-1.5 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[50px] sm:min-w-[60px]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Advertise here - Bottom position ${actualIndex + 1}`}
                  >
                    <span className="text-[8px] sm:text-[9px] font-medium text-gray-500">Ad</span>
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
                <button
                  key={banner.bannerId}
                  onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.link)}
                  className="inline-flex items-center justify-center h-10 sm:h-12 px-1 sm:px-1.5 rounded-md border border-gray-200 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[50px] sm:min-w-[60px] flex-1 max-w-[65px] sm:max-w-[75px]"
                  aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Bottom slot ${actualIndex + 1}`}
                  data-banner-id={banner.bannerId}
                  data-section="bottom"
                  data-position={actualIndex}
                >
                  <Image
                    src={banner.imageUrl}
                    alt={banner.alt}
                    width={35}
                    height={28}
                    className="object-contain max-h-full max-w-full"
                    loading="lazy"
                  />
                </button>
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[65px] sm:max-w-[75px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-10 sm:h-12 px-1 sm:px-1.5 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[50px] sm:min-w-[60px]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Advertise here - Bottom position ${actualIndex + 1}`}
                  >
                    <span className="text-[8px] sm:text-[9px] font-medium text-gray-500">Ad</span>
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
                <button
                  key={banner.bannerId}
                  onClick={() => onBannerClick(banner.bannerId, 'bottom', actualIndex, banner.link)}
                  className="inline-flex items-center justify-center h-10 sm:h-12 px-1 sm:px-1.5 rounded-md border border-gray-200 bg-white shadow-sm hover:scale-105 hover:shadow-md hover:border-blue-400 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[50px] sm:min-w-[60px] flex-1 max-w-[65px] sm:max-w-[75px]"
                  aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Bottom slot ${actualIndex + 1}`}
                  data-banner-id={banner.bannerId}
                  data-section="bottom"
                  data-position={actualIndex}
                >
                  <Image
                    src={banner.imageUrl}
                    alt={banner.alt}
                    width={35}
                    height={28}
                    className="object-contain max-h-full max-w-full"
                    loading="lazy"
                  />
                </button>
              ) : (
                <div key={`bottom-placeholder-${actualIndex}`} className="flex-1 max-w-[65px] sm:max-w-[75px]">
                  <div
                    onClick={() => window.location.href = '/advertise'}
                    className="inline-flex items-center justify-center h-10 sm:h-12 px-1 sm:px-1.5 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer min-w-[50px] sm:min-w-[60px]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Advertise here - Bottom position ${actualIndex + 1}`}
                  >
                    <span className="text-[8px] sm:text-[9px] font-medium text-gray-500">Ad</span>
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
