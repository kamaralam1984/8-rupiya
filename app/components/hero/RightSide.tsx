'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
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

interface RightSideProps {
  banners: Banner[];
  onBannerClick: (bannerId: string, section: 'right', position: number, link: string) => void;
  height?: string; // To match center height
  userLat?: number | null;
  userLng?: number | null;
}

export default function RightSide({ banners, onBannerClick, height = 'h-[480px]', userLat, userLng }: RightSideProps) {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sort banners by distance if user location is available
  const sortedBanners = useMemo(() => {
    if (userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined) {
      const sorted = sortBannersByDistance(banners || [], userLat, userLng);
      return sorted.map(item => item.banner);
    }
    return banners || [];
  }, [banners, userLat, userLng]);

  // Show only first banner (single shop)
  const banner = useMemo(() => {
    return sortedBanners[0];
  }, [sortedBanners]);

  const renderPlaceholder = () => (
    <div
      className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
      onClick={() => window.location.href = '/advertise'}
      role="button"
      tabIndex={0}
      aria-label="Advertise here - Right Side"
    >
      <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="text-sm sm:text-base font-medium text-gray-600">Advertise Here</span>
    </div>
  );

  const distance = banner ? getBannerDistance(banner, userLat ?? null, userLng ?? null) : null;

  return (
    <div 
      className={`${height} overflow-hidden`} 
      aria-live="polite"
    >
      {banner ? (
        <div className="relative group w-full h-full">
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
                    section: 'right', 
                    position: 0 
                  }),
                });
              } catch (error) {
                console.error('Error tracking banner click:', error);
              }
            }}
            className="relative block w-full h-full rounded-lg bg-white shadow-sm overflow-hidden hover:scale-[1.02] hover:shadow-md transition-all duration-150 group cursor-pointer"
            aria-label={`Shop: ${banner.advertiser || banner.alt} - ${banner.area || ''} - Right Side`}
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col justify-end p-3 sm:p-4">
              <h3 className="text-sm sm:text-lg font-bold text-white mb-2 line-clamp-2 drop-shadow-lg">
                {banner.advertiser || banner.alt}
              </h3>
              
              {/* All Info in One Line: km, min, visitor, location */}
              <div className="text-xs sm:text-sm text-white/90 mb-2 line-clamp-1 drop-shadow flex flex-wrap items-center gap-1.5">
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
                <p className="text-xs text-white/80 mt-2 truncate">
                  {banner.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                </p>
              )}
            </div>
          </div>
          
        </div>
      ) : (
        renderPlaceholder()
      )}

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

