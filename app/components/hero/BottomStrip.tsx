'use client';

import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';
import ShopDetailsModal from '../ShopDetailsModal';

interface Banner {
  bannerId: string;
  imageUrl?: string;
  alt: string;
  link: string;
  advertiser?: string;
  shopName?: string;
  name?: string;
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

export default function BottomStrip({ banners, onBannerClick }: BottomStripProps) {
  const [limit, setLimit] = useState(30);
  const [iconSize, setIconSize] = useState({ desktop: 66, mobile: 41 });
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success) {
          if (data.displayLimits?.nearbyShops) {
            setLimit(data.displayLimits.nearbyShops);
          }
          if (data.iconSizes?.bottomStrip) {
            const size = data.iconSizes.bottomStrip;
            setIconSize({ desktop: size, mobile: Math.round(size * 0.62) });
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Deduplicate banners by bannerId to ensure each shop appears only once
  const uniqueBanners = useMemo(() => {
    const seen = new Set<string>();
    return banners.filter((banner) => {
      if (!banner || !banner.bannerId) return false;
      if (seen.has(banner.bannerId)) return false;
      seen.add(banner.bannerId);
      return true;
    });
  }, [banners]);

  // Show shops up to configured limit
  const currentBanners = useMemo(() => {
    return uniqueBanners.slice(0, limit);
  }, [uniqueBanners, limit]);

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

  const renderBanner = (banner: Banner, index: number, rowLength: number, isMobile: boolean = false) => {
    const actualIndex = index;
    // Calculate flex-basis to fill available space when fewer items than max per row
    const itemsPerRow = isMobile ? itemsPerRowMobile : itemsPerRowDesktop;
    const flexBasis = rowLength < itemsPerRow ? `${100 / rowLength}%` : undefined;
    
    return banner ? (
      <div 
        key={`bottom-${isMobile ? 'mobile-' : ''}${actualIndex}-${banner.bannerId || actualIndex}`} 
        className={`relative group flex-1 ${isMobile ? 'max-w-[61px] sm:max-w-[70px] min-w-[48px] sm:min-w-[56px]' : 'max-w-[112px] min-w-[94px]'}`}
        style={flexBasis ? { flexBasis, maxWidth: flexBasis } : {}}
      >
        <div
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only open modal for shops (not external websites)
            if (!banner.website) {
              setSelectedShopId(banner.bannerId);
              setIsModalOpen(true);
            } else {
              // External websites open in new tab
              window.open(banner.website, '_blank', 'noopener,noreferrer');
            }
            // Track analytics
            try {
              await fetch('/api/analytics/banner-click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  bannerId: banner.bannerId, 
                  section: 'bottom', 
                  position: actualIndex 
                }),
              });
            } catch (error) {
              console.error('Error tracking banner click:', error);
            }
          }}
          className={`relative w-full inline-flex flex-col items-center justify-center ${isMobile ? 'h-12 sm:h-14 px-1' : 'h-20 px-2'} rounded-md border-2 border-gray-200 bg-white shadow-sm hover:scale-105 ${isMobile ? 'hover:shadow-md' : 'hover:shadow-lg'} transition-all duration-200 overflow-hidden cursor-pointer`}
          aria-label={`Shop: ${banner.advertiser || banner.alt} - ${banner.area || ''} - Bottom slot ${actualIndex + 1}`}
        >
          {banner.imageUrl && (
            <Image
              src={banner.imageUrl}
              alt={banner.advertiser || banner.alt}
              width={isMobile ? iconSize.mobile : iconSize.desktop}
              height={isMobile ? Math.round(iconSize.mobile * 0.8) : Math.round(iconSize.desktop * 0.8)}
              className="object-cover max-h-full max-w-full"
              loading="lazy"
            />
          )}
          {/* Shop name, distance, time, and visitor count in one line */}
          <div className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 ${isMobile ? 'text-[6px]' : 'text-[7px]'} leading-tight`}>
            <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-center">
              {/* Shop Name */}
              {(banner.advertiser || banner.shopName || banner.name) && (
                <span className="font-semibold truncate max-w-[45%] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {banner.advertiser || banner.shopName || banner.name}
                </span>
              )}
              {/* Separator */}
              {((banner.advertiser || banner.shopName || banner.name) && 
                (banner.distance !== undefined || banner.visitorCount !== undefined)) && (
                <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">•</span>
              )}
              {/* Distance - Red */}
              {banner.distance !== undefined && banner.distance > 0 && (
                <span className="whitespace-nowrap text-red-500 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{banner.distance.toFixed(1)}km</span>
              )}
              {/* Time - Yellow */}
              {banner.distance !== undefined && banner.distance > 0 && (
                <>
                  <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">•</span>
                  <span className="whitespace-nowrap text-yellow-400 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{Math.round(banner.distance * 1.5)}min</span>
                </>
              )}
              {/* Visitor Count */}
              {banner.visitorCount !== undefined && (
                <>
                  {(banner.distance !== undefined || banner.advertiser || banner.shopName || banner.name) && (
                    <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">•</span>
                  )}
                  <span className="whitespace-nowrap text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{banner.visitorCount || 0}👁️</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div key={`bottom-placeholder-${actualIndex}`} className={`flex-1 ${isMobile ? 'max-w-[61px] sm:max-w-[70px]' : 'max-w-[112px]'}`}>
        {renderPlaceholder(actualIndex)}
      </div>
    );
  };

  // Split banners into rows dynamically based on limit
  const itemsPerRowDesktop = 10;
  const itemsPerRowMobile = 5;
  const totalRowsDesktop = Math.ceil(limit / itemsPerRowDesktop);
  const totalRowsMobile = Math.ceil(limit / itemsPerRowMobile);
  
  // Desktop rows
  const desktopRows = Array.from({ length: totalRowsDesktop }).map((_, i) => 
    currentBanners.slice(i * itemsPerRowDesktop, (i + 1) * itemsPerRowDesktop)
  );
  
  // Mobile rows
  const mobileRows = Array.from({ length: totalRowsMobile }).map((_, i) => 
    currentBanners.slice(i * itemsPerRowMobile, (i + 1) * itemsPerRowMobile)
  );

  return (
    <div className="w-full mt-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 px-2">
        Nearby Shops ({currentBanners.length})
      </h2>
      
      {/* Desktop: Dynamic rows */}
      <div className="hidden md:block relative" aria-live="polite">
        <div>
          {desktopRows.map((row, rowIndex) => {
            const rowLength = row.filter(b => b).length;
            return (
              <div key={`desktop-row-${rowIndex}`} className={`flex flex-wrap justify-center gap-2 ${rowIndex < desktopRows.length - 1 ? 'mb-2' : ''}`}>
                {row.map((banner, index) => {
                  const actualIndex = rowIndex * itemsPerRowDesktop + index;
                  return renderBanner(banner, actualIndex, rowLength, false);
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: Dynamic rows */}
      <div className="md:hidden relative" aria-live="polite">
        <div>
          {mobileRows.map((row, rowIndex) => {
            const rowLength = row.filter(b => b).length;
            return (
              <div key={`mobile-row-${rowIndex}`} className={`flex flex-wrap justify-center gap-1 sm:gap-1.5 ${rowIndex < mobileRows.length - 1 ? 'mb-1 sm:mb-1.5' : ''}`}>
                {row.map((banner, index) => {
                  const actualIndex = rowIndex * itemsPerRowMobile + index;
                  return renderBanner(banner, actualIndex, rowLength, true);
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Shop Details Modal */}
      <ShopDetailsModal
        shopId={selectedShopId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedShopId(null);
        }}
      />
    </div>
  );
}
