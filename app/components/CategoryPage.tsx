'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocation } from '../contexts/LocationContext';
import type { BusinessSummary } from '../types';
import Navbar from './Navbar';
import CategoryFilterTabs, { type FilterType } from './CategoryFilterTabs';
import CategoryLeftRail from './category/CategoryLeftRail';
import CategoryRightRail from './category/CategoryRightRail';
import CategoryHeroBanner from './category/CategoryHeroBanner';
import CategoryBottomStrip from './category/CategoryBottomStrip';

type CategoryListing = BusinessSummary & {
  distance?: number;
  popularity?: number;
  latitude?: number;
  longitude?: number;
};

type CategoryPageProps = {
  categoryName: string;
  categorySlug: string;
};

export default function CategoryPage({ categoryName, categorySlug }: CategoryPageProps) {
  const router = useRouter();
  const { location } = useLocation();
  const [nearbyBusinesses, setNearbyBusinesses] = useState<CategoryListing[]>([]);
  const [popularBusinesses, setPopularBusinesses] = useState<CategoryListing[]>([]);
  const [ratedBusinesses, setRatedBusinesses] = useState<CategoryListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('nearby');

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        // Food images from /Assets/food/ folder
        const foodImages = [
          'Screenshot from 2025-11-29 12-57-14.png',
          'Screenshot from 2025-11-29 12-57-29.png',
          'Screenshot from 2025-11-29 12-57-45.png',
          'Screenshot from 2025-11-29 12-58-13.png',
          'Screenshot from 2025-11-29 12-58-24.png',
          'Screenshot from 2025-11-29 12-58-32.png',
          'Screenshot from 2025-11-29 12-58-46.png',
          'Screenshot from 2025-11-29 12-58-56.png',
          'Screenshot from 2025-11-29 12-59-08.png',
          'Screenshot from 2025-11-29 12-59-17.png',
          'Screenshot from 2025-11-29 12-59-32.png',
          'Screenshot from 2025-11-29 12-59-42.png',
          'Screenshot from 2025-11-29 12-59-54.png',
          'Screenshot from 2025-11-29 13-00-00.png',
        ];

        // Helper function to enhance businesses with food images for restaurants
        // Only uses food images as fallback when imageUrl is missing
        const enhanceBusinesses = (businesses: CategoryListing[]): CategoryListing[] => {
          const isRestaurantCategory = categorySlug === 'restaurants' || categoryName.toLowerCase() === 'restaurants';
          if (!isRestaurantCategory) return businesses;
          
          return businesses.map((business, index) => {
            // Only use food image if imageUrl is completely missing or empty
            // This respects images uploaded through admin panel
            if (!business.imageUrl || business.imageUrl.trim() === '') {
              const foodImage = foodImages[index % foodImages.length];
              return {
                ...business,
                imageUrl: `/Assets/food/${encodeURIComponent(foodImage)}`,
              };
            }
            // Keep the existing imageUrl from database (admin uploaded images)
            return business;
          });
        };

        // Helper function to safely fetch and parse JSON
        const safeFetch = async (url: string) => {
          try {
            const res = await fetch(url);
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              throw new Error('Response is not JSON');
            }
            return await res.json();
          } catch (error) {
            console.warn(`Failed to fetch from ${url}:`, error);
            return null;
          }
        };

        // Fetch all business types in parallel for better performance
        const [nearbyData, popularData, ratedData] = await Promise.all([
          safeFetch(`/api/categories/${categorySlug}/businesses?type=nearby&loc=${location.id}`),
          safeFetch(`/api/categories/${categorySlug}/businesses?type=popular&loc=${location.id}`),
          safeFetch(`/api/categories/${categorySlug}/businesses?type=rated&loc=${location.id}`),
        ]);

        if (nearbyData?.businesses && nearbyData.businesses.length > 0) {
          setNearbyBusinesses(enhanceBusinesses(nearbyData.businesses));
        }

        if (popularData?.businesses && popularData.businesses.length > 0) {
          setPopularBusinesses(enhanceBusinesses(popularData.businesses));
        }

        if (ratedData?.businesses && ratedData.businesses.length > 0) {
          setRatedBusinesses(enhanceBusinesses(ratedData.businesses));
        }

        // If no data was fetched from API, use mock data
        const hasApiData = (nearbyData?.businesses?.length > 0) || 
                          (popularData?.businesses?.length > 0) || 
                          (ratedData?.businesses?.length > 0);
        
        if (!hasApiData) {
          throw new Error('No API data available, using mock data');
        }
      } catch (e) {
        // Food images from /Assets/food/ folder
        const foodImages = [
          'Screenshot from 2025-11-29 12-57-14.png',
          'Screenshot from 2025-11-29 12-57-29.png',
          'Screenshot from 2025-11-29 12-57-45.png',
          'Screenshot from 2025-11-29 12-58-13.png',
          'Screenshot from 2025-11-29 12-58-24.png',
          'Screenshot from 2025-11-29 12-58-32.png',
          'Screenshot from 2025-11-29 12-58-46.png',
          'Screenshot from 2025-11-29 12-58-56.png',
          'Screenshot from 2025-11-29 12-59-08.png',
          'Screenshot from 2025-11-29 12-59-17.png',
          'Screenshot from 2025-11-29 12-59-32.png',
          'Screenshot from 2025-11-29 12-59-42.png',
          'Screenshot from 2025-11-29 12-59-54.png',
          'Screenshot from 2025-11-29 13-00-00.png',
        ];

        // Fallback to mock data if API fails
        const unsplashIds = [
          '1504674900247-0877df9cc836', '1515003197210-e0cd71810b5f', '1517248135467-4c7edcad34c4',
          '1555396273-367ea4eb4db5', '1574071318508-1cdbab80d002', '1559339352-11d035aa65de',
          '1579584425555-c3ce17fd4351', '1554118811-1e0d58224f24', '1544025162-d76694265947',
          '1551218808-94e220e084d2', '1550547660-d9450f859349', '1414235077428-338989a2e8c0',
          '1565299624946-b28f40a0ae38', '1551024506-0bccd828d307', '1507146426996-ef05306b995a',
          '1503387762-592deb58ef4e', '1498050108023-c5249f4df085', '1517836357463-d25dfeac3438',
          '1506126613408-eca07ce68773', '1454165804606-c3d57bc86b40', '1520854223477-8e4385a525b5',
          '1469474968028-56623f02e42e', '1503736334956-4c8f8e92946d', '1517940310602-285a6c62b30a',
          '1541971875078-7c5c8a2360dd', '1473186505569-9c61870c11f9', '1515165562835-c4c1bfa67a47',
          '1434575472303-3625a83fbd0c', '1527613426441-4da17471b66d', '1485846234645-a62644f84728'
        ];

        // Use food images for restaurants category, otherwise use Unsplash
        // Note: In real usage, businesses will have imageUrl from database (admin uploaded)
        const isRestaurantCategory = categorySlug === 'restaurants' || categoryName.toLowerCase() === 'restaurants';
        const getImageUrl = (index: number) => {
          if (isRestaurantCategory) {
            const foodImage = foodImages[index % foodImages.length];
            return `/Assets/food/${encodeURIComponent(foodImage)}`;
          }
          return `https://images.unsplash.com/photo-${unsplashIds[index % unsplashIds.length]}?w=600&h=400&auto=format&fit=crop`;
        };

        const mockData: CategoryListing[] = Array.from({ length: 30 }, (_, i) => ({
          id: `${categorySlug}-${i + 1}`,
          name: `${categoryName} ${i + 1}`,
          category: categoryName,
          imageUrl: getImageUrl(i),
          rating: 4.0 + (Math.random() * 1.0),
          reviews: Math.floor(Math.random() * 300) + 50,
          city: location.city,
          state: location.state,
          distance: Math.random() * 5,
          latitude: location.latitude ? location.latitude + (Math.random() - 0.5) * 0.1 : undefined,
          longitude: location.longitude ? location.longitude + (Math.random() - 0.5) * 0.1 : undefined,
        }));

        // Sort mock data for different sections
        setNearbyBusinesses([...mockData].sort((a, b) => (a.distance || 0) - (b.distance || 0)));
        setPopularBusinesses([...mockData].sort((a, b) => b.reviews - a.reviews));
        setRatedBusinesses([...mockData].sort((a, b) => b.rating - a.rating));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinesses();
  }, [categorySlug, categoryName, location.id, location.city, location.state, location.latitude, location.longitude]);

  // Get current businesses based on active filter
  const getCurrentBusinesses = (): CategoryListing[] => {
    switch (activeFilter) {
      case 'nearby':
        return nearbyBusinesses;
      case 'popular':
        return popularBusinesses;
      case 'top-rated':
        return ratedBusinesses;
      default:
        return nearbyBusinesses;
    }
  };

  // Convert business to banner format with business info
  const businessToBanner = (business: CategoryListing, index: number) => ({
    bannerId: business.id,
    imageUrl: business.imageUrl,
    alt: business.name,
    link: `/contact/${business.id}`,
    advertiser: business.name,
    lat: business.latitude,
    lng: business.longitude,
    distance: business.distance,
    isBusiness: true,
    rating: business.rating,
    reviews: business.reviews,
  });

  // Distribute businesses across sections
  const distributeBusinesses = (businesses: CategoryListing[]) => {
    const banners = businesses.map(businessToBanner);
    
    // Hero: first business
    const hero = banners[0] ? {
      bannerId: banners[0].bannerId,
      imageUrl: banners[0].imageUrl,
      alt: banners[0].alt,
      link: banners[0].link,
      title: banners[0].advertiser,
      advertiser: banners[0].advertiser,
      distance: banners[0].distance,
      isBusiness: true,
      rating: banners[0].rating,
      reviews: banners[0].reviews,
    } : undefined;

    // Left rail: next 4 businesses
    const left = banners.slice(1, 5);

    // Right rail: next 4 businesses
    const right = banners.slice(5, 9);

    // Bottom strip: remaining businesses (up to 20)
    const bottom = banners.slice(9, 29);

    return { hero, left, right, bottom };
  };

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

    // Navigate to business detail page
    router.push(link);
  };

  const currentBusinesses = getCurrentBusinesses();
  const { hero, left, right, bottom } = distributeBusinesses(currentBusinesses);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <section className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-10 w-96 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 flex-1 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[20%_60%_20%] gap-6">
              <div className="h-[480px] space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="h-[480px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl animate-pulse" />
              <div className="h-[480px] space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
  
  // Empty State
  if (currentBusinesses.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-600 mb-4 flex items-center gap-2">
            <a href="/" className="hover:text-amber-600 transition-colors">Home</a>
            <span>/</span>
            <a href="/" className="hover:text-amber-600 transition-colors">Categories</a>
            <span>/</span>
            <span className="text-gray-900 font-medium">{categoryName}</span>
          </nav>
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              {categoryName} in {location.displayName || location.city || 'Your Area'}
            </h1>
            <p className="text-gray-600 text-base sm:text-lg mb-6">
              No {categoryName.toLowerCase()} found in this area
            </p>
            <CategoryFilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          </div>
          
          {/* Empty State */}
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No businesses found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find any {categoryName.toLowerCase()} in {location.displayName || location.city}. 
                Try adjusting your location or check back later.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-custom-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Change Location
                </button>
                <button 
                  onClick={() => window.location.href = '/categories'}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:border-amber-500 hover:bg-amber-50 transition-all"
                >
                  Browse Categories
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        {/* Breadcrumb Navigation */}
        <nav className="text-sm text-gray-600 mb-4 flex items-center gap-2">
          <a href="/" className="hover:text-amber-600 transition-colors">Home</a>
          <span>/</span>
          <a href="/" className="hover:text-amber-600 transition-colors">Categories</a>
          <span>/</span>
          <span className="text-gray-900 font-medium">{categoryName}</span>
        </nav>

        {/* Header Section */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">
                {categoryName} in {location.displayName || location.city || 'Your Area'}
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                {currentBusinesses.length > 0 
                  ? `${currentBusinesses.length} ${categoryName.toLowerCase()} found` 
                  : `Searching for ${categoryName.toLowerCase()}...`}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                className="px-4 py-2.5 border border-gray-300 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all duration-200 flex items-center gap-2 text-sm font-semibold text-gray-700"
                aria-label="Share"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden sm:inline">Share</span>
              </button>
              <button 
                className="px-4 py-2.5 border border-gray-300 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all duration-200 flex items-center gap-2 text-sm font-semibold text-gray-700"
                aria-label="Map View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="hidden sm:inline">Map</span>
              </button>
            </div>
          </div>
          
          {/* Filter Tabs */}
          <CategoryFilterTabs 
            activeFilter={activeFilter} 
            onFilterChange={setActiveFilter}
            counts={{
              nearby: nearbyBusinesses.length,
              popular: popularBusinesses.length,
              'top-rated': ratedBusinesses.length,
            }}
          />
        </div>

        {/* Hero Section Layout - Same as Homepage */}
        <section
          className="max-w-[98%] mx-auto px-0 pt-0 pb-6 sm:pb-8"
          role="region"
          aria-label={`${categoryName} listings`}
        >
          {/* Parent Container - White Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-5 md:p-6 lg:p-8">
            {/* Desktop: 3-Column Grid Layout */}
            <div className="hidden lg:grid lg:grid-cols-[20%_60%_20%] gap-6 lg:gap-8 mb-8">
              {/* LEFT COLUMN (20%) */}
              <CategoryLeftRail 
                banners={left} 
                onBannerClick={handleBannerClick} 
                height="h-[480px]"
                userLat={location.latitude}
                userLng={location.longitude}
              />

              {/* CENTER COLUMN (60%) - Hero */}
              <div className="flex items-center justify-center">
                <CategoryHeroBanner hero={hero} onBannerClick={handleBannerClick} />
              </div>

              {/* RIGHT COLUMN (20%) */}
              <CategoryRightRail 
                banners={right} 
                onBannerClick={handleBannerClick} 
                height="h-[480px]"
                userLat={location.latitude}
                userLng={location.longitude}
              />
            </div>

            {/* Tablet: Adjusted 3-Column Layout */}
            <div className="hidden md:grid lg:hidden md:grid-cols-[18%_64%_18%] gap-5 md:gap-6 mb-6">
              {/* LEFT COLUMN */}
              <CategoryLeftRail 
                banners={left} 
                onBannerClick={handleBannerClick} 
                height="h-[360px]"
                userLat={location.latitude}
                userLng={location.longitude}
              />

              {/* CENTER COLUMN */}
              <div className="flex items-center justify-center">
                <CategoryHeroBanner hero={hero} onBannerClick={handleBannerClick} height="h-[360px]" />
              </div>

              {/* RIGHT COLUMN */}
              <CategoryRightRail 
                banners={right} 
                onBannerClick={handleBannerClick} 
                height="h-[360px]"
                userLat={location.latitude}
                userLng={location.longitude}
              />
            </div>

            {/* Mobile: 3-Column Grid Layout */}
            <div className="md:hidden grid grid-cols-[22%_56%_22%] gap-3 sm:gap-4 mb-6">
              {/* LEFT COLUMN */}
              <CategoryLeftRail 
                banners={left} 
                onBannerClick={handleBannerClick} 
                height="h-[200px] sm:h-[240px]"
                userLat={location.latitude}
                userLng={location.longitude}
              />

              {/* CENTER COLUMN - Hero */}
              <div className="flex items-center justify-center">
                <CategoryHeroBanner hero={hero} onBannerClick={handleBannerClick} height="h-[200px] sm:h-[240px]" />
              </div>

              {/* RIGHT COLUMN */}
              <CategoryRightRail 
                banners={right} 
                onBannerClick={handleBannerClick} 
                height="h-[200px] sm:h-[240px]"
                userLat={location.latitude}
                userLng={location.longitude}
              />
            </div>

            {/* BOTTOM STRIP - Full Width */}
            <CategoryBottomStrip banners={bottom} onBannerClick={handleBannerClick} />
          </div>
        </section>
      </main>
    </div>
  );
}
