'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { useSearch } from '../contexts/SearchContext';
import type { HeroSectionData } from '../types';
import { safeJsonParse } from '../utils/fetchHelpers';
import LeftRail from './hero/LeftRail';
import RightSide from './hero/RightSide';
import HeroBanner from './hero/HeroBanner';
import BottomRail from './hero/BottomRail';
import BottomStrip from './hero/BottomStrip';
import MobileRails from './hero/MobileRails';
import BestDealsSlider from './hero/BestDealsSlider';
import SearchPanel from './hero/SearchPanel';
import ShopFullPageModal from './ShopFullPageModal';

interface HeroSectionProps {
  category?: string;
}

export default function HeroSection({ category }: HeroSectionProps) {
  const { location } = useLocation();
  const { searchParams, isSearchActive } = useSearch();
  const [data, setData] = useState<HeroSectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [heroSettings, setHeroSettings] = useState<any>(null);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch hero section settings
  useEffect(() => {
    const fetchHeroSettings = async () => {
      try {
        const res = await fetch('/api/hero-section');
        const data = await res.json();
        if (data.success) {
          setHeroSettings(data.settings);
        }
      } catch (error) {
        console.error('Error fetching hero settings:', error);
      }
    };
    fetchHeroSettings();
  }, []);

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
          if (searchParams.planType) searchParamsObj.append('planType', searchParams.planType);
          if (location.latitude) searchParamsObj.append('userLat', location.latitude.toString());
          if (location.longitude) searchParamsObj.append('userLng', location.longitude.toString());

          const searchUrl = `/api/search?${searchParamsObj.toString()}&_t=${Date.now()}`;
          console.log(`🔍 Fetching search results from: ${searchUrl}`);
          
          const searchRes = await fetch(searchUrl, {
            cache: 'no-store', // Disable browser caching for fresh visitor counts
          });
          const searchData = await safeJsonParse<{
            success: boolean;
            mainResults: any[];
            leftRail: any[];
            rightRail: any[];
            bottomStrip: any[];
            totalFound?: number;
            filters?: any;
          }>(searchRes);

          if (searchData?.success) {
            console.log(`🔍 Search Results Received:`, {
              success: searchData.success,
              mainResults: searchData.mainResults?.length || 0,
              leftRail: searchData.leftRail?.length || 0,
              rightRail: searchData.rightRail?.length || 0,
              bottomStrip: searchData.bottomStrip?.length || 0,
              totalFound: searchData.totalFound || 0,
              pincode: searchParams.pincode,
              filters: searchData.filters,
            });
            
            // Log if no shops found
            const totalShops = (searchData.mainResults?.length || 0) + 
                              (searchData.leftRail?.length || 0) + 
                              (searchData.rightRail?.length || 0) + 
                              (searchData.bottomStrip?.length || 0);
            if (totalShops === 0) {
              console.warn(`⚠️ No shops found for pincode: ${searchParams.pincode}`);
            }
            
            // Track used shop IDs to prevent duplicates
            const usedShopIds = new Set<string>();

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
              visitorCount: shop.visitorCount || 0,
            });

            // Transform hero shop - ONLY if planType is 'HERO'
            const heroShopFromSearch = searchData.mainResults.find((shop: any) => shop.planType === 'HERO');
            const heroBanner = heroShopFromSearch ? {
              bannerId: heroShopFromSearch.id,
              imageUrl: heroShopFromSearch.imageUrl || heroShopFromSearch.photoUrl || '/placeholder-shop.jpg',
              alt: heroShopFromSearch.name || heroShopFromSearch.shopName || 'Shop',
              link: heroShopFromSearch.shopUrl ? `/shop/${heroShopFromSearch.shopUrl}` : `/contact/${heroShopFromSearch.id}`,
              title: heroShopFromSearch.name || heroShopFromSearch.shopName || 'Shop',
              ctaText: 'View Shop',
              advertiser: heroShopFromSearch.name || heroShopFromSearch.shopName || 'Shop',
              distance: heroShopFromSearch.distance || 0,
              visitorCount: heroShopFromSearch.visitorCount || 0,
            } : undefined;

            // Don't mark hero shop as used - it will also appear in bottom strip
            // Hero shops appear in both Hero section AND Bottom Strip

            // Transform left rail - only LEFT_BAR plan shops
            const leftBanners = searchData.leftRail
              .filter((shop: any) => shop?.id && shop.planType === 'LEFT_BAR' && !usedShopIds.has(shop.id))
              .slice(0, 3)
              .map((shop: any) => {
                usedShopIds.add(shop.id); // Mark as used
                return transformShopToBanner(shop);
              });

            // Transform right rail - only RIGHT_SIDE plan shops
            const rightBanners = searchData.rightRail
              .filter((shop: any) => shop?.id && shop.planType === 'RIGHT_SIDE' && !usedShopIds.has(shop.id))
              .slice(0, 3)
              .map((shop: any) => {
                usedShopIds.add(shop.id); // Mark as used
                return transformShopToBanner(shop);
              });

            // Transform bottom strip - Show ALL plan types (BOTTOM_RAIL, BASIC, PREMIUM, FEATURED, BANNER, HERO)
            // HERO shops appear in both hero section AND bottom strip
            const bottomBanners = searchData.bottomStrip
              .filter((shop: any) => {
                // Show all shops except LEFT_BAR and RIGHT_SIDE (they have their own rails)
                const isLeftOrRight = shop?.planType === 'LEFT_BAR' || shop?.planType === 'RIGHT_SIDE';
                return shop?.id && !isLeftOrRight && !usedShopIds.has(shop.id);
              })
              .sort((a: any, b: any) => {
                // Sort by plan priority: HERO > BOTTOM_RAIL > PREMIUM > FEATURED > BANNER > BASIC
                const planPriority: Record<string, number> = {
                  'HERO': 6,
                  'BOTTOM_RAIL': 5,
                  'PREMIUM': 4,
                  'FEATURED': 3,
                  'BANNER': 2,
                  'BASIC': 1,
                };
                const priorityA = planPriority[a.planType] || 0;
                const priorityB = planPriority[b.planType] || 0;
                if (priorityB !== priorityA) {
                  return priorityB - priorityA;
                }
                // If same plan priority, sort by visitorCount (popularity)
                return (b.visitorCount || 0) - (a.visitorCount || 0);
              })
              .slice(0, 30) // Show 30 shops in bottom strip
              .map((shop: any) => {
                // Don't mark HERO shops as used (they're already in hero section)
                if (shop.planType !== 'HERO') {
                  usedShopIds.add(shop.id);
                }
                return transformShopToBanner(shop);
              });

            setData({
              hero: heroBanner || undefined,
              left: leftBanners,
              right: rightBanners,
              bottom: bottomBanners,
            });
            setIsLoading(false);
            return;
          } else {
            // Search API returned but success is false or no data
            console.warn('⚠️ Search API returned but no success or empty results:', searchData);
            setData({
              hero: undefined,
              left: [],
              right: [],
              bottom: [],
            });
            setIsLoading(false);
            return;
          }
        }

        // Normal flow - Fetch banners and nearby shops
        // Build query params safely
        const bannerParams = new URLSearchParams();
        if (location.id) bannerParams.append('loc', location.id);
        if (location.area) bannerParams.append('area', location.area);
        if (location.pincode) bannerParams.append('pincode', location.pincode.toString());
        if (category) bannerParams.append('cat', category);
        
        const bannerPromises = [
          fetch(`/api/banners?section=hero&${bannerParams.toString()}&limit=1`),
          fetch(`/api/banners?section=left&${bannerParams.toString()}&limit=4`),
          fetch(`/api/banners?section=right&${bannerParams.toString()}&limit=4`),
          fetch(`/api/banners?section=top&${bannerParams.toString()}&limit=20`),
        ];

        // Fetch nearby shops - always try to fetch, with or without location
        // Use 1000 km radius to show shops from 0-1000 km range
        // Priority: searchParams > location
        const pincodeFilter = searchParams.pincode || location.pincode;
        const categoryFilter = searchParams.category || category;
        
        let nearbyShopsPromise: Promise<Response> | null = null;
        if (location.latitude && location.longitude) {
          // Fetch with coordinates
          let url = `/api/shops/nearby?userLat=${location.latitude}&userLng=${location.longitude}&radiusKm=1000&useMongoDB=true`;
          if (location.city) url += `&city=${encodeURIComponent(location.city)}`;
          if (location.area) url += `&area=${encodeURIComponent(location.area)}`;
          if (pincodeFilter) url += `&pincode=${pincodeFilter}`;
          if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
          nearbyShopsPromise = fetch(`${url}&_t=${Date.now()}`, { cache: 'no-store' });
        } else if (location.city || location.area || pincodeFilter) {
          // Fetch with location filters (city/area/pincode)
          const cityFilter = location.city || 'Patna';
          let url = `/api/shops/nearby?city=${encodeURIComponent(cityFilter)}&radiusKm=1000&useMongoDB=true`;
          if (location.area) url += `&area=${encodeURIComponent(location.area)}`;
          if (pincodeFilter) url += `&pincode=${pincodeFilter}`;
          if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
          nearbyShopsPromise = fetch(`${url}&_t=${Date.now()}`, { cache: 'no-store' });
        } else {
          // No location at all - fetch all shops (will be limited to 100 by API)
          let url = `/api/shops/nearby?radiusKm=1000&useMongoDB=true&limit=50`;
          if (pincodeFilter) url += `&pincode=${pincodeFilter}`;
          if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
          nearbyShopsPromise = fetch(`${url}&_t=${Date.now()}`, { cache: 'no-store' });
        }

        // Use Promise.allSettled to handle individual fetch failures gracefully
        const bannerResults = await Promise.allSettled([
          ...bannerPromises,
          nearbyShopsPromise || Promise.resolve(new Response(JSON.stringify({ shops: [] }), { headers: { 'Content-Type': 'application/json' } })),
        ]);

        // Extract responses, handling failures
        const [heroRes, leftRes, rightRes, bottomRes, nearbyShopsRes] = bannerResults.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.error(`Failed to fetch banner data at index ${index}:`, result.reason);
            // Return empty response on failure
            return new Response(JSON.stringify({ banners: [] }), { headers: { 'Content-Type': 'application/json' } });
          }
        });

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
            let url = `/api/shops/nearby?city=${encodeURIComponent(cityFilter)}&radiusKm=1000&useMongoDB=true&limit=50`;
            if (pincodeFilter) url += `&pincode=${pincodeFilter}`;
            if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
            url += `&_t=${Date.now()}`; // Cache-busting
            const allShopsRes = await fetch(url, {
              cache: 'no-store', // Disable browser caching
            }).catch(() => null);
            if (allShopsRes) {
              const parsed = await safeJsonParse(allShopsRes);
              if (parsed?.shops && parsed.shops.length > 0) {
                nearbyShopsData = parsed;
                console.log(`📍 Fetched ${parsed.shops.length} shops from database (city: ${cityFilter}) for left/right rails`);
              }
            }
          }
          
          // 2. Fetch ALL shops for homepage (all locations, but apply filters if search params exist)
          // IMPORTANT: Homepage पर सिर्फ AgentShop से shops fetch करें (Shop.ts से नहीं)
          // Only fetch all shops if no search filters are active (page load)
          if (!isSearchActive) {
            console.log('🌍 Page Load: Fetching ALL shops from AgentShop only for homepage...');
            let allLocationsUrl = '/api/shops/nearby?radiusKm=1000&useMongoDB=true'; // No limit - fetch ALL shops from AgentShop
            if (location.latitude && location.longitude) {
              allLocationsUrl += `&userLat=${location.latitude}&userLng=${location.longitude}`;
            }
            // Add cache-busting timestamp to ensure fresh data
            allLocationsUrl += `&_t=${Date.now()}`;
            // Don't apply filters on page load - show all shops from AgentShop
            const allLocationsRes = await fetch(allLocationsUrl, {
              cache: 'no-store', // Disable browser caching
            }).catch(() => null);
            if (allLocationsRes) {
              const parsed = await safeJsonParse(allLocationsRes);
              if (parsed?.shops && parsed.shops.length > 0) {
                allShopsData = parsed;
                console.log(`🌍 Page Load: Fetched ${parsed.shops.length} unique shops from AgentShop (ALL shops, duplicates removed) for homepage`);
              }
            }
          }
          
          // If still no shops, try fetching by plan types
          if (!nearbyShopsData?.shops || nearbyShopsData.shops.length === 0) {
            console.log('📍 Trying to fetch shops by plan types for left/right rails...');
            const timestamp = Date.now();
            const leftBarUrl = `/api/shops/by-plan?planType=LEFT_BAR&limit=10${pincodeFilter ? `&pincode=${pincodeFilter}` : ''}${categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ''}&_t=${timestamp}`;
            const rightBarUrl = `/api/shops/by-plan?planType=RIGHT_SIDE&limit=10${pincodeFilter ? `&pincode=${pincodeFilter}` : ''}${categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ''}&_t=${timestamp}`;
            const heroUrl = `/api/shops/by-plan?planType=HERO&limit=10${pincodeFilter ? `&pincode=${pincodeFilter}` : ''}${categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ''}&_t=${timestamp}`;
            const [leftBarRes, rightBarRes, heroRes] = await Promise.all([
              fetch(leftBarUrl, { cache: 'no-store' }).catch(() => null),
              fetch(rightBarUrl, { cache: 'no-store' }).catch(() => null),
              fetch(heroUrl, { cache: 'no-store' }).catch(() => null),
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
            const areaPromises = patnaAreas.map(area => {
              let url = `/api/shops/nearby?city=Patna&area=${encodeURIComponent(area)}&radiusKm=1000&useMongoDB=true&limit=5`;
              if (pincodeFilter) url += `&pincode=${pincodeFilter}`;
              if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
              return fetch(`${url}&_t=${Date.now()}`, { cache: 'no-store' });
            });
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
          visitorCount?: number;
        }>;
        
        console.log(`🌍 Total shops from all locations: ${allShops.length}`);
        
        // Step 1: Deduplicate all shops by shopName + ownerName + mobile (combine all sources and remove duplicates)
        // IMPORTANT: सिर्फ AgentShop से shops आ रहे हैं, duplicate prevention के लिए shopName + ownerName + mobile use करें
        const allUniqueShops = new Map<string, any>();
        
        // Add shops from all sources, keeping unique shops based on shopName + ownerName + mobile
        [...allShops, ...nearbyShops, ...patnaAreaShops].forEach((shop: any) => {
          if (shop && shop.id) {
            // Create unique key from shopName + ownerName + mobile
            const uniqueKey = `${(shop.name || shop.shopName || '').toLowerCase().trim()}_${(shop.ownerName || '').toLowerCase().trim()}_${(shop.phone || shop.mobile || '').trim()}`;
            
            // अगर पहले से नहीं है, तो add करें
            // अगर है, तो latest (higher visitorCount) को keep करें
            if (!allUniqueShops.has(uniqueKey)) {
              allUniqueShops.set(uniqueKey, shop);
            } else {
              const existingShop = allUniqueShops.get(uniqueKey);
              // Keep the one with higher visitorCount (more popular)
              if (shop.visitorCount > (existingShop.visitorCount || 0)) {
                allUniqueShops.set(uniqueKey, shop);
              }
            }
          }
        });
        
        let uniqueShopsArray = Array.from(allUniqueShops.values());
        const totalBeforeDedup = allShops.length + nearbyShops.length + patnaAreaShops.length;
        console.log(`✅ Deduplicated shops: ${uniqueShopsArray.length} unique shops from ${totalBeforeDedup} total (removed ${totalBeforeDedup - uniqueShopsArray.length} duplicates)`);
        
        // Apply filters from search params (pincode and category)
        // Filter by pincode if selected
        if (searchParams.pincode) {
          const beforeFilter = uniqueShopsArray.length;
          const pincodeFilter = searchParams.pincode.trim();
          uniqueShopsArray = uniqueShopsArray.filter((shop: any) => {
            const shopPincode = shop.pincode?.toString().trim() || '';
            return shopPincode === pincodeFilter;
          });
          console.log(`📍 Filtered by pincode ${pincodeFilter}: ${beforeFilter} → ${uniqueShopsArray.length} shops`);
        }
        
        // Filter by category if selected (case-insensitive matching)
        if (searchParams.category) {
          const beforeFilter = uniqueShopsArray.length;
          const categoryFilter = searchParams.category.trim().toLowerCase();
          uniqueShopsArray = uniqueShopsArray.filter((shop: any) => {
            const shopCategory = (shop.category || '').toString().trim().toLowerCase();
            return shopCategory === categoryFilter;
          });
          console.log(`🏷️ Filtered by category "${searchParams.category}": ${beforeFilter} → ${uniqueShopsArray.length} shops`);
          if (uniqueShopsArray.length === 0 && beforeFilter > 0) {
            console.warn(`⚠️ No shops found for category "${searchParams.category}". Sample categories in data:`, 
              Array.from(new Set([...allShops, ...nearbyShops, ...patnaAreaShops]
                .map((s: any) => s.category)
                .filter(Boolean)
                .slice(0, 10)
              ))
            );
          }
        }
        
        // Step 2: Hero - Get ALL HERO plan shops for rotation (prioritize HERO plan, then by popularity/distance)
        const heroShopCandidates = uniqueShopsArray
          .filter((shop) => {
            return shop && shop.id && (shop.name || shop.shopName) &&
                   shop.latitude && shop.longitude;
          })
          .sort((a, b) => {
            // First, prioritize HERO plan shops
            const isHeroA = a.planType === 'HERO';
            const isHeroB = b.planType === 'HERO';
            if (isHeroA && !isHeroB) return -1;
            if (!isHeroA && isHeroB) return 1;
            
            // Then sort by popularityScore (visitorCount) first, then priority rank, then distance
            const popularityA = a.visitorCount || 0;
            const popularityB = b.visitorCount || 0;
            if (popularityB !== popularityA) {
              return popularityB - popularityA;
            }
            const priorityA = a.priorityRank || 0;
            const priorityB = b.priorityRank || 0;
            if (priorityB !== priorityA) {
              return priorityB - priorityA;
            }
            return (a.distance || 999999) - (b.distance || 999999);
          });
        
        // Get multiple HERO plan shops (up to 10) for rotation
        const heroShops = heroShopCandidates
          .filter((shop) => shop.planType === 'HERO')
          .slice(0, 10)
          .map((shop) => ({
            bannerId: shop.id,
            imageUrl: shop.imageUrl || shop.photoUrl || '/placeholder-shop.jpg',
            alt: shop.name || shop.shopName || 'Shop',
            link: shop.website || shop.shopUrl || `/shop/${shop.id}` || `/contact/${shop.id}`,
            title: shop.name || shop.shopName || 'Shop',
            ctaText: 'View Shop',
            advertiser: shop.name || shop.shopName || 'Shop',
            distance: shop.distance || 0,
            isBusiness: true,
            lat: shop.latitude,
            lng: shop.longitude,
            area: shop.area || '',
            city: shop.city || '',
            visitorCount: shop.visitorCount || 0,
          }));
        
        // Fallback: if no HERO shops, use first shop (for backward compatibility)
        const heroShop = heroShopCandidates[0];
        
        // Log hero shops for rotation
        if (heroShops.length > 0) {
          console.log(`🎯 Hero shops for rotation: ${heroShops.length} shops`);
          heroShops.forEach((s, idx) => console.log(`  ${idx + 1}. ${s.title} (ID: ${s.bannerId}, Visitors: ${s.visitorCount || 0})`));
        } else if (heroShop) {
          console.log(`🎯 Hero shop selected: ${heroShop.name || heroShop.shopName} (ID: ${heroShop.id}, Visitors: ${heroShop.visitorCount || 0})`);
        }
        
        // Step 3: Left Rail - Get shops with planType 'LEFT_BAR' first, but if filters are active and no LEFT_BAR shops found, show any shops
        const leftBarShopsFiltered = uniqueShopsArray.filter((shop) => {
          return shop && shop.id && (shop.name || shop.shopName) &&
                 shop.latitude && shop.longitude;
        });
        
        // Prioritize LEFT_BAR plan shops, but if filters are active and no LEFT_BAR shops, show any shops
        const leftBarShops = leftBarShopsFiltered
          .sort((a, b) => {
            // First, prioritize LEFT_BAR plan shops
            const isLeftBarA = a.planType === 'LEFT_BAR';
            const isLeftBarB = b.planType === 'LEFT_BAR';
            if (isLeftBarA && !isLeftBarB) return -1;
            if (!isLeftBarA && isLeftBarB) return 1;
            
            // Then sort by priority rank (higher = first), then by distance (nearest first)
            const priorityA = a.priorityRank || 0;
            const priorityB = b.priorityRank || 0;
            if (priorityB !== priorityA) {
              return priorityB - priorityA;
            }
            const distanceA = a.distance || 999999;
            const distanceB = b.distance || 999999;
            return distanceA - distanceB;
          })
          .slice(0, 3) // Get exactly 3 shops
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
              visitorCount: shop.visitorCount || 0,
            };
          });
        
        console.log(`🏪 Left rail shops (LEFT_BAR plan): ${leftBarShops.length} shops`);
        leftBarShops.forEach((s, idx) => console.log(`  ${idx + 1}. ${s.advertiser} (ID: ${s.bannerId})`));

        // Step 4: Right Side - Get shops with planType 'RIGHT_SIDE' first, but if filters are active and no RIGHT_SIDE shops found, show any shops
        const rightBarShopsFiltered = uniqueShopsArray.filter((shop) => {
          return shop && shop.id && (shop.name || shop.shopName) &&
                 shop.latitude && shop.longitude &&
                 !usedShopIds.has(shop.id); // Exclude already used shops
        });
        
        // Prioritize RIGHT_SIDE plan shops, but if filters are active and no RIGHT_SIDE shops, show any shops
        const rightBarShops = rightBarShopsFiltered
          .sort((a, b) => {
            // First, prioritize RIGHT_SIDE plan shops
            const isRightSideA = a.planType === 'RIGHT_SIDE';
            const isRightSideB = b.planType === 'RIGHT_SIDE';
            if (isRightSideA && !isRightSideB) return -1;
            if (!isRightSideA && isRightSideB) return 1;
            
            // Then sort by priority rank (higher = first), then by distance (nearest first)
            const priorityA = a.priorityRank || 0;
            const priorityB = b.priorityRank || 0;
            if (priorityB !== priorityA) {
              return priorityB - priorityA;
            }
            const distanceA = a.distance || 999999;
            const distanceB = b.distance || 999999;
            return distanceA - distanceB;
          })
          .slice(0, 3) // Get exactly 3 shops
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
              visitorCount: shop.visitorCount || 0,
            };
          });
        
        console.log(`🏪 Right side shops (RIGHT_SIDE plan): ${rightBarShops.length} shops`);
        rightBarShops.forEach((s, idx) => console.log(`  ${idx + 1}. ${s.advertiser} (ID: ${s.bannerId})`));
        
        // Step 5: Bottom Strip - Prioritize BASIC and HERO plan shops, but if filters are active and none found, show any shops (except LEFT_BAR and RIGHT_SIDE)
        // Hero shops appear in both Hero section AND Bottom Strip
        // But exclude LEFT_BAR and RIGHT_SIDE shops from bottom (they only appear in their respective rails)
        const bottomShopsFiltered = uniqueShopsArray.filter((shop) => {
          // Exclude LEFT_BAR and RIGHT_SIDE from bottom strip (they only appear in their respective rails)
          const isLeftOrRight = shop.planType === 'LEFT_BAR' || shop.planType === 'RIGHT_SIDE';
          return !isLeftOrRight &&
                 shop && shop.id && (shop.name || shop.shopName);
        });
        
        console.log(`🔍 Bottom strip filtering: isSearchActive=${isSearchActive}, filteredShops=${bottomShopsFiltered.length}`);
        
        const bottomShops = bottomShopsFiltered
          .filter((shop) => {
            // On page load (no filters), show ALL shops from Shop.ts
            // If filters are active, show any shop (already filtered by category/pincode)
            return true; // Show all shops - no plan type filtering
          })
          .sort((a, b) => {
            // For HERO plan shops, sort by popularityScore (visitorCount) first
            // For BASIC plan shops, sort by priority rank, then distance
            const isHeroA = a.planType === 'HERO';
            const isHeroB = b.planType === 'HERO';
            
            if (isHeroA && isHeroB) {
              // Both HERO: sort by popularityScore (visitorCount) first
              const popularityA = a.visitorCount || 0;
              const popularityB = b.visitorCount || 0;
              if (popularityB !== popularityA) {
                return popularityB - popularityA;
              }
            } else if (isHeroA && !isHeroB) {
              // HERO shops come first
              return -1;
            } else if (!isHeroA && isHeroB) {
              // HERO shops come first
              return 1;
            }
            
            // For BASIC plans or same type, sort by priority rank, then distance
            const priorityA = a.priorityRank || 0;
            const priorityB = b.priorityRank || 0;
            if (priorityB !== priorityA) {
              return priorityB - priorityA;
            }
            const distanceA = a.distance || 999999;
            const distanceB = b.distance || 999999;
            return distanceA - distanceB;
          })
          .slice(0, 30) // Get exactly 30 shops from AgentShop
          .map((shop) => {
            // Don't mark as used if it's a HERO shop (it's already in hero section)
            if (shop.planType !== 'HERO') {
              usedShopIds.add(shop.id);
            }
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
              visitorCount: shop.visitorCount || 0,
            };
          });
        
        console.log(`🏪 Bottom strip shops (BASIC & HERO, excluding LEFT_BAR & RIGHT_SIDE): ${bottomShops.length} shops`);
        
        // Verify no duplicates across all sections
        const allDisplayedIds = new Set<string>();
        const duplicateCheck = new Map<string, string[]>();
        
        if (heroShop) {
          allDisplayedIds.add(heroShop.id);
          duplicateCheck.set(heroShop.id, ['Hero']);
        }
        
        leftBarShops.forEach((s, idx) => {
          if (allDisplayedIds.has(s.bannerId)) {
            const sections = duplicateCheck.get(s.bannerId) || [];
            sections.push(`Left-${idx + 1}`);
            duplicateCheck.set(s.bannerId, sections);
          } else {
            allDisplayedIds.add(s.bannerId);
            duplicateCheck.set(s.bannerId, [`Left-${idx + 1}`]);
          }
        });
        
        rightBarShops.forEach((s, idx) => {
          if (allDisplayedIds.has(s.bannerId)) {
            const sections = duplicateCheck.get(s.bannerId) || [];
            sections.push(`Right-${idx + 1}`);
            duplicateCheck.set(s.bannerId, sections);
          } else {
            allDisplayedIds.add(s.bannerId);
            duplicateCheck.set(s.bannerId, [`Right-${idx + 1}`]);
          }
        });
        
        bottomShops.forEach((s, idx) => {
          if (allDisplayedIds.has(s.bannerId)) {
            const sections = duplicateCheck.get(s.bannerId) || [];
            sections.push(`Bottom-${idx + 1}`);
            duplicateCheck.set(s.bannerId, sections);
          } else {
            allDisplayedIds.add(s.bannerId);
            duplicateCheck.set(s.bannerId, [`Bottom-${idx + 1}`]);
          }
        });
        
        const totalShops = leftBarShops.length + rightBarShops.length + bottomShops.length + (heroShop ? 1 : 0);
        console.log(`✅ Total shops displayed: ${totalShops}, Unique IDs: ${allDisplayedIds.size}`);
        console.log(`   Hero: ${heroShop ? 1 : 0}, Left: ${leftBarShops.length}, Right: ${rightBarShops.length}, Bottom: ${bottomShops.length}`);
        
        if (allDisplayedIds.size !== totalShops) {
          console.warn(`⚠️ WARNING: Duplicate shops detected! (${totalShops - allDisplayedIds.size} duplicates)`);
          Array.from(duplicateCheck.entries())
            .filter(([_, sections]) => sections.length > 1)
            .forEach(([id, sections]) => {
              console.warn(`   - Shop ID ${id} appears in: ${sections.join(', ')}`);
            });
        } else {
          console.log('✓ No duplicate shops found across all sections');
        }

        // Combine banner data with nearby shops
        // Left bar: nearby shops (prioritized) - no banners, only shops
        const combinedLeft = leftBarShops.slice(0, 3);
        
        console.log(`✅ Combined left shops: ${combinedLeft.length}`, combinedLeft.map(s => s.advertiser));

        // Right bar: nearby shops (prioritized) - no banners, only shops
        const combinedRight = rightBarShops.slice(0, 3);
        
        console.log(`✅ Combined right shops: ${combinedRight.length}`, combinedRight.map(s => s.advertiser));

        // Bottom strip: nearby shops (prioritized) - no banners, only shops
        const combinedBottom = bottomShops.slice(0, 30); // Show 30 shops from AgentShop
        
        console.log(`✅ Combined bottom shops: ${combinedBottom.length}`, combinedBottom.map(s => s.advertiser));

        // Prepare hero data - use first shop if multiple shops available, otherwise use single shop or banner
        const heroDataForDisplay = heroShops.length > 0 
          ? heroShops[0] // First shop for initial display
          : heroShop && heroShop.planType === 'HERO'
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
              visitorCount: heroShop.visitorCount || 0,
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
          : undefined;

        setData({
          hero: heroDataForDisplay,
          heroShops: heroShops.length > 0 ? heroShops : undefined, // Pass multiple shops for rotation
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
  }, [location.id, location.latitude, location.longitude, category, isSearchActive, searchParams.pincode, searchParams.category, searchParams.area, searchParams.shopName, searchParams.planType]);

  const handleBannerClick = useCallback(async (
    bannerId: string,
    section: 'hero' | 'left' | 'right' | 'bottom' | 'bottomrail',
    position: number,
    link: string
  ) => {
    // Track analytics (fire and forget - don't block navigation)
    fetch('/api/analytics/banner-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerId, section, position }),
    }).catch(() => {
      // Silently fail - analytics shouldn't block navigation
    });

    // Extract shop ID from link or use bannerId
    let shopId: string | null = null;
    
    // If link contains /shop/ or /contact/, extract ID
    const shopMatch = link.match(/\/(shop|contact)\/([^\/\?]+)/);
    if (shopMatch) {
      shopId = shopMatch[2];
    } else if (bannerId) {
      // Use bannerId as shop ID
      shopId = bannerId;
    }

    // If it's a shop (has shopId), open modal instead of navigating
    if (shopId && !link.startsWith('http') && !link.includes('www.')) {
      setSelectedShopId(shopId);
      setIsModalOpen(true);
    } else {
      // External links or banners - navigate normally
      window.location.href = link;
    }
  }, []);

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
    <>
    <section
      className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 pt-0 pb-4 sm:pb-6"
      role="region"
      aria-label="Hero banner section"
    >
      {/* Parent Container - White Card */}
      <div 
        className="bg-white rounded-xl sm:rounded-2xl shadow-md p-2 sm:p-2 md:p-3"
        style={{
          backgroundColor: heroSettings?.global?.backgroundColor || '#ffffff',
          borderRadius: heroSettings?.global?.borderRadius ? undefined : undefined,
        }}
      >
        {/* SLIDER + SEARCH PANEL - 50% Each */}
        {(heroSettings?.sections?.slider !== false && heroSettings?.slider?.enabled !== false) && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slider - 50% */}
            <div className="w-full h-[144px] md:h-[240px]">
              <div className="h-full">
                <BestDealsSlider category={category} />
              </div>
            </div>
            {/* Search Panel - 50% */}
            <div className="w-full h-[180px] md:h-[240px]">
              <SearchPanel 
                onShopClick={(shopId) => {
                  setSelectedShopId(shopId);
                  setIsModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Desktop: Dynamic Grid Layout */}
        {(heroSettings?.sections?.leftRail !== false || heroSettings?.sections?.hero !== false || heroSettings?.sections?.rightRail !== false) && (() => {
          const leftRailEnabled = heroSettings?.sections?.leftRail !== false && heroSettings?.leftRail?.enabled !== false;
          const rightRailEnabled = heroSettings?.sections?.rightRail !== false && heroSettings?.rightRail?.enabled !== false;
          const heroEnabled = heroSettings?.sections?.hero !== false && heroSettings?.hero?.enabled !== false;
          
          // Calculate grid columns based on enabled sections
          let gridCols = '';
          if (leftRailEnabled && rightRailEnabled && heroEnabled) {
            gridCols = 'lg:grid-cols-[20%_60%_20%]'; // All three: 20% left, 60% hero, 20% right
          } else if (leftRailEnabled && heroEnabled) {
            gridCols = 'lg:grid-cols-[20%_80%]'; // Left + Hero: 20% left, 80% hero
          } else if (rightRailEnabled && heroEnabled) {
            gridCols = 'lg:grid-cols-[80%_20%]'; // Hero + Right: 80% hero, 20% right
          } else if (heroEnabled) {
            gridCols = 'lg:grid-cols-[100%]'; // Only Hero: 100% width
          } else if (leftRailEnabled && rightRailEnabled) {
            gridCols = 'lg:grid-cols-[50%_50%]'; // Left + Right (no hero): 50% each
          } else if (leftRailEnabled) {
            gridCols = 'lg:grid-cols-[100%]'; // Only Left: 100% width
          } else if (rightRailEnabled) {
            gridCols = 'lg:grid-cols-[100%]'; // Only Right: 100% width
          } else {
            return null; // Nothing to show
          }
          
          return (
            <div className={`hidden lg:grid ${gridCols} gap-3 md:gap-4 mb-4`}>
              {/* LEFT COLUMN */}
              {leftRailEnabled && (
                <LeftRail 
                  banners={data.left} 
                  onBannerClick={handleBannerClick} 
                  height={heroSettings?.leftRail?.height || "h-[391px]"}
                  userLat={location.latitude}
                  userLng={location.longitude}
                  maxCount={heroSettings?.leftRail?.count || 3}
                />
              )}

              {/* CENTER COLUMN - Hero */}
              {heroEnabled && (
                <div className="flex items-center justify-center">
                  <HeroBanner 
                    hero={data.hero} 
                    heroShops={data.heroShops}
                    onBannerClick={handleBannerClick} 
                    height={heroSettings?.hero?.height || "h-[391px]"}
                    rotationInterval={10000}
                  />
                </div>
              )}

              {/* RIGHT COLUMN */}
              {rightRailEnabled && (
                <RightSide 
                  banners={data.right} 
                  onBannerClick={handleBannerClick} 
                  height={heroSettings?.rightRail?.height || "h-[391px]"}
                  userLat={location.latitude}
                  userLng={location.longitude}
                  maxCount={heroSettings?.rightRail?.count || 3}
                />
              )}
            </div>
          );
        })()}

        {/* Tablet: Dynamic Grid Layout */}
        {(heroSettings?.sections?.leftRail !== false || heroSettings?.sections?.hero !== false || heroSettings?.sections?.rightRail !== false) && (() => {
          const leftRailEnabled = heroSettings?.sections?.leftRail !== false && heroSettings?.leftRail?.enabled !== false;
          const rightRailEnabled = heroSettings?.sections?.rightRail !== false && heroSettings?.rightRail?.enabled !== false;
          const heroEnabled = heroSettings?.sections?.hero !== false && heroSettings?.hero?.enabled !== false;
          
          // Calculate grid columns based on enabled sections
          let gridCols = '';
          if (leftRailEnabled && rightRailEnabled && heroEnabled) {
            gridCols = 'md:grid-cols-[18%_64%_18%]'; // All three: 18% left, 64% hero, 18% right
          } else if (leftRailEnabled && heroEnabled) {
            gridCols = 'md:grid-cols-[18%_82%]'; // Left + Hero: 18% left, 82% hero
          } else if (rightRailEnabled && heroEnabled) {
            gridCols = 'md:grid-cols-[82%_18%]'; // Hero + Right: 82% hero, 18% right
          } else if (heroEnabled) {
            gridCols = 'md:grid-cols-[100%]'; // Only Hero: 100% width
          } else if (leftRailEnabled && rightRailEnabled) {
            gridCols = 'md:grid-cols-[50%_50%]'; // Left + Right (no hero): 50% each
          } else if (leftRailEnabled) {
            gridCols = 'md:grid-cols-[100%]'; // Only Left: 100% width
          } else if (rightRailEnabled) {
            gridCols = 'md:grid-cols-[100%]'; // Only Right: 100% width
          } else {
            return null; // Nothing to show
          }
          
          return (
            <div className={`hidden md:grid lg:hidden ${gridCols} gap-2 md:gap-3 mb-4`}>
              {/* LEFT COLUMN */}
              {leftRailEnabled && (
                <LeftRail 
                  banners={data.left} 
                  onBannerClick={handleBannerClick} 
                  height="h-[293px]"
                  userLat={location.latitude}
                  userLng={location.longitude}
                  maxCount={heroSettings?.leftRail?.count || 3}
                />
              )}

              {/* CENTER COLUMN */}
              {heroEnabled && (
                <div className="flex items-center justify-center">
                  <HeroBanner 
                    hero={data.hero} 
                    heroShops={data.heroShops}
                    onBannerClick={handleBannerClick} 
                    height="h-[293px]"
                    rotationInterval={10000}
                  />
                </div>
              )}

              {/* RIGHT COLUMN */}
              {rightRailEnabled && (
                <RightSide 
                  banners={data.right} 
                  onBannerClick={handleBannerClick} 
                  height="h-[293px]"
                  userLat={location.latitude}
                  userLng={location.longitude}
                  maxCount={heroSettings?.rightRail?.count || 3}
                />
              )}
            </div>
          );
        })()}

        {/* Mobile: Dynamic Grid Layout */}
        {(heroSettings?.sections?.leftRail !== false || heroSettings?.sections?.hero !== false || heroSettings?.sections?.rightRail !== false) && (() => {
          const leftRailEnabled = heroSettings?.sections?.leftRail !== false && heroSettings?.leftRail?.enabled !== false;
          const rightRailEnabled = heroSettings?.sections?.rightRail !== false && heroSettings?.rightRail?.enabled !== false;
          const heroEnabled = heroSettings?.sections?.hero !== false && heroSettings?.hero?.enabled !== false;
          
          // Calculate grid columns based on enabled sections
          let gridCols = '';
          if (leftRailEnabled && rightRailEnabled && heroEnabled) {
            gridCols = 'grid-cols-[22%_56%_22%]'; // All three: 22% left, 56% hero, 22% right
          } else if (leftRailEnabled && heroEnabled) {
            gridCols = 'grid-cols-[22%_78%]'; // Left + Hero: 22% left, 78% hero
          } else if (rightRailEnabled && heroEnabled) {
            gridCols = 'grid-cols-[78%_22%]'; // Hero + Right: 78% hero, 22% right
          } else if (heroEnabled) {
            gridCols = 'grid-cols-[100%]'; // Only Hero: 100% width
          } else if (leftRailEnabled && rightRailEnabled) {
            gridCols = 'grid-cols-[50%_50%]'; // Left + Right (no hero): 50% each
          } else if (leftRailEnabled) {
            gridCols = 'grid-cols-[100%]'; // Only Left: 100% width
          } else if (rightRailEnabled) {
            gridCols = 'grid-cols-[100%]'; // Only Right: 100% width
          } else {
            return null; // Nothing to show
          }
          
          return (
            <div className={`md:hidden grid ${gridCols} gap-1.5 sm:gap-2 mb-4 mt-[25px]`}>
              {/* LEFT COLUMN */}
              {leftRailEnabled && (
                <LeftRail 
                  banners={data.left} 
                  onBannerClick={handleBannerClick} 
                  height="h-[176px] sm:h-[240px]"
                  userLat={location.latitude}
                  userLng={location.longitude}
                  maxCount={heroSettings?.leftRail?.count || 3}
                />
              )}

              {/* CENTER COLUMN - Hero */}
              {heroEnabled && (
                <div className="flex items-center justify-center">
                  <HeroBanner 
                    hero={data.hero} 
                    heroShops={data.heroShops}
                    onBannerClick={handleBannerClick} 
                    height="h-[176px] sm:h-[240px]"
                    rotationInterval={10000}
                  />
                </div>
              )}

              {/* RIGHT COLUMN */}
              {rightRailEnabled && (
                <RightSide 
                  banners={data.right} 
                  onBannerClick={handleBannerClick} 
                  height="h-[176px] sm:h-[240px]"
                  userLat={location.latitude}
                  userLng={location.longitude}
                  maxCount={heroSettings?.rightRail?.count || 3}
                />
              )}
            </div>
          );
        })()}

        {/* BOTTOM RAIL - 12 Featured Shops */}
        {(heroSettings?.sections?.bottomStrip !== false && heroSettings?.bottomStrip?.enabled !== false) && (
          <BottomRail 
            banners={data.bottom} 
            onBannerClick={handleBannerClick}
            userLat={location.latitude}
            userLng={location.longitude}
          />
        )}

        {/* BOTTOM STRIP - Nearby Shops */}
        {(heroSettings?.sections?.bottomStrip !== false && heroSettings?.bottomStrip?.enabled !== false) && (
          <BottomStrip 
            banners={data.bottom} 
            onBannerClick={handleBannerClick}
            maxCount={heroSettings?.bottomStrip?.count || 10}
          />
        )}
      </div>
    </section>
    
    {/* Full Page Shop Modal */}
    <ShopFullPageModal
      shopId={selectedShopId}
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
        setSelectedShopId(null);
      }}
    />
    </>
  );
}
