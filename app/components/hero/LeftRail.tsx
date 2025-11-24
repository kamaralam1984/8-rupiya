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

interface LeftRailProps {
  banners: Banner[];
  onBannerClick: (bannerId: string, section: 'left', position: number, link: string) => void;
  height?: string; // To match center height
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

const FADE_DURATION = 600;
const ROTATION_INTERVAL = 7000;

export default function LeftRail({ banners, onBannerClick, height = 'h-[480px]' }: LeftRailProps) {
  const chunkBanners = (source: Banner[]) => {
    const chunks: Banner[][] = [];
    for (let i = 0; i < source.length; i += 4) {
      chunks.push(source.slice(i, i + 4));
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
      className="w-full flex-1 min-h-[45px] sm:min-h-[100px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`h-full flex flex-col gap-1 sm:gap-2 transition-opacity ${isFading ? 'opacity-0' : 'opacity-100'}`}
        style={{ transitionDuration: `${FADE_DURATION}ms` }}
      >
        {[0, 1, 2, 3].map((index) => {
          const banner = currentBanners[index];
          return banner ? (
            <button
              key={banner.bannerId}
              onClick={() => onBannerClick(banner.bannerId, 'left', index, banner.link)}
              className="relative w-full flex-1 min-h-[45px] sm:min-h-[100px] rounded-lg bg-white shadow-sm overflow-hidden hover:scale-[1.02] hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - Left slot ${index + 1}`}
              data-banner-id={banner.bannerId}
              data-section="left"
              data-position={index}
            >
              <Image
                src={banner.imageUrl}
                alt={banner.alt}
                fill
                className="object-contain p-1 sm:p-2"
                loading="lazy"
                sizes="(max-width: 640px) 22vw, (max-width: 1024px) 18vw, 20vw"
              />
            </button>
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
