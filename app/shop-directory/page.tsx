'use client';

import { useState, useEffect } from 'react';
import { useLocation } from '../contexts/LocationContext';
import toast from 'react-hot-toast';

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  category: string;
  area?: string;
  city?: string;
  pincode?: string;
  photoUrl: string;
  iconUrl: string;
  paymentStatus: 'PAID' | 'PENDING';
  visitorCount: number;
  latitude?: number;
  longitude?: number;
  distance?: number;
  createdAt: string;
}

/**
 * Shop Directory - Public Search Panel with Grid Viewer
 * Allows users to search, filter, and view shops
 */
export default function ShopDirectoryPage() {
  const { location } = useLocation();
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedPincode, setSelectedPincode] = useState<string>('all');
  
  // Options for filters
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [pincodes, setPincodes] = useState<string[]>([]);

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [shops, searchQuery, selectedCategory, selectedCity, selectedPincode, location]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      // Fetch all visible shops (isVisible !== false)
      let url = '/api/shops/nearby?useMongoDB=true&radiusKm=1000';
      if (location.latitude && location.longitude) {
        url += `&userLat=${location.latitude}&userLng=${location.longitude}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.shops) {
        // Filter only visible shops (isVisible !== false)
        // Map API response to Shop interface
        const visibleShops = data.shops
          .filter((shop: any) => shop.isVisible !== false)
          .map((shop: any) => ({
            _id: shop.id || shop._id,
            shopName: shop.shopName || shop.name,
            ownerName: shop.ownerName || 'N/A',
            category: shop.category || 'Uncategorized',
            area: shop.area,
            city: shop.city,
            pincode: shop.pincode,
            photoUrl: shop.photoUrl || shop.imageUrl || '/placeholder-shop.jpg',
            iconUrl: shop.iconUrl || shop.imageUrl || '/placeholder-shop.jpg',
            paymentStatus: shop.paymentStatus || 'PENDING',
            visitorCount: shop.visitorCount || 0,
            latitude: shop.latitude,
            longitude: shop.longitude,
            distance: shop.distance,
            createdAt: shop.createdAt || new Date().toISOString(),
          }));
        setShops(visibleShops);
        extractFilterOptions(visibleShops);
      } else {
        toast.error('Failed to fetch shops');
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Error loading shops');
    } finally {
      setLoading(false);
    }
  };

  const extractFilterOptions = (shopsData: Shop[]) => {
    const uniqueCategories = new Set<string>();
    const uniqueCities = new Set<string>();
    const uniquePincodes = new Set<string>();
    
    shopsData.forEach(shop => {
      // Extract categories
      if (shop.category && typeof shop.category === 'string' && shop.category.trim()) {
        uniqueCategories.add(shop.category.trim());
      }
      
      // Extract cities - only valid city strings
      if (shop.city && typeof shop.city === 'string' && shop.city.trim()) {
        uniqueCities.add(shop.city.trim());
      }
      
      // Extract pincodes - handle both string and number
      if (shop.pincode) {
        const pincodeStr = typeof shop.pincode === 'string' 
          ? shop.pincode.trim() 
          : String(shop.pincode).trim();
        if (pincodeStr) {
          uniquePincodes.add(pincodeStr);
        }
      }
    });
    
    setCategories(Array.from(uniqueCategories).sort());
    setCities(Array.from(uniqueCities).sort());
    setPincodes(Array.from(uniquePincodes).sort());
  };

  const applyFilters = () => {
    let filtered = [...shops];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shop =>
        (shop.shopName || '').toLowerCase().includes(query) ||
        (shop.ownerName || '').toLowerCase().includes(query) ||
        (shop.category || '').toLowerCase().includes(query) ||
        (shop.area || '').toLowerCase().includes(query) ||
        (shop.city || '').toLowerCase().includes(query) ||
        (shop.pincode || '').includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(shop => (shop.category || '') === selectedCategory);
    }

    // City filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter(shop => (shop.city || '') === selectedCity);
    }

    // Pincode filter
    if (selectedPincode !== 'all') {
      filtered = filtered.filter(shop => (shop.pincode || '') === selectedPincode);
    }

    // Sort by distance if available, then by visitor count
    filtered.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return (b.visitorCount || 0) - (a.visitorCount || 0);
    });

    setFilteredShops(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedPincode('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Shop Directory</h1>
          <p className="text-blue-100">Discover and explore local shops near you</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔍 Search & Filter</h2>
          
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by shop name, owner, category, area, city, pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat, idx) => (
                  <option key={`cat-${cat}-${idx}`} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Cities</option>
                {cities.map((city, idx) => (
                  <option key={`city-${city}-${idx}`} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Pincode Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <select
                value={selectedPincode}
                onChange={(e) => setSelectedPincode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Pincodes</option>
                {pincodes.map((pincode, idx) => (
                  <option key={`pincode-${pincode}-${idx}`} value={pincode}>{pincode}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {viewMode === 'grid' ? '📋 List View' : '🔲 Grid View'}
            </button>
            <div className="ml-auto text-sm text-gray-600">
              Showing <strong>{filteredShops.length}</strong> of <strong>{shops.length}</strong> shops
            </div>
          </div>
        </div>

        {/* Grid/List View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredShops.map((shop, index) => (
              <PublicShopCard key={shop._id || `shop-${index}`} shop={shop} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShops.map((shop, index) => (
                  <tr key={shop._id || `shop-${index}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={shop.photoUrl || shop.iconUrl || '/placeholder-shop.jpg'}
                        alt={shop.shopName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{shop.shopName || 'Unnamed Shop'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{shop.ownerName || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{shop.category || 'Uncategorized'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {shop.city && <span>📍 {shop.city}</span>}
                      {shop.pincode && (
                        <span className="ml-2">📮 {typeof shop.pincode === 'string' ? shop.pincode : String(shop.pincode)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {shop.distance !== undefined ? `${shop.distance.toFixed(1)} km` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredShops.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No shops found matching your filters</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Public Shop Card Component for Grid View
function PublicShopCard({ shop }: { shop: Shop }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={shop.photoUrl || shop.iconUrl || '/placeholder-shop.jpg'}
          alt={shop.shopName || 'Shop'}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 truncate">{shop.shopName || 'Unnamed Shop'}</h3>
        <p className="text-sm text-gray-600 mb-2">Owner: {shop.ownerName || 'N/A'}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
            {shop.category || 'Uncategorized'}
          </span>
        </div>

        <div className="text-xs text-gray-500 mb-3 space-y-1">
          {shop.city && <div>📍 {shop.city}</div>}
          {shop.pincode && <div>📮 {shop.pincode}</div>}
          {shop.distance !== undefined && (
            <div className="text-blue-600 font-semibold">📍 {shop.distance.toFixed(1)} km away</div>
          )}
          <div>👁️ {shop.visitorCount || 0} views</div>
        </div>

        {/* View Button */}
        <a
          href={`/shop/${shop._id}`}
          className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors"
        >
          View Shop
        </a>
      </div>
    </div>
  );
}

