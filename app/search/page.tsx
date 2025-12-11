'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import SearchBar from '../components/search/SearchBar';
import ShopCard from '../components/search/ShopCard';
import LeftRail from '../components/search/LeftRail';
import RightRail from '../components/search/RightRail';
import BottomStrip from '../components/search/BottomStrip';

interface Shop {
  id: string;
  name: string;
  shopName?: string;
  category: string;
  area?: string;
  city?: string;
  pincode?: string;
  imageUrl?: string;
  photoUrl?: string;
  distance?: number;
  shopUrl?: string;
  website?: string;
  mobile?: string;
  score?: number;
}

interface SearchResults {
  mainResults: Shop[];
  leftRail: Shop[];
  rightRail: Shop[];
  bottomStrip: Shop[];
  totalFound: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [category, setCategory] = useState('');
  const [shopName, setShopName] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat?: number; lng?: number }>({});

  // Get user location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Location access denied or failed
        }
      );
    }
  }, []);

  // Load search params from URL
  useEffect(() => {
    const pincodeParam = searchParams.get('pincode') || '';
    const areaParam = searchParams.get('area') || '';
    const categoryParam = searchParams.get('category') || '';
    const shopNameParam = searchParams.get('shopName') || '';

    setPincode(pincodeParam);
    setArea(areaParam);
    setCategory(categoryParam);
    setShopName(shopNameParam);

    // Auto-search if params exist
    if (pincodeParam || areaParam || categoryParam || shopNameParam) {
      performSearch({
        pincode: pincodeParam,
        area: areaParam,
        category: categoryParam,
        shopName: shopNameParam,
      });
    }
  }, [searchParams]);

  const performSearch = async (searchData: {
    pincode?: string;
    area?: string;
    category?: string;
    shopName?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchData.pincode) params.append('pincode', searchData.pincode);
      if (searchData.area) params.append('area', searchData.area);
      if (searchData.category) params.append('category', searchData.category);
      if (searchData.shopName) params.append('shopName', searchData.shopName);
      if (userLocation.lat) params.append('userLat', userLocation.lat.toString());
      if (userLocation.lng) params.append('userLng', userLocation.lng.toString());

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setResults(data);
      } else {
        setError(data.error || 'Search failed');
        setResults(null);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Error performing search. Please try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const searchData = {
      pincode: pincode.trim(),
      area: area.trim(),
      category: category.trim(),
      shopName: shopName.trim(),
    };

    // Update URL
    const params = new URLSearchParams();
    if (searchData.pincode) params.append('pincode', searchData.pincode);
    if (searchData.area) params.append('area', searchData.area);
    if (searchData.category) params.append('category', searchData.category);
    if (searchData.shopName) params.append('shopName', searchData.shopName);

    router.push(`/search?${params.toString()}`);
    performSearch(searchData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            pincode={pincode}
            area={area}
            category={category}
            shopName={shopName}
            onPincodeChange={setPincode}
            onAreaChange={setArea}
            onCategoryChange={setCategory}
            onShopNameChange={setShopName}
            onSearch={handleSearch}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results && (
          <div className="space-y-6">
            {/* Results Summary */}
            <div className="mb-4">
              <p className="text-gray-600">
                Found <span className="font-semibold text-gray-900">{results.totalFound}</span> shops
              </p>
            </div>

            {/* 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Rail */}
              <div className="lg:col-span-2">
                <LeftRail shops={results.leftRail} />
              </div>

              {/* Main Results */}
              <div className="lg:col-span-8">
                <div className="space-y-4">
                  {results.mainResults.length > 0 ? (
                    results.mainResults.map((shop) => (
                      <ShopCard key={shop.id} shop={shop} />
                    ))
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg">
                      <p className="text-gray-600">No shops found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Rail */}
              <div className="lg:col-span-2">
                <RightRail shops={results.rightRail} />
              </div>
            </div>

            {/* Bottom Strip */}
            {results.bottomStrip.length > 0 && (
              <div className="mt-8">
                <BottomStrip shops={results.bottomStrip} />
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !results && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">Enter search criteria to find shops</p>
          </div>
        )}
      </main>
    </div>
  );
}



