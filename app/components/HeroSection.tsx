'use client';

import { useState, useEffect } from 'react';
import { useLocation } from '../contexts/LocationContext';
import type { HeroSectionData } from '../types';
import LeftRail from './hero/LeftRail';
import RightRail from './hero/RightRail';
import HeroBanner from './hero/HeroBanner';
import BottomStrip from './hero/BottomStrip';
import MobileRails from './hero/MobileRails';

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
        // Fetch all banners for hero section
        const [heroRes, leftRes, rightRes, bottomRes] = await Promise.all([
          fetch(`/api/banners?section=hero&loc=${location.id}${category ? `&cat=${category}` : ''}&limit=1`),
          fetch(`/api/banners?section=left&loc=${location.id}${category ? `&cat=${category}` : ''}&limit=4`),
          fetch(`/api/banners?section=right&loc=${location.id}${category ? `&cat=${category}` : ''}&limit=4`),
          fetch(`/api/banners?section=top&loc=${location.id}${category ? `&cat=${category}` : ''}&limit=20`),
        ]);

        const [heroData, leftData, rightData, bottomData] = await Promise.all([
          heroRes.json(),
          leftRes.json(),
          rightRes.json(),
          bottomRes.json(),
        ]);

        setData({
          hero: heroData.banners?.[0]
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
          left: (leftData.banners || []).map((banner: { id: string; imageUrl: string; title?: string; linkUrl: string }, index: number) => ({
            bannerId: banner.id,
            imageUrl: banner.imageUrl,
            alt: banner.title || `Left banner ${index + 1}`,
            link: banner.linkUrl,
            advertiser: banner.title,
          })),
          right: (rightData.banners || []).map((banner: { id: string; imageUrl: string; title?: string; linkUrl: string }, index: number) => ({
            bannerId: banner.id,
            imageUrl: banner.imageUrl,
            alt: banner.title || `Right banner ${index + 1}`,
            link: banner.linkUrl,
            advertiser: banner.title,
          })),
          bottom: (bottomData.banners || []).map((banner: { id: string; imageUrl: string; title?: string; linkUrl: string }, index: number) => ({
            bannerId: banner.id,
            imageUrl: banner.imageUrl,
            alt: banner.title || `Bottom banner ${index + 1}`,
            link: banner.linkUrl,
            advertiser: banner.title,
          })),
        });
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, [location.id, category]);

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
        {/* Desktop: 3-Column Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-[20%_60%_20%] gap-3 md:gap-4 mb-4">
          {/* LEFT COLUMN (20%) */}
          <LeftRail banners={data.left} onBannerClick={handleBannerClick} height="h-[480px]" />

          {/* CENTER COLUMN (60%) - Hero */}
          <div className="flex items-center justify-center">
            <HeroBanner hero={data.hero} onBannerClick={handleBannerClick} />
          </div>

          {/* RIGHT COLUMN (20%) */}
          <RightRail banners={data.right} onBannerClick={handleBannerClick} height="h-[480px]" />
        </div>

        {/* Tablet: Adjusted 3-Column Layout */}
        <div className="hidden md:grid lg:hidden md:grid-cols-[18%_64%_18%] gap-2 md:gap-3 mb-4">
          {/* LEFT COLUMN */}
          <LeftRail banners={data.left} onBannerClick={handleBannerClick} height="h-[360px]" />

          {/* CENTER COLUMN */}
          <div className="flex items-center justify-center">
            <HeroBanner hero={data.hero} onBannerClick={handleBannerClick} height="h-[360px]" />
          </div>

          {/* RIGHT COLUMN */}
          <RightRail banners={data.right} onBannerClick={handleBannerClick} height="h-[360px]" />
        </div>

        {/* Mobile: 3-Column Grid Layout (Same as desktop but smaller) */}
        <div className="md:hidden grid grid-cols-[22%_56%_22%] gap-1.5 sm:gap-2 mb-4">
          {/* LEFT COLUMN */}
          <LeftRail banners={data.left} onBannerClick={handleBannerClick} height="h-[200px] sm:h-[240px]" />

          {/* CENTER COLUMN - Hero */}
          <div className="flex items-center justify-center">
            <HeroBanner hero={data.hero} onBannerClick={handleBannerClick} height="h-[200px] sm:h-[240px]" />
          </div>

          {/* RIGHT COLUMN */}
          <RightRail banners={data.right} onBannerClick={handleBannerClick} height="h-[200px] sm:h-[240px]" />
        </div>

        {/* BOTTOM STRIP - Full Width */}
        <BottomStrip banners={data.bottom} onBannerClick={handleBannerClick} />
      </div>
    </section>
  );
}
