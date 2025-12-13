'use client';

import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';
import { sortBannersByDistance, getBannerDistance } from '../../utils/shopDistance';
import ShopDetailsModal from '../ShopDetailsModal';

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

interface LeftRailProps {
  banners: Banner[];
  onBannerClick: (bannerId: string, section: 'left', position: number, link: string) => void;
  height?: string; // To match center height
  userLat?: number | null;
  userLng?: number | null;
}

// Fallback banners removed - only shop websites will be shown

export default function LeftRail({ banners, onBannerClick, height = 'h-[480px]', userLat, userLng }: LeftRailProps) {
  const [limit, setLimit] = useState(3);
  const [iconSize, setIconSize] = useState(100);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success) {
          if (data.displayLimits?.leftRail) {
            setLimit(data.displayLimits.leftRail);
          }
          if (data.iconSizes?.leftRail) {
            setIconSize(data.iconSizes.leftRail);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Sort banners by distance if user location is available
  const sortedBanners = useMemo(() => {
    if (userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined) {
      const sorted = sortBannersByDistance(banners, userLat, userLng);
      return sorted.map(item => item.banner);
    }
    return banners;
  }, [banners, userLat, userLng]);

  // Show banners up to configured limit
  const currentBanners = useMemo(() => {
    return sortedBanners.slice(0, limit);
  }, [sortedBanners, limit]);

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

  // Calculate height per banner to fill available space
  // Use iconSize as minimum height, but allow banners to fill available space
  const actualBannerCount = currentBanners.length;
  const minHeight = `${iconSize}px`;
  const heightPerBanner = actualBannerCount > 0 ? `calc((100% - ${(actualBannerCount - 1) * 8}px) / ${actualBannerCount})` : minHeight;

  return (
    <div 
      className={`flex flex-col gap-1 sm:gap-2 ${height} overflow-hidden`} 
      aria-live="polite"
    >
      <div className="h-full flex flex-col gap-1 sm:gap-2">
        {currentBanners.map((banner, index) => {
          const distance = getBannerDistance(banner, userLat ?? null, userLng ?? null);
          return (
            <div
              key={`left-rail-${index}-${banner.bannerId || index}`}
              className="relative group"
              style={{ height: heightPerBanner, minHeight: heightPerBanner }}
            >
              {/* Show shop with image */}
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
                        section: 'left', 
                        position: index 
                      }),
                    });
                  } catch (error) {
                    console.error('Error tracking banner click:', error);
                  }
                }}
                className="relative block w-full h-full rounded-lg bg-white shadow-sm overflow-hidden hover:scale-[1.02] hover:shadow-md transition-all duration-150 group cursor-pointer"
                aria-label={`Shop: ${banner.advertiser || banner.alt} - ${banner.area || ''} - Left slot ${index + 1}`}
              >
                {/* Shop Image */}
                {banner.imageUrl && (
                  <Image
                    src={banner.imageUrl}
                    alt={banner.advertiser || banner.alt}
                    fill
                    className="object-cover"
                    loading="lazy"
                    sizes="(max-width: 640px) 22vw, (max-width: 1024px) 18vw, 20vw"
                  />
                )}
                {/* Overlay with shop info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col justify-end p-2 sm:p-3">
                  <h3 className="text-[10px] sm:text-xs font-bold text-white mb-0.5 line-clamp-2 drop-shadow-lg">
                    {banner.advertiser || banner.alt}
                  </h3>
                  {/* All Info in One Line: km, min, visitor, location */}
                  <div className="text-[7px] sm:text-[9px] text-white/90 mb-1 line-clamp-1 drop-shadow flex flex-wrap items-center gap-1">
                    {(distance !== null || banner.distance !== undefined) && (
                      <>
                        <span className="text-blue-300 font-semibold">{((distance ?? banner.distance) || 0).toFixed(1)} km</span>
                        <span className="text-white/60">•</span>
                        <span className="text-amber-300 font-semibold">{Math.round(((distance ?? banner.distance) || 0) * 1.5)} min</span>
                        {(banner.visitorCount !== undefined || banner.area || banner.city) && (
                          <span className="text-white/60">•</span>
                        )}
                      </>
                    )}
                    {banner.visitorCount !== undefined && (
                      <>
                        <span className="text-white/80 font-semibold">{banner.visitorCount || 0} visitor</span>
                        {(banner.area || banner.city) && (
                          <span className="text-white/60">•</span>
                        )}
                      </>
                    )}
                    {(banner.area || banner.city) && (
                      <span className="text-white/90">📍 {banner.area || banner.city}</span>
                    )}
                  </div>
                  {banner.website && (
                    <p className="text-[7px] sm:text-[9px] text-white/80 mt-1 truncate">
                      {banner.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
