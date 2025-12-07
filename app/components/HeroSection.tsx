'use client';

import { useState, useEffect } from 'react';
import { useLocation } from '../contexts/LocationContext';
import type { HeroSectionData } from '../types';
import { safeJsonParse } from '../utils/fetchHelpers';
import LeftRail from './hero/LeftRail';
import RightRail from './hero/RightRail';
import HeroBanner from './hero/HeroBanner';
import BottomStrip from './hero/BottomStrip';
import MobileRails from './hero/MobileRails';
import BestDealsSlider from './hero/BestDealsSlider';

interface HeroSectionProps {
  category?: string;
}

export default function HeroSection({ category }: HeroSectionProps) {
  const { location } = useLocation();
  const [data, setData] = useState<HeroSectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // Fetch banners and nearby shops
        const bannerPromises = [
          fetch(`/api/banners?section=hero&loc=${location.id}${category ? `&cat=${category}` : ''}&limit=1`),
          fetch(`/api/banners?section=left&loc=${location.id}${category ? `&cat=${category}` : ''}&limit=4`),
          fetch(`/api/banners?section=right&loc=${location.id}${category ? `&cat=${category}` : ''}&limit=4`),
          fetch(`/api/banners?section=top&loc=${location.id}${category ? `&cat=${category}` : ''}&limit=20`),
        ];

        // Fetch nearby shops if location coordinates are available
        let nearbyShopsPromise: Promise<Response> | null = null;
        if (location.latitude && location.longitude) {
          nearbyShopsPromise = fetch(`/api/shops/nearby?userLat=${location.latitude}&userLng=${location.longitude}&radiusKm=0&useMongoDB=true${location.city ? `&city=${encodeURIComponent(location.city)}` : ''}${location.area ? `&area=${encodeURIComponent(location.area)}` : ''}${location.pincode ? `&pincode=${location.pincode}` : ''}`);
        }

        const [heroRes, leftRes, rightRes, bottomRes, nearbyShopsRes] = await Promise.all([
          ...bannerPromises,
          nearbyShopsPromise || Promise.resolve(new Response(JSON.stringify({ shops: [] }), { headers: { 'Content-Type': 'application/json' } })),
        ]);

        const [heroData, leftData, rightData, bottomData] = await Promise.all([
          safeJsonParse(heroRes),
          safeJsonParse(leftRes),
          safeJsonParse(rightRes),
          safeJsonParse(bottomRes),
        ]);

        // Fetch nearby shops separately if coordinates available
        // Also fetch all shops with LEFT_BAR/RIGHT_BAR plans if location not available
        let nearbyShopsData: { shops?: any[] } = { shops: [] };
        if (location.latitude && location.longitude && nearbyShopsRes) {
          try {
            const parsed = await safeJsonParse(nearbyShopsRes);
            nearbyShopsData = parsed || { shops: [] };
            console.log(`Fetched ${nearbyShopsData?.shops?.length || 0} nearby shops for left/right bars`);
          } catch (error) {
            console.error('Error parsing nearby shops:', error);
            nearbyShopsData = { shops: [] };
          }
        } else {
          // If location not available, fetch shops with LEFT_BAR and RIGHT_BAR plans separately
          try {
            const [leftBarRes, rightBarRes] = await Promise.all([
              fetch('/api/shops/by-plan?planType=LEFT_BAR&limit=4'),
              fetch('/api/shops/by-plan?planType=RIGHT_BAR&limit=4'),
            ]);
            const leftBarData = await safeJsonParse(leftBarRes);
            const rightBarData = await safeJsonParse(rightBarRes);
            
            const combinedShops = [
              ...(leftBarData?.shops || []),
              ...(rightBarData?.shops || []),
            ];
            
            if (combinedShops.length > 0) {
              nearbyShopsData = { shops: combinedShops };
              console.log(`Fetched ${combinedShops.length} shops with LEFT_BAR/RIGHT_BAR plans (no location)`);
            }
          } catch (error) {
            console.error('Error fetching shops by plan type:', error);
          }
        }

        // Convert nearby shops to banner format for left/right bars and bottom strip
        const nearbyShops = (nearbyShopsData?.shops || []) as Array<{
          id: string;
          name: string;
          imageUrl: string;
          latitude: number;
          longitude: number;
          distance?: number;
          planType?: string;
          priorityRank?: number;
          isLeftBar?: boolean;
          isRightBar?: boolean;
        }>;

        // Filter shops by plan type and sort by priority rank, then distance
        // Left bar: nearby shops with LEFT_BAR plan (sorted by priority rank first, then distance - nearest first)
        const leftBarShops = nearbyShops
          .filter((shop) => {
            // Include shops with LEFT_BAR plan type or isLeftBar flag
            return shop.planType === 'LEFT_BAR' || shop.isLeftBar === true;
          })
          .filter((shop) => {
            // Only include shops with valid coordinates
            return shop.latitude && shop.longitude && !isNaN(shop.latitude) && !isNaN(shop.longitude);
          })
          .sort((a, b) => {
            // Sort by priority rank first (higher = first), then by distance (nearest first)
            const priorityA = a.priorityRank || 0;
            const priorityB = b.priorityRank || 0;
            if (priorityB !== priorityA) {
              return priorityB - priorityA;
            }
            const distanceA = a.distance || 0;
            const distanceB = b.distance || 0;
            return distanceA - distanceB;
          })
          .slice(0, 4)
          .map((shop) => ({
            bannerId: shop.id,
            imageUrl: shop.imageUrl || '/placeholder-shop.jpg',
            alt: shop.name,
            link: `/contact/${shop.id}`,
            advertiser: shop.name,
            lat: shop.latitude,
            lng: shop.longitude,
            distance: shop.distance || 0,
            isBusiness: true,
          }));

        // Right bar: nearby shops with RIGHT_BAR plan (sorted by priority rank first, then distance - nearest first)
        const rightBarShops = nearbyShops
          .filter((shop) => {
            // Include shops with RIGHT_BAR plan type or isRightBar flag
            return shop.planType === 'RIGHT_BAR' || shop.isRightBar === true;
          })
          .filter((shop) => {
            // Only include shops with valid coordinates
            return shop.latitude && shop.longitude && !isNaN(shop.latitude) && !isNaN(shop.longitude);
          })
          .sort((a, b) => {
            // Sort by priority rank first (higher = first), then by distance (nearest first)
            const priorityA = a.priorityRank || 0;
            const priorityB = b.priorityRank || 0;
            if (priorityB !== priorityA) {
              return priorityB - priorityA;
            }
            const distanceA = a.distance || 0;
            const distanceB = b.distance || 0;
            return distanceA - distanceB;
          })
          .slice(0, 4)
          .map((shop) => ({
            bannerId: shop.id,
            imageUrl: shop.imageUrl || '/placeholder-shop.jpg',
            alt: shop.name,
            link: `/contact/${shop.id}`,
            advertiser: shop.name,
            lat: shop.latitude,
            lng: shop.longitude,
            distance: shop.distance || 0,
            isBusiness: true,
          }));

        // Bottom strip: show all nearby shops (sorted by priority rank first, then distance - nearest first)
        const bottomShops = nearbyShops
          .filter((shop) => {
            // Only include shops with valid coordinates
            return shop.latitude && shop.longitude && !isNaN(shop.latitude) && !isNaN(shop.longitude);
          })
          .sort((a, b) => {
            // Sort by priority rank first (higher = first), then by distance (nearest first)
            const priorityA = a.priorityRank || 0;
            const priorityB = b.priorityRank || 0;
            if (priorityB !== priorityA) {
              return priorityB - priorityA;
            }
            const distanceA = a.distance || 0;
            const distanceB = b.distance || 0;
            return distanceA - distanceB;
          })
          .slice(0, 20)
          .map((shop) => ({
            bannerId: shop.id,
            imageUrl: shop.imageUrl || '/placeholder-shop.jpg',
            alt: shop.name,
            link: `/contact/${shop.id}`,
            advertiser: shop.name,
            lat: shop.latitude,
            lng: shop.longitude,
            distance: shop.distance || 0,
            isBusiness: true,
          }));

        // Combine banner data with nearby shops
        // Left bar: nearby shops with LEFT_BAR plan (prioritized) + banners
        const leftBanners = (leftData?.banners || []).map((banner: { id: string; imageUrl: string; title?: string; linkUrl: string; lat?: number; lng?: number }, index: number) => ({
          bannerId: banner.id,
          imageUrl: banner.imageUrl,
          alt: banner.title || `Left banner ${index + 1}`,
          link: banner.linkUrl,
          advertiser: banner.title,
          lat: banner.lat,
          lng: banner.lng,
        }));
        const combinedLeft = [...leftBarShops, ...leftBanners].slice(0, 4);

        // Right bar: nearby shops with RIGHT_BAR plan (prioritized) + banners
        const rightBanners = (rightData?.banners || []).map((banner: { id: string; imageUrl: string; title?: string; linkUrl: string; lat?: number; lng?: number }, index: number) => ({
          bannerId: banner.id,
          imageUrl: banner.imageUrl,
          alt: banner.title || `Right banner ${index + 1}`,
          link: banner.linkUrl,
          advertiser: banner.title,
          lat: banner.lat,
          lng: banner.lng,
        }));
        const combinedRight = [...rightBarShops, ...rightBanners].slice(0, 4);

        // Bottom strip: nearby shops (prioritized) + banners
        const bottomBanners = (bottomData?.banners || []).map((banner: { id: string; imageUrl: string; title?: string; linkUrl: string; lat?: number; lng?: number }, index: number) => ({
          bannerId: banner.id,
          imageUrl: banner.imageUrl,
          alt: banner.title || `Bottom banner ${index + 1}`,
          link: banner.linkUrl,
          advertiser: banner.title,
          lat: banner.lat,
          lng: banner.lng,
        }));
        const combinedBottom = [...bottomShops, ...bottomBanners].slice(0, 20);

        setData({
          hero: heroData?.banners?.[0]
            ? {
                bannerId: heroData.banners[0].id,
                imageUrl: heroData.banners[0].imageUrl,
                alt: heroData.banners[0].title || 'Hero banner',
                link: heroData.banners[0].linkUrl,
                title: heroData.banners[0].title,
                ctaText: heroData.banners[0].cta || heroData.banners[0].ctaText || 'Explore',
                advertiser: heroData.banners[0].advertiser || heroData.banners[0].title,
              }
            : undefined,
          left: combinedLeft,
          right: combinedRight,
          bottom: combinedBottom,
        });
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, [location.id, location.latitude, location.longitude, category]);

  const handleBannerClick = async (
    bannerId: string,
    section: 'hero' | 'left' | 'right' | 'bottom',
    position: number,
    link: string
  ) => {
    // Track analytics
    try {
      await fetch('/api/analytics/banner-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerId, section, position }),
      });
    } catch (error) {
      console.error('Error tracking banner click:', error);
    }

    window.location.href = link;
  };

  if (isLoading) {
    return (
      <section className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 pt-0 pb-6">
        <div className="bg-white rounded-2xl shadow-md p-2 md:p-3">
          <div className="grid grid-cols-1 lg:grid-cols-[20%_60%_20%] gap-3">
            <div className="h-[480px] space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-full bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-[480px] bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-[480px] space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-full bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 pt-0 pb-6">
        <div className="bg-white rounded-2xl shadow-md p-2 md:p-3">
          <div className="h-[480px] bg-linear-to-br from-gray-100 to-gray-200 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 font-medium mb-2">No hero banner available</p>
            <button
              onClick={() => window.location.href = '/advertise'}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Advertise Here
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 pt-0 pb-4 sm:pb-6"
      role="region"
      aria-label="Hero banner section"
    >
      {/* Parent Container - White Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-2 sm:p-2 md:p-3">
        {/* BEST DEALS SLIDER - Full Width at Top */}
        <div className="mb-4">
          <BestDealsSlider category={category} />
        </div>

        {/* Desktop: 3-Column Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-[20%_60%_20%] gap-3 md:gap-4 mb-4">
          {/* LEFT COLUMN (20%) */}
          <LeftRail 
            banners={data.left} 
            onBannerClick={handleBannerClick} 
            height="h-[480px]"
            userLat={location.latitude}
            userLng={location.longitude}
          />

          {/* CENTER COLUMN (60%) - Hero */}
          <div className="flex items-center justify-center">
            <HeroBanner hero={data.hero} onBannerClick={handleBannerClick} />
          </div>

          {/* RIGHT COLUMN (20%) */}
          <RightRail 
            banners={data.right} 
            onBannerClick={handleBannerClick} 
            height="h-[480px]"
            userLat={location.latitude}
            userLng={location.longitude}
          />
        </div>

        {/* Tablet: Adjusted 3-Column Layout */}
        <div className="hidden md:grid lg:hidden md:grid-cols-[18%_64%_18%] gap-2 md:gap-3 mb-4">
          {/* LEFT COLUMN */}
          <LeftRail 
            banners={data.left} 
            onBannerClick={handleBannerClick} 
            height="h-[360px]"
            userLat={location.latitude}
            userLng={location.longitude}
          />

          {/* CENTER COLUMN */}
          <div className="flex items-center justify-center">
            <HeroBanner hero={data.hero} onBannerClick={handleBannerClick} height="h-[360px]" />
          </div>

          {/* RIGHT COLUMN */}
          <RightRail 
            banners={data.right} 
            onBannerClick={handleBannerClick} 
            height="h-[360px]"
            userLat={location.latitude}
            userLng={location.longitude}
          />
        </div>

        {/* Mobile: 3-Column Grid Layout (Same as desktop but smaller) */}
        <div className="md:hidden grid grid-cols-[22%_56%_22%] gap-1.5 sm:gap-2 mb-4">
          {/* LEFT COLUMN */}
          <LeftRail 
            banners={data.left} 
            onBannerClick={handleBannerClick} 
            height="h-[200px] sm:h-[240px]"
            userLat={location.latitude}
            userLng={location.longitude}
          />

          {/* CENTER COLUMN - Hero */}
          <div className="flex items-center justify-center">
            <HeroBanner hero={data.hero} onBannerClick={handleBannerClick} height="h-[200px] sm:h-[240px]" />
          </div>

          {/* RIGHT COLUMN */}
          <RightRail 
            banners={data.right} 
            onBannerClick={handleBannerClick} 
            height="h-[200px] sm:h-[240px]"
            userLat={location.latitude}
            userLng={location.longitude}
          />
        </div>

        {/* BOTTOM STRIP - Full Width */}
        <BottomStrip banners={data.bottom} onBannerClick={handleBannerClick} />
      </div>
    </section>
  );
}
