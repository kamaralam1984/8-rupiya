'use client';

import { useState, useEffect } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { useSearch } from '../contexts/SearchContext';
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
  const { searchParams, isSearchActive } = useSearch();
  const [data, setData] = useState<HeroSectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // If search is active, fetch search results instead
        if (isSearchActive) {
          const searchParamsObj = new URLSearchParams();
          if (searchParams.pincode) searchParamsObj.append('pincode', searchParams.pincode);
          if (searchParams.area) searchParamsObj.append('area', searchParams.area);
          if (searchParams.category) searchParamsObj.append('category', searchParams.category);
          if (searchParams.shopName) searchParamsObj.append('shopName', searchParams.shopName);
          if (location.latitude) searchParamsObj.append('userLat', location.latitude.toString());
          if (location.longitude) searchParamsObj.append('userLng', location.longitude.toString());

          const searchRes = await fetch(`/api/search?${searchParamsObj.toString()}`);
          const searchData = await safeJsonParse<{
            success: boolean;
            mainResults: any[];
            leftRail: any[];
            rightRail: any[];
            bottomStrip: any[];
          }>(searchRes);

          if (searchData?.success) {
            // Transform search results to banner format
            const transformShopToBanner = (shop: any) => ({
              bannerId: shop.id,
              imageUrl: shop.imageUrl || shop.photoUrl || '/placeholder-shop.jpg',
              alt: shop.name || shop.shopName || 'Shop',
              link: shop.shopUrl ? `/shop/${shop.shopUrl}` : `/contact/${shop.id}`,
              advertiser: shop.name || shop.shopName || 'Shop',
              lat: shop.latitude || 0,
              lng: shop.longitude || 0,
              distance: shop.distance || 0,
              isBusiness: true,
              website: shop.website || undefined,
              area: shop.area || '',
              city: shop.city || '',
            });

            // Transform hero shop
            const heroShop = searchData.mainResults[0];
            const heroBanner = heroShop ? {
              bannerId: heroShop.id,
              imageUrl: heroShop.imageUrl || heroShop.photoUrl || '/placeholder-shop.jpg',
              alt: heroShop.name || heroShop.shopName || 'Shop',
              link: heroShop.shopUrl ? `/shop/${heroShop.shopUrl}` : `/contact/${heroShop.id}`,
              title: heroShop.name || heroShop.shopName || 'Shop',
              ctaText: 'View Shop',
              advertiser: heroShop.name || heroShop.shopName || 'Shop',
            } : undefined;

            // Transform rails - limit to 3 for left/right, 20 for bottom
            const leftBanners = searchData.leftRail.slice(0, 3).map(transformShopToBanner);
            const rightBanners = searchData.rightRail.slice(0, 3).map(transformShopToBanner);
            const bottomBanners = searchData.bottomStrip.slice(0, 20).map(transformShopToBanner);

            setData({
              hero: heroBanner || undefined,
              left: leftBanners,
              right: rightBanners,
              bottom: bottomBanners,
            });
            setIsLoading(false);
            return;
          }
        }

        // Normal flow - Fetch banners and nearby shops
        const bannerPromises = [
          fetch(`/api/banners?section=hero&loc=${location.id}${category ? `&cat=${category}` : ''}&limit=1`),
          fetch(`/api/banners?section=left&loc=${location.id}${category ? `&cat=${category}` : ''}&limit=4`),
          fetch(`/api/banners?section=right&loc=${location.id}${category ? `&cat=${category}` : ''}&limit=4`),
          fetch(`/api/banners?section=top&loc=${location.id}${category ? `&cat=${category}` : ''}&limit=20`),
        ];

        // Fetch nearby shops - always try to fetch, with or without location
        // Use 1000 km radius to show shops from 0-1000 km range
        let nearbyShopsPromise: Promise<Response> | null = null;
        if (location.latitude && location.longitude) {
          // Fetch with coordinates
          nearbyShopsPromise = fetch(`/api/shops/nearby?userLat=${location.latitude}&userLng=${location.longitude}&radiusKm=1000&useMongoDB=true${location.city ? `&city=${encodeURIComponent(location.city)}` : ''}${location.area ? `&area=${encodeURIComponent(location.area)}` : ''}${location.pincode ? `&pincode=${location.pincode}` : ''}`);
        } else if (location.city || location.area || location.pincode) {
          // Fetch with location filters (city/area/pincode)
          const cityFilter = location.city || 'Patna';
          nearbyShopsPromise = fetch(`/api/shops/nearby?city=${encodeURIComponent(cityFilter)}&radiusKm=1000&useMongoDB=true${location.area ? `&area=${encodeURIComponent(location.area)}` : ''}${location.pincode ? `&pincode=${location.pincode}` : ''}`);
        } else {
          // No location at all - fetch all shops (will be limited to 100 by API)
          nearbyShopsPromise = fetch(`/api/shops/nearby?radiusKm=1000&useMongoDB=true&limit=50`);
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

        // Fetch nearby shops for left/right rails (location-based)
        let nearbyShopsData: { shops?: any[] } = { shops: [] };
        
        // Fetch ALL shops for homepage (all locations)
        let allShopsData: { shops?: any[] } = { shops: [] };
        
        // Always try to fetch shops - with or without location
        try {
          // 1. Fetch nearby shops for left/right rails (location-based, 0-1000 km)
          if (location.latitude && location.longitude && nearbyShopsRes) {
            const parsed = await safeJsonParse(nearbyShopsRes);
            nearbyShopsData = parsed || { shops: [] };
            console.log(`📍 Fetched ${nearbyShopsData?.shops?.length || 0} nearby shops (with location) for left/right rails`);
          }
          
          // If no nearby shops found, try fetching by city/area
          if (!nearbyShopsData?.shops || nearbyShopsData.shops.length === 0) {
            console.log('📍 No nearby shops found, fetching shops by city/area...');
            const cityFilter = location.city || 'Patna';
            const allShopsRes = await fetch(`/api/shops/nearby?city=${encodeURIComponent(cityFilter)}&radiusKm=1000&useMongoDB=true&limit=50`).catch(() => null);
            if (allShopsRes) {
              const parsed = await safeJsonParse(allShopsRes);
              if (parsed?.shops && parsed.shops.length > 0) {
                nearbyShopsData = parsed;
                console.log(`📍 Fetched ${parsed.shops.length} shops from database (city: ${cityFilter}) for left/right rails`);
              }
            }
          }
          
          // 2. Fetch ALL shops for homepage (all locations, no filter)
          console.log('🌍 Fetching ALL shops from all locations for homepage...');
          const allLocationsRes = await fetch('/api/shops/nearby?radiusKm=1000&useMongoDB=true&limit=200').catch(() => null);
          if (allLocationsRes) {
            const parsed = await safeJsonParse(allLocationsRes);
            if (parsed?.shops && parsed.shops.length > 0) {
              allShopsData = parsed;
              console.log(`🌍 Fetched ${parsed.shops.length} shops from ALL locations for homepage`);
            }
          }
          
          // If still no shops, try fetching by plan types
          if (!nearbyShopsData?.shops || nearbyShopsData.shops.length === 0) {
            console.log('📍 Trying to fetch shops by plan types for left/right rails...');
            const [leftBarRes, rightBarRes, heroRes] = await Promise.all([
              fetch('/api/shops/by-plan?planType=LEFT_BAR&limit=10').catch(() => null),
              fetch('/api/shops/by-plan?planType=RIGHT_BAR&limit=10').catch(() => null),
              fetch('/api/shops/by-plan?planType=HERO&limit=10').catch(() => null),
            ]);
            
            const leftBarData = leftBarRes ? await safeJsonParse(leftBarRes) : null;
            const rightBarData = rightBarRes ? await safeJsonParse(rightBarRes) : null;
            const heroData = heroRes ? await safeJsonParse(heroRes) : null;
            
            const combinedShops = [
              ...(leftBarData?.shops || []),
              ...(rightBarData?.shops || []),
              ...(heroData?.shops || []),
            ];
            
            if (combinedShops.length > 0) {
              nearbyShopsData = { shops: combinedShops };
              console.log(`📍 Fetched ${combinedShops.length} shops by plan types for left/right rails`);
            }
          }
        } catch (error) {
          console.error('❌ Error fetching shops:', error);
          nearbyShopsData = { shops: [] };
          allShopsData = { shops: [] };
        }

        // Convert nearby shops to banner format for left/right bars (location-based)
        const nearbyShops = (nearbyShopsData?.shops || []) as Array<{
          id: string;
          name: string;
          shopName?: string;
          imageUrl: string;
          photoUrl?: string;
          shopUrl?: string;
          latitude: number;
          longitude: number;
          distance?: number;
          planType?: string;
          priorityRank?: number;
          isLeftBar?: boolean;
          isRightBar?: boolean;
          website?: string;
          area?: string;
          city?: string;
        }>;
        
        console.log(`📍 Total nearby shops found (for left/right rails): ${nearbyShops.length}`);

        // Fetch shops from different Patna areas if no shops found or to get variety
        let patnaAreaShops: any[] = [];
        if (location.city?.toLowerCase().includes('patna') || !nearbyShops.length) {
          const patnaAreas = ['Bailey Road', 'Boring Road', 'Kankarbagh', 'Rajendra Nagar', 'Exhibition Road', 'Fraser Road', 'Ashiana Nagar', 'Danapur'];
          try {
            // Fetch more shops from different areas to ensure we have enough
            const areaPromises = patnaAreas.map(area => 
              fetch(`/api/shops/nearby?city=Patna&area=${encodeURIComponent(area)}&radiusKm=1000&useMongoDB=true&limit=5`)
            );
            const areaResponses = await Promise.all(areaPromises);
            const areaData = await Promise.all(areaResponses.map(res => safeJsonParse(res)));
            patnaAreaShops = areaData.flatMap(data => data?.shops || []);
          } catch (error) {
            console.error('Error fetching Patna area shops:', error);
          }
        }

        // Remove duplicates and ensure unique shops across all sections
        const usedShopIds = new Set<string>();
        
        // Convert all shops data for homepage (all locations)
        const allShops = (allShopsData?.shops || []) as Array<{
          id: string;
          name: string;
          shopName?: string;
          imageUrl: string;
          photoUrl?: string;
          shopUrl?: string;
          latitude: number;
          longitude: number;
          distance?: number;
          planType?: string;
          priorityRank?: number;
          website?: string;
          area?: string;
          city?: string;
        }>;
        
        console.log(`🌍 Total shops from all locations: ${allShops.length}`);
        
        // Hero: Show shop from ALL locations with highest priority (HERO plan) or any shop
        const heroShop = [
          ...allShops.filter(s => !usedShopIds.has(s.id)), // From all locations
          ...nearbyShops.filter(s => !usedShopIds.has(s.id)) // Also check nearby
        ]
          .filter((shop) => {
            // Filter shops with HERO plan or highest priority, and not already used
            return (shop.planType === 'HERO' || (shop.priorityRank || 0) >= 200) && 
                   shop.latitude && shop.longitude && 
                   !usedShopIds.has(shop.id);
          })
          .sort((a, b) => {
            // Sort by priority rank first, then distance
            const priorityA = a.priorityRank || 0;
            const priorityB = b.priorityRank || 0;
            if (priorityB !== priorityA) {
              return priorityB - priorityA;
            }
            return (a.distance || 999999) - (b.distance || 999999);
          })[0] || allShops
          .filter((shop) => {
            return shop.latitude && shop.longitude && !usedShopIds.has(shop.id);
          })
          .sort((a, b) => (b.priorityRank || 0) - (a.priorityRank || 0))[0];
        
        // Mark hero shop as used
        if (heroShop) {
          usedShopIds.add(heroShop.id);
        }

        // Filter shops and sort by distance (nearest first)
        // Left bar: Show all nearby shops (prioritize by distance, then by priority rank)
        // Exclude hero shop and ensure no duplicates
        const leftBarShops = [
          ...nearbyShops.filter(s => !usedShopIds.has(s.id)), // Exclude already used shops
          // Add Patna area shops if not enough shops
          ...patnaAreaShops.filter((shop: any) => !nearbyShops.find(s => s.id === shop.id) && !usedShopIds.has(shop.id))
        ]
          .filter((shop) => {
            // Include all shops - with or without coordinates, within 0-1000 km range
            const shopDistance = shop.distance || 0;
            return shop && shop.id && (shop.name || shop.shopName) && shopDistance <= 1000;
          })
          .sort((a, b) => {
            // Sort by priority rank first (higher = first), then by distance (nearest first)
            const priorityA = a.priorityRank || 0;
            const priorityB = b.priorityRank || 0;
            if (priorityB !== priorityA) {
              return priorityB - priorityA;
            }
            const distanceA = a.distance || 999999;
            const distanceB = b.distance || 999999;
            return distanceA - distanceB;
          })
          .slice(0, 3)
          .map((shop) => {
            usedShopIds.add(shop.id); // Mark as used
            return {
              bannerId: shop.id,
              imageUrl: shop.imageUrl || shop.photoUrl || '/placeholder-shop.jpg',
              alt: shop.name || shop.shopName || 'Shop',
              link: shop.website || shop.shopUrl || `/shop/${shop.id}` || `/contact/${shop.id}`,
              advertiser: shop.name || shop.shopName || 'Shop',
              lat: shop.latitude || 0,
              lng: shop.longitude || 0,
              distance: shop.distance || 0,
              isBusiness: true,
              website: shop.website || undefined,
              area: shop.area || '',
              city: shop.city || '',
            };
          });
        
        // If not enough shops, fetch more to fill slots
        if (leftBarShops.length < 3) {
          const additionalShops = [
            ...nearbyShops.filter(s => !usedShopIds.has(s.id)),
            ...patnaAreaShops.filter((shop: any) => !usedShopIds.has(shop.id))
          ]
            .filter((shop) => {
              const shopDistance = shop.distance || 0;
              return shop && shop.id && (shop.name || shop.shopName) && shopDistance <= 1000;
            })
            .slice(0, 3 - leftBarShops.length)
            .map((shop) => {
              usedShopIds.add(shop.id);
              return {
                bannerId: shop.id,
                imageUrl: shop.imageUrl || shop.photoUrl || '/placeholder-shop.jpg',
                alt: shop.name || shop.shopName || 'Shop',
                link: shop.website || shop.shopUrl || `/shop/${shop.id}` || `/contact/${shop.id}`,
                advertiser: shop.name || shop.shopName || 'Shop',
                lat: shop.latitude || 0,
                lng: shop.longitude || 0,
                distance: shop.distance || 0,
                isBusiness: true,
                website: shop.website || undefined,
                area: shop.area || '',
                city: shop.city || '',
              };
            });
          leftBarShops.push(...additionalShops);
        }
        
        console.log(`🏪 Left bar shops prepared: ${leftBarShops.length} shops`, leftBarShops);

        // Right bar: Show all nearby shops (exclude already used shops)
        const rightBarShops = [
          ...nearbyShops.filter(s => !usedShopIds.has(s.id)), // Exclude already used shops
          // Add Patna area shops if not enough shops
          ...patnaAreaShops.slice(4).filter((shop: any) => !nearbyShops.find(s => s.id === shop.id) && !usedShopIds.has(shop.id))
        ]
          .filter((shop) => {
            // Include all shops - with or without coordinates, within 0-1000 km range
            const shopDistance = shop.distance || 0;
            return shop && shop.id && (shop.name || shop.shopName) && shopDistance <= 1000;
          })
          .sort((a, b) => {
            // Sort by priority rank first (higher = first), then by distance (nearest first)
            const priorityA = a.priorityRank || 0;
            const priorityB = b.priorityRank || 0;
            if (priorityB !== priorityA) {
              return priorityB - priorityA;
            }
            const distanceA = a.distance || 999999;
            const distanceB = b.distance || 999999;
            return distanceA - distanceB;
          })
          .slice(0, 3) // Get first 3 unused shops
          .map((shop) => {
            usedShopIds.add(shop.id); // Mark as used
            return {
              bannerId: shop.id,
              imageUrl: shop.imageUrl || shop.photoUrl || '/placeholder-shop.jpg',
              alt: shop.name || shop.shopName || 'Shop',
              link: shop.website || shop.shopUrl || `/shop/${shop.id}` || `/contact/${shop.id}`,
              advertiser: shop.name || shop.shopName || 'Shop',
              lat: shop.latitude || 0,
              lng: shop.longitude || 0,
              distance: shop.distance || 0,
              isBusiness: true,
              website: shop.website || undefined,
              area: shop.area || '',
              city: shop.city || '',
            };
          });
        
        // If not enough shops, fetch more to fill slots
        if (rightBarShops.length < 3) {
          const additionalShops = [
            ...nearbyShops.filter(s => !usedShopIds.has(s.id)),
            ...patnaAreaShops.filter((shop: any) => !usedShopIds.has(shop.id))
          ]
            .filter((shop) => {
              const shopDistance = shop.distance || 0;
              return shop && shop.id && (shop.name || shop.shopName) && shopDistance <= 1000;
            })
            .slice(0, 3 - rightBarShops.length)
            .map((shop) => {
              usedShopIds.add(shop.id);
              return {
                bannerId: shop.id,
                imageUrl: shop.imageUrl || shop.photoUrl || '/placeholder-shop.jpg',
                alt: shop.name || shop.shopName || 'Shop',
                link: shop.website || shop.shopUrl || `/shop/${shop.id}` || `/contact/${shop.id}`,
                advertiser: shop.name || shop.shopName || 'Shop',
                lat: shop.latitude || 0,
                lng: shop.longitude || 0,
                distance: shop.distance || 0,
                isBusiness: true,
                website: shop.website || undefined,
                area: shop.area || '',
                city: shop.city || '',
              };
            });
          rightBarShops.push(...additionalShops);
        }
        
        console.log(`🏪 Right bar shops prepared: ${rightBarShops.length} shops`);
        
        // Bottom strip: show ALL shops from all locations (exclude already used shops, fill all 20 slots)
        const bottomShops = [
          ...allShops.filter(s => !usedShopIds.has(s.id)), // Exclude already used shops
          ...patnaAreaShops.filter((shop: any) => !usedShopIds.has(shop.id)) // Add more if needed
        ]
          .filter((shop) => {
            // Include all shops from all locations
            return shop && shop.id && (shop.name || shop.shopName);
          })
          .sort((a, b) => {
            // Sort by priority rank first (higher = first), then by distance (nearest first)
            const priorityA = a.priorityRank || 0;
            const priorityB = b.priorityRank || 0;
            if (priorityB !== priorityA) {
              return priorityB - priorityA;
            }
            const distanceA = a.distance || 999999;
            const distanceB = b.distance || 999999;
            return distanceA - distanceB;
          })
          .slice(0, 20) // Fill all 20 slots
          .map((shop) => {
            usedShopIds.add(shop.id); // Mark as used
            return {
              bannerId: shop.id,
              imageUrl: shop.imageUrl || shop.photoUrl || '/placeholder-shop.jpg',
              alt: shop.name || shop.shopName || 'Shop',
              link: shop.website || shop.shopUrl || `/shop/${shop.id}` || `/contact/${shop.id}`,
              advertiser: shop.name || shop.shopName || 'Shop',
              lat: shop.latitude || 0,
              lng: shop.longitude || 0,
              distance: shop.distance || 0,
              isBusiness: true,
              website: shop.website || undefined,
              area: shop.area || '',
              city: shop.city || '',
            };
          });
        
        // If not enough shops, fetch more to fill all 20 slots
        if (bottomShops.length < 20) {
          const additionalShops = [
            ...allShops.filter(s => !usedShopIds.has(s.id)),
            ...patnaAreaShops.filter((shop: any) => !usedShopIds.has(shop.id))
          ]
            .filter((shop) => {
              return shop && shop.id && (shop.name || shop.shopName);
            })
            .slice(0, 20 - bottomShops.length)
            .map((shop) => {
              usedShopIds.add(shop.id);
              return {
                bannerId: shop.id,
                imageUrl: shop.imageUrl || shop.photoUrl || '/placeholder-shop.jpg',
                alt: shop.name || shop.shopName || 'Shop',
                link: shop.website || shop.shopUrl || `/shop/${shop.id}` || `/contact/${shop.id}`,
                advertiser: shop.name || shop.shopName || 'Shop',
                lat: shop.latitude || 0,
                lng: shop.longitude || 0,
                distance: shop.distance || 0,
                isBusiness: true,
                website: shop.website || undefined,
                area: shop.area || '',
                city: shop.city || '',
              };
            });
          bottomShops.push(...additionalShops);
        }
        
        console.log(`🏪 Bottom strip shops prepared: ${bottomShops.length} shops (from all locations)`);

        // Combine banner data with nearby shops
        // Left bar: nearby shops (prioritized) - no banners, only shops
        const combinedLeft = leftBarShops.slice(0, 3);
        
        console.log(`✅ Combined left shops: ${combinedLeft.length}`, combinedLeft.map(s => s.advertiser));

        // Right bar: nearby shops (prioritized) - no banners, only shops
        const combinedRight = rightBarShops.slice(0, 3);
        
        console.log(`✅ Combined right shops: ${combinedRight.length}`, combinedRight.map(s => s.advertiser));

        // Bottom strip: nearby shops (prioritized) - no banners, only shops
        const combinedBottom = bottomShops.slice(0, 20);
        
        console.log(`✅ Combined bottom shops: ${combinedBottom.length}`, combinedBottom.map(s => s.advertiser));

        setData({
          hero: heroShop
            ? {
                bannerId: heroShop.id,
                imageUrl: heroShop.imageUrl || '/placeholder-shop.jpg',
                alt: heroShop.name || 'Shop',
                link: heroShop.website || `/shop/${heroShop.id}` || `/contact/${heroShop.id}`,
                title: heroShop.name,
                ctaText: 'View Shop',
                advertiser: heroShop.name,
                distance: heroShop.distance || 0,
                isBusiness: true,
                lat: heroShop.latitude,
                lng: heroShop.longitude,
                area: heroShop.area || '',
                city: heroShop.city || '',
              } as any
            : heroData?.banners?.[0]
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
  }, [location.id, location.latitude, location.longitude, category, isSearchActive, searchParams]);

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
            height="h-[391px]"
            userLat={location.latitude}
            userLng={location.longitude}
          />

          {/* CENTER COLUMN (60%) - Hero */}
          <div className="flex items-center justify-center">
            <HeroBanner hero={data.hero} onBannerClick={handleBannerClick} height="h-[391px]" />
          </div>

          {/* RIGHT COLUMN (20%) */}
          <RightRail 
            banners={data.right} 
            onBannerClick={handleBannerClick} 
            height="h-[391px]"
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
            height="h-[293px]"
            userLat={location.latitude}
            userLng={location.longitude}
          />

          {/* CENTER COLUMN */}
          <div className="flex items-center justify-center">
            <HeroBanner hero={data.hero} onBannerClick={handleBannerClick} height="h-[293px]" />
          </div>

          {/* RIGHT COLUMN */}
          <RightRail 
            banners={data.right} 
            onBannerClick={handleBannerClick} 
            height="h-[293px]"
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
            height="h-[176px] sm:h-[240px]"
            userLat={location.latitude}
            userLng={location.longitude}
          />

          {/* CENTER COLUMN - Hero */}
          <div className="flex items-center justify-center">
            <HeroBanner hero={data.hero} onBannerClick={handleBannerClick} height="h-[176px] sm:h-[240px]" />
          </div>

          {/* RIGHT COLUMN */}
          <RightRail 
            banners={data.right} 
            onBannerClick={handleBannerClick} 
            height="h-[176px] sm:h-[240px]"
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
