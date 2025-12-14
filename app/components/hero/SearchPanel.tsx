'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useLocation } from '../../contexts/LocationContext';
import { calculateDistance } from '../../utils/distance';

interface Shop {
  _id?: string;
  id?: string;
  shopName?: string;
  name?: string;
  ownerName?: string;
  category?: string;
  mobile?: string;
  phone?: string;
  fullAddress?: string;
  address?: string;
  area?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  imageUrl?: string;
  planType?: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL' | 'BANNER' | 'HERO';
  priorityRank?: number;
  visitorCount?: number;
  distance?: number;
}

interface SearchPanelProps {
  onShopClick?: (shopId: string) => void;
}

interface Category {
  id: string;
  name: string;
  displayName: string;
  slug: string;
}

export default function SearchPanel({ onShopClick }: SearchPanelProps) {
  const { location } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterBy, setFilterBy] = useState<'category' | 'pincode' | 'search'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPincode, setSelectedPincode] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [pincodes, setPincodes] = useState<string[]>([]);

  // Fetch categories and pincodes on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && data.categories) {
          setCategories(data.categories.map((cat: any) => ({
            id: cat.id || cat._id || '',
            name: cat.name || cat.displayName || '',
            displayName: cat.displayName || cat.name || '',
            slug: cat.slug || '',
          })));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    const fetchPincodes = async () => {
      try {
        const res = await fetch('/api/shops/search-options');
        const data = await res.json();
        if (data.success && data.pincodes) {
          setPincodes(data.pincodes.sort());
        }
      } catch (error) {
        console.error('Error fetching pincodes:', error);
      }
    };

    fetchCategories();
    fetchPincodes();
  }, []);

  // Fetch shops based on filter
  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        let url = '/api/shops/nearby?useMongoDB=true&limit=20';
        
        if (location.latitude && location.longitude) {
          url += `&userLat=${location.latitude}&userLng=${location.longitude}&radiusKm=1000`;
        } else if (location.city) {
          url += `&city=${encodeURIComponent(location.city)}`;
        }

        if (filterBy === 'category' && selectedCategory) {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        } else if (filterBy === 'pincode' && selectedPincode) {
          url += `&pincode=${encodeURIComponent(selectedPincode)}`;
        } else if (filterBy === 'search' && searchQuery.trim()) {
          url += `&shopName=${encodeURIComponent(searchQuery.trim())}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success && data.shops) {
          // Calculate distances and sort
          let shopsWithDistance = data.shops.map((shop: Shop) => {
            let distance = 0;
            if (location.latitude && location.longitude && shop.latitude && shop.longitude) {
              distance = calculateDistance(
                location.latitude,
                location.longitude,
                shop.latitude,
                shop.longitude
              );
            }
            return {
              ...shop,
              distance: distance || shop.distance || 0,
            };
          });

          // Sort based on filter
          if (filterBy === 'category') {
            shopsWithDistance.sort((a: Shop, b: Shop) => {
              // Sort by priority rank (higher first), then by distance
              const rankA = a.priorityRank || 0;
              const rankB = b.priorityRank || 0;
              if (rankB !== rankA) return rankB - rankA;
              return (a.distance || 0) - (b.distance || 0);
            });
          } else if (filterBy === 'pincode') {
            shopsWithDistance.sort((a: Shop, b: Shop) => {
              // Sort by priority rank first, then by distance
              const rankA = a.priorityRank || 0;
              const rankB = b.priorityRank || 0;
              if (rankB !== rankA) return rankB - rankA;
              return (a.distance || 0) - (b.distance || 0);
            });
          } else if (filterBy === 'search') {
            // Sort by relevance (matching shop name first), then by distance
            const query = searchQuery.toLowerCase();
            shopsWithDistance.sort((a: Shop, b: Shop) => {
              const aName = (a.shopName || a.name || '').toLowerCase();
              const bName = (b.shopName || b.name || '').toLowerCase();
              const aMatch = aName.includes(query);
              const bMatch = bName.includes(query);
              if (aMatch && !bMatch) return -1;
              if (!aMatch && bMatch) return 1;
              return (a.distance || 0) - (b.distance || 0);
            });
          }

          setShops(shopsWithDistance);
        } else {
          setShops([]);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [filterBy, selectedCategory, selectedPincode, searchQuery, location.latitude, location.longitude, location.city]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilterBy('search');
  };

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Find Shops</h3>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setFilterBy('category')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filterBy === 'category'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Category
          </button>
          <button
            onClick={() => setFilterBy('pincode')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filterBy === 'pincode'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pincode
          </button>
          <button
            onClick={() => setFilterBy('search')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filterBy === 'search'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Search
          </button>
        </div>

        {/* Category Filter */}
        {filterBy === 'category' && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.displayName}
              </option>
            ))}
          </select>
        )}

        {/* Pincode Filter */}
        {filterBy === 'pincode' && (
          <div className="flex gap-2">
            <select
              value={selectedPincode}
              onChange={(e) => setSelectedPincode(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Pincode</option>
              {pincodes.map((pincode) => (
                <option key={pincode} value={pincode}>
                  {pincode}
                </option>
              ))}
            </select>
            {selectedPincode && (
              <button
                onClick={() => setSelectedPincode('')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Search Input */}
        {filterBy === 'search' && (
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shop name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        )}

      </div>

      {/* Shops List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : shops.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p>No shops found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shops.map((shop) => {
              const shopId = shop._id || shop.id || '';
              const shopName = shop.shopName || shop.name || 'Shop';
              return (
              <div
                key={shopId || Math.random()}
                onClick={() => shopId && onShopClick?.(shopId)}
                className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200 hover:border-blue-300"
              >
                {/* Shop Image */}
                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                  {(shop.photoUrl || shop.imageUrl) ? (
                    <Image
                      src={shop.photoUrl || shop.imageUrl || ''}
                      alt={shop.shopName || shop.name || 'Shop'}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-400">
                      <span className="text-white font-bold text-lg">
                        {(() => {
                          const name = shop.shopName || shop.name || 'S';
                          return (name && name.length > 0 ? name.charAt(0) : 'S').toUpperCase();
                        })()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Shop Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{shop.shopName || shop.name || 'Shop'}</h4>
                  <p className="text-sm text-gray-600 truncate">{shop.ownerName || ''}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {shop.distance !== undefined && (
                      <span className="text-xs text-blue-600 font-medium">
                        {(shop.distance || 0).toFixed(1)} km
                      </span>
                    )}
                    {shop.planType && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {shop.planType}
                      </span>
                    )}
                    {shop.visitorCount !== undefined && (
                      <span className="text-xs text-gray-500">
                        👁️ {shop.visitorCount}
                      </span>
                    )}
                  </div>
                  {(shop.area || shop.city) && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      📍 {shop.area || shop.city}
                    </p>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

