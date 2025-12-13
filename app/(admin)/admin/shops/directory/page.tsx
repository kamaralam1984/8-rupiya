'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
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
  planType: 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL' | 'BANNER' | 'HERO';
  paymentStatus: 'PAID' | 'PENDING';
  visitorCount: number;
  isVisible?: boolean; // Custom field to control visibility
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

/**
 * Shop Directory Search Panel with Grid Viewer
 * Controls which shops to show/hide with filtering and grid view
 */
export default function ShopDirectoryPage() {
  const { token } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlanType, setSelectedPlanType] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedPincode, setSelectedPincode] = useState<string>('all');
  
  // Options for filters
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [pincodes, setPincodes] = useState<string[]>([]);
  
  // Bulk operations
  const [selectedShops, setSelectedShops] = useState<Set<string>>(new Set());
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  useEffect(() => {
    if (token) {
      fetchShops();
    }
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [shops, searchQuery, selectedCategory, selectedPlanType, selectedPaymentStatus, selectedVisibility, selectedCity, selectedPincode]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/shops', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success && data.shops) {
        setShops(data.shops);
        extractFilterOptions(data.shops);
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
      if (shop.category) uniqueCategories.add(shop.category);
      if (shop.city) uniqueCities.add(shop.city);
      if (shop.pincode) uniquePincodes.add(shop.pincode);
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
        shop.shopName.toLowerCase().includes(query) ||
        shop.ownerName.toLowerCase().includes(query) ||
        shop.category.toLowerCase().includes(query) ||
        shop.area?.toLowerCase().includes(query) ||
        shop.city?.toLowerCase().includes(query) ||
        shop.pincode?.includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(shop => shop.category === selectedCategory);
    }

    // Plan type filter
    if (selectedPlanType !== 'all') {
      filtered = filtered.filter(shop => shop.planType === selectedPlanType);
    }

    // Payment status filter
    if (selectedPaymentStatus !== 'all') {
      filtered = filtered.filter(shop => shop.paymentStatus === selectedPaymentStatus);
    }

    // Visibility filter
    if (selectedVisibility !== 'all') {
      const isVisible = selectedVisibility === 'visible';
      filtered = filtered.filter(shop => shop.isVisible === isVisible);
    }

    // City filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter(shop => shop.city === selectedCity);
    }

    // Pincode filter
    if (selectedPincode !== 'all') {
      filtered = filtered.filter(shop => shop.pincode === selectedPincode);
    }

    setFilteredShops(filtered);
  };

  const toggleShopVisibility = async (shopId: string, isVisible: boolean) => {
    try {
      const response = await fetch(`/api/admin/shops/${shopId}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVisible }),
      });

      const data = await response.json();
      if (data.success) {
        setShops(shops.map(shop =>
          shop._id === shopId ? { ...shop, isVisible } : shop
        ));
        toast.success(`Shop ${isVisible ? 'shown' : 'hidden'} successfully`);
      } else {
        toast.error(data.error || 'Failed to update visibility');
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Error updating shop visibility');
    }
  };

  const bulkUpdateVisibility = async (isVisible: boolean) => {
    if (selectedShops.size === 0) {
      toast.error('Please select shops first');
      return;
    }

    try {
      setUpdatingVisibility(true);
      const response = await fetch('/api/admin/shops/bulk-visibility', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopIds: Array.from(selectedShops),
          isVisible,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShops(shops.map(shop =>
          selectedShops.has(shop._id) ? { ...shop, isVisible } : shop
        ));
        setSelectedShops(new Set());
        toast.success(`Updated visibility for ${selectedShops.size} shops`);
      } else {
        toast.error(data.error || 'Failed to update visibility');
      }
    } catch (error) {
      console.error('Error bulk updating visibility:', error);
      toast.error('Error updating shop visibility');
    } finally {
      setUpdatingVisibility(false);
    }
  };

  const toggleShopSelection = (shopId: string) => {
    const newSelected = new Set(selectedShops);
    if (newSelected.has(shopId)) {
      newSelected.delete(shopId);
    } else {
      newSelected.add(shopId);
    }
    setSelectedShops(newSelected);
  };

  const selectAll = () => {
    setSelectedShops(new Set(filteredShops.map(shop => shop._id)));
  };

  const deselectAll = () => {
    setSelectedShops(new Set());
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPlanType('all');
    setSelectedPaymentStatus('all');
    setSelectedVisibility('all');
    setSelectedCity('all');
    setSelectedPincode('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shop Directory</h1>
              <p className="text-gray-600 mt-1">Search, filter, and control shop visibility</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                {viewMode === 'grid' ? '📋 List View' : '🔲 Grid View'}
              </button>
              <button
                onClick={fetchShops}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Plan Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
              <select
                value={selectedPlanType}
                onChange={(e) => setSelectedPlanType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Plans</option>
                <option value="BASIC">BASIC</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="FEATURED">FEATURED</option>
                <option value="LEFT_BAR">LEFT_BAR</option>
                <option value="RIGHT_SIDE">RIGHT_SIDE</option>
                <option value="BOTTOM_RAIL">BOTTOM_RAIL</option>
                <option value="BANNER">BANNER</option>
                <option value="HERO">HERO</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>

            {/* Visibility Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <select
                value={selectedVisibility}
                onChange={(e) => setSelectedVisibility(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
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
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
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
                {pincodes.map(pincode => (
                  <option key={pincode} value={pincode}>{pincode}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
            {selectedShops.size > 0 && (
              <>
                <button
                  onClick={() => bulkUpdateVisibility(true)}
                  disabled={updatingVisibility}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Show Selected ({selectedShops.size})
                </button>
                <button
                  onClick={() => bulkUpdateVisibility(false)}
                  disabled={updatingVisibility}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Hide Selected ({selectedShops.size})
                </button>
                <button
                  onClick={deselectAll}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Deselect All
                </button>
              </>
            )}
            {filteredShops.length > 0 && selectedShops.size < filteredShops.length && (
              <button
                onClick={selectAll}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Select All ({filteredShops.length})
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing <strong>{filteredShops.length}</strong> of <strong>{shops.length}</strong> shops
          </div>
        </div>

        {/* Grid/List View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredShops.map(shop => (
              <ShopCard
                key={shop._id}
                shop={shop}
                isSelected={selectedShops.has(shop._id)}
                onToggleSelect={() => toggleShopSelection(shop._id)}
                onToggleVisibility={(isVisible) => toggleShopVisibility(shop._id, isVisible)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedShops.size === filteredShops.length && filteredShops.length > 0}
                      onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visibility</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShops.map(shop => (
                  <tr key={shop._id} className={selectedShops.has(shop._id) ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedShops.has(shop._id)}
                        onChange={() => toggleShopSelection(shop._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <img
                        src={shop.photoUrl || shop.iconUrl || '/placeholder-shop.jpg'}
                        alt={shop.shopName}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{shop.shopName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{shop.ownerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{shop.category}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        shop.planType === 'HERO' ? 'bg-purple-100 text-purple-800' :
                        shop.planType === 'FEATURED' ? 'bg-yellow-100 text-yellow-800' :
                        shop.planType === 'PREMIUM' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {shop.planType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        shop.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {shop.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleShopVisibility(shop._id, !shop.isVisible)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          shop.isVisible !== false
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {shop.isVisible !== false ? '✅ Visible' : '❌ Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleShopVisibility(shop._id, !shop.isVisible)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {shop.isVisible !== false ? 'Hide' : 'Show'}
                      </button>
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

// Shop Card Component for Grid View
function ShopCard({
  shop,
  isSelected,
  onToggleSelect,
  onToggleVisibility,
}: {
  shop: Shop;
  isSelected: boolean;
  onToggleSelect: () => void;
  onToggleVisibility: (isVisible: boolean) => void;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
    }`}>
      {/* Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-5 h-5 rounded border-gray-300 cursor-pointer"
        />
      </div>

      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={shop.photoUrl || shop.iconUrl || '/placeholder-shop.jpg'}
          alt={shop.shopName}
          className="w-full h-full object-cover"
        />
        {/* Visibility Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            shop.isVisible !== false
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {shop.isVisible !== false ? '👁️' : '🚫'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 truncate">{shop.shopName}</h3>
        <p className="text-sm text-gray-600 mb-2">Owner: {shop.ownerName}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
            {shop.category}
          </span>
          <span className={`px-2 py-1 text-xs rounded ${
            shop.planType === 'HERO' ? 'bg-purple-100 text-purple-800' :
            shop.planType === 'FEATURED' ? 'bg-yellow-100 text-yellow-800' :
            shop.planType === 'PREMIUM' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {shop.planType}
          </span>
          <span className={`px-2 py-1 text-xs rounded ${
            shop.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {shop.paymentStatus}
          </span>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          {shop.city && <span>📍 {shop.city}</span>}
          {shop.pincode && <span className="ml-2">📮 {shop.pincode}</span>}
          <span className="ml-2">👁️ {shop.visitorCount || 0} views</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggleVisibility(!shop.isVisible)}
            className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
              shop.isVisible !== false
                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            {shop.isVisible !== false ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
    </div>
  );
}



