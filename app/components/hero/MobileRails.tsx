'use client';

import Image from 'next/image';

interface Banner {
  bannerId: string;
  imageUrl: string;
  alt: string;
  link: string;
  advertiser?: string;
}

interface MobileRailsProps {
  leftBanners: Banner[];
  rightBanners: Banner[];
  onBannerClick: (bannerId: string, section: 'left' | 'right', position: number, link: string) => void;
}

export default function MobileRails({ leftBanners, rightBanners, onBannerClick }: MobileRailsProps) {
  const renderPlaceholder = (section: string, position: number) => (
    <div
      className="w-full h-[100px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
      onClick={() => window.location.href = '/advertise'}
      role="button"
      tabIndex={0}
      aria-label={`Advertise here - ${section} position ${position + 1}`}
    >
      <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="text-xs font-medium text-gray-600">Advertise</span>
    </div>
  );

  const allBanners = [...leftBanners, ...rightBanners];

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-2 sm:-mx-4 px-2 sm:px-4">
      <div className="flex gap-2 sm:gap-3" style={{ width: 'max-content' }}>
        {allBanners.map((banner, index) => (
          <button
            key={banner.bannerId}
            onClick={() => onBannerClick(banner.bannerId, index < 4 ? 'left' : 'right', index % 4, banner.link)}
            className="relative shrink-0 w-[140px] sm:w-[160px] h-[100px] sm:h-[120px] rounded-lg bg-white shadow-sm overflow-hidden hover:scale-[1.02] hover:shadow-md transition-all duration-150 min-w-[140px] sm:min-w-[160px] min-h-[100px] sm:min-h-[120px]"
            aria-label={`Banner: ${banner.advertiser || 'Advertisement'} - ${index < 4 ? 'Left' : 'Right'} slot ${(index % 4) + 1}`}
            data-banner-id={banner.bannerId}
            data-section={index < 4 ? 'left' : 'right'}
            data-position={index % 4}
          >
            <Image
              src={banner.imageUrl}
              alt={banner.alt}
              fill
              className="object-contain p-1.5 sm:p-2"
              loading="lazy"
              sizes="(max-width: 640px) 140px, 160px"
            />
          </button>
        ))}
        {/* Fill remaining slots if needed */}
        {[...Array(8 - allBanners.length)].map((_, index) => (
          <div key={`mobile-placeholder-${index}`} className="shrink-0 w-[140px] sm:w-[160px] min-w-[140px] sm:min-w-[160px]">
            {renderPlaceholder('mobile', index)}
          </div>
        ))}
      </div>
    </div>
  );
}
