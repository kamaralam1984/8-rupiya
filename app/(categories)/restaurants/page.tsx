'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLocation } from '../../contexts/LocationContext';
import type { BusinessSummary } from '../../types';
import Navbar from '../../components/Navbar';

type RestaurantListing = BusinessSummary & {
  distance?: number;
  popularity?: number;
};

const RestaurantCard = ({ restaurant }: { restaurant: RestaurantListing }) => (
  <article className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-md sm:shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl sm:hover:shadow-2xl hover:-translate-y-1 sm:hover:-translate-y-2 hover:border-amber-200">
    {/* Image Section */}
    <div className="relative h-44 sm:h-48 md:h-52 w-full overflow-hidden">
      <Image 
        src={restaurant.imageUrl} 
        alt={restaurant.name} 
        fill 
        className="object-cover transition-transform duration-700 group-hover:scale-110" 
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      
      {/* Rating Badge */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-10">
        <div className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 shadow-lg border border-white/50">
          <svg className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-xs sm:text-sm font-bold text-gray-900">{restaurant.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Distance Badge */}
      {restaurant.distance && (
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 md:bottom-4 md:left-4 z-10">
          <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-gray-800 shadow-lg border border-white/50">
            <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657A8 8 0 1117.657 16.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden min-[375px]:inline">{restaurant.distance} km</span>
            <span className="min-[375px]:hidden">{restaurant.distance}</span>
          </div>
        </div>
      )}

      {/* Review Count Overlay */}
      <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 md:bottom-4 md:right-4 z-10">
        <div className="text-[10px] sm:text-xs font-medium text-white drop-shadow-lg">
          <span className="hidden sm:inline">{restaurant.reviews}+ reviews</span>
          <span className="sm:hidden">{restaurant.reviews}+</span>
        </div>
      </div>
    </div>

    {/* Content Section */}
    <div className="flex flex-1 flex-col p-3 sm:p-4 md:p-5">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-amber-600 transition-colors">
          {restaurant.name}
        </h3>
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="truncate text-xs sm:text-sm">{restaurant.city}{restaurant.state ? `, ${restaurant.state}` : ''}</span>
        </div>
      </div>

      {/* Call Button */}
      <a 
        href={`/contact/${restaurant.id}`} 
        className="mt-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-linear-to-r from-yellow-400 via-amber-500 to-yellow-600 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl hover:opacity-95 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.129a11.042 11.042 0 005.516 5.516l1.129-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 19.72V23a2 2 0 01-2 2h-1C9.163 25 3 18.837 3 11V5z" />
        </svg>
        <span>Call Now</span>
      </a>
    </div>
  </article>
);

export default function RestaurantsPage() {
  const { location } = useLocation();
  const [nearbyRestaurants, setNearbyRestaurants] = useState<RestaurantListing[]>([]);
  const [popularRestaurants, setPopularRestaurants] = useState<RestaurantListing[]>([]);
  const [ratedRestaurants, setRatedRestaurants] = useState<RestaurantListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
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

        // Fetch nearby restaurants (sorted by distance)
        const nearbyData = await safeFetch(`/api/businesses/restaurants?type=nearby&loc=${location.id}`);
        if (nearbyData?.restaurants && nearbyData.restaurants.length > 0) {
          setNearbyRestaurants(nearbyData.restaurants);
        }

        // Fetch most popular restaurants (sorted by reviews/popularity)
        const popularData = await safeFetch(`/api/businesses/restaurants?type=popular&loc=${location.id}`);
        if (popularData?.restaurants && popularData.restaurants.length > 0) {
          setPopularRestaurants(popularData.restaurants);
        }

        // Fetch most rated restaurants (sorted by rating)
        const ratedData = await safeFetch(`/api/businesses/restaurants?type=rated&loc=${location.id}`);
        if (ratedData?.restaurants && ratedData.restaurants.length > 0) {
          setRatedRestaurants(ratedData.restaurants);
        }

        // If no data was fetched from API, use mock data
        const hasApiData = (nearbyData?.restaurants?.length > 0) || 
                          (popularData?.restaurants?.length > 0) || 
                          (ratedData?.restaurants?.length > 0);
        
        if (!hasApiData) {
          throw new Error('No API data available, using mock data');
        }
      } catch (e) {
        // Silently use mock data - this is expected when API endpoints don't exist
        // Fallback to mock data if API fails
        const mockData: RestaurantListing[] = [
          {
            id: 'r1',
            name: 'The Urban Tandoor',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&auto=format&fit=crop',
            rating: 4.8,
            reviews: 368,
            city: location.city,
            state: location.state,
            distance: 1.2,
          },
          {
            id: 'r2',
            name: 'Bao & Biryani Co.',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=600&h=400&auto=format&fit=crop',
            rating: 4.4,
            reviews: 198,
            city: location.city,
            state: location.state,
            distance: 2.5,
          },
          {
            id: 'r3',
            name: 'Spice Garden',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&auto=format&fit=crop',
            rating: 4.6,
            reviews: 245,
            city: location.city,
            state: location.state,
            distance: 0.8,
          },
          {
            id: 'r4',
            name: 'Coastal Flavors',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&auto=format&fit=crop',
            rating: 4.7,
            reviews: 312,
            city: location.city,
            state: location.state,
            distance: 3.1,
          },
          {
            id: 'r5',
            name: 'The Pizza Corner',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&auto=format&fit=crop',
            rating: 4.5,
            reviews: 189,
            city: location.city,
            state: location.state,
            distance: 1.8,
          },
          {
            id: 'r6',
            name: 'Royal Mughlai',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&auto=format&fit=crop',
            rating: 4.9,
            reviews: 456,
            city: location.city,
            state: location.state,
            distance: 2.3,
          },
          {
            id: 'r7',
            name: 'Sakura Sushi Bar',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&h=400&auto=format&fit=crop',
            rating: 4.7,
            reviews: 278,
            city: location.city,
            state: location.state,
            distance: 1.5,
          },
          {
            id: 'r8',
            name: 'Cafe Mocha',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&auto=format&fit=crop',
            rating: 4.6,
            reviews: 203,
            city: location.city,
            state: location.state,
            distance: 0.5,
          },
          {
            id: 'r9',
            name: 'BBQ House',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&auto=format&fit=crop',
            rating: 4.5,
            reviews: 167,
            city: location.city,
            state: location.state,
            distance: 2.8,
          },
          {
            id: 'r10',
            name: 'Thai Orchid',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=400&auto=format&fit=crop',
            rating: 4.8,
            reviews: 334,
            city: location.city,
            state: location.state,
            distance: 1.9,
          },
          {
            id: 'r11',
            name: 'Burger Junction',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=400&auto=format&fit=crop',
            rating: 4.3,
            reviews: 145,
            city: location.city,
            state: location.state,
            distance: 1.1,
          },
          {
            id: 'r12',
            name: 'Dolce Vita',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&auto=format&fit=crop',
            rating: 4.6,
            reviews: 221,
            city: location.city,
            state: location.state,
            distance: 2.6,
          },
          {
            id: 'r13',
            name: 'Naan Stop',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&auto=format&fit=crop',
            rating: 4.4,
            reviews: 192,
            city: location.city,
            state: location.state,
            distance: 1.7,
          },
          {
            id: 'r14',
            name: 'Seafood Paradise',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&auto=format&fit=crop',
            rating: 4.7,
            reviews: 289,
            city: location.city,
            state: location.state,
            distance: 3.5,
          },
          {
            id: 'r15',
            name: 'The Green Leaf',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&auto=format&fit=crop',
            rating: 4.5,
            reviews: 156,
            city: location.city,
            state: location.state,
            distance: 2.1,
          },
          {
            id: 'r16',
            name: 'Dessert Delight',
            category: 'Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=400&auto=format&fit=crop',
            rating: 4.6,
            reviews: 234,
            city: location.city,
            state: location.state,
            distance: 0.9,
          },
        ];

        // Sort mock data for different sections
        setNearbyRestaurants([...mockData].sort((a, b) => (a.distance || 0) - (b.distance || 0)));
        setPopularRestaurants([...mockData].sort((a, b) => b.reviews - a.reviews));
        setRatedRestaurants([...mockData].sort((a, b) => b.rating - a.rating));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, [location.id, location.city, location.state]);

  const RestaurantSection = ({ 
    title, 
    description, 
    restaurants 
  }: { 
    title: string; 
    description: string; 
    restaurants: RestaurantListing[] 
  }) => (
    <section className="space-y-4 sm:space-y-5 md:space-y-6 py-6 sm:py-8 md:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <span className="font-medium">{restaurants.length} restaurants</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white shadow-md sm:shadow-lg overflow-hidden">
              <div className="h-40 sm:h-48 md:h-52 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
              <div className="p-3 sm:p-4 md:p-5">
                <div className="h-5 sm:h-6 w-3/4 bg-gray-200 rounded-lg mb-2 sm:mb-3 animate-pulse" />
                <div className="h-3 sm:h-4 w-1/2 bg-gray-200 rounded mb-3 sm:mb-4 animate-pulse" />
                <div className="h-9 sm:h-10 w-full bg-gray-200 rounded-lg sm:rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 rounded-2xl sm:rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 px-4">
          <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-base sm:text-lg font-medium text-gray-600">No restaurants found in this area.</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Try adjusting your location or filters.</p>
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <Navbar />
      
      <main className="max-w-[98%] mx-auto px-3 sm:px-4 md:px-5 lg:px-6 pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 md:pb-10">
        {/* Nearby Restaurants Section */}
      <RestaurantSection
        title="Nearby Restaurants"
        description="Restaurants closest to your location"
        restaurants={nearbyRestaurants}
      />

      {/* Most Popular Restaurants Section */}
      <RestaurantSection
        title="Most Popular Restaurants"
        description="Highly reviewed and frequently visited restaurants"
        restaurants={popularRestaurants}
      />

        {/* Most Rated Restaurants Section */}
        <RestaurantSection
          title="Most Rated Restaurants"
          description="Top-rated restaurants with excellent reviews"
          restaurants={ratedRestaurants}
        />
      </main>
    </div>
  );
}
