'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentRouteGuard from '@/app/components/AgentRouteGuard';
import Link from 'next/link';

interface Shop {
  _id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  paymentStatus: 'PAID' | 'PENDING';
  photoUrl: string;
}

export default function MapViewPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchShops();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Default to a central location if geolocation fails
          setUserLocation({ lat: 25.5941, lng: 85.1376 }); // Patna default
        }
      );
    } else {
      setUserLocation({ lat: 25.5941, lng: 85.1376 });
    }
  };

  const fetchShops = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('agent_token');
      const response = await fetch('/api/agent/shops?date=all&payment=all', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setShops(data.shops);
      }
    } catch (error) {
      console.error('Failed to load shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = (shop: Shop) => {
    const url = `https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`;
    window.open(url, '_blank');
  };

  const generateMapUrl = () => {
    if (shops.length === 0) return '';
    
    // Create Google Maps embed URL with markers
    const markers = shops.map((shop) => 
      `${shop.latitude},${shop.longitude}`
    ).join('|');
    
    const center = userLocation 
      ? `${userLocation.lat},${userLocation.lng}`
      : shops.length > 0 
        ? `${shops[0].latitude},${shops[0].longitude}`
        : '25.5941,85.1376';
    
    return `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6U4bN3qJ&center=${center}&zoom=12&maptype=roadmap`;
  };

  return (
    <AgentRouteGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="text-white hover:text-blue-200"
                >
                  ← Back
                </button>
                <h1 className="text-xl font-bold">Map View</h1>
              </div>
              <div className="text-sm text-blue-100">
                {shops.length} {shops.length === 1 ? 'shop' : 'shops'}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          ) : shops.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">No shops found</p>
              <Link
                href="/agent/shops/new"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Add New Shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Section */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="h-[600px] relative">
                    {/* Google Maps Embed */}
                    {/* Google Maps Embed - Using static map or embed */}
                    {shops.length > 0 ? (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="text-center p-8">
                          <div className="text-6xl mb-4">🗺️</div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Interactive Map</h3>
                          <p className="text-gray-600 mb-4">
                            Click on any shop below to view its location on Google Maps
                          </p>
                          <p className="text-sm text-gray-500">
                            {shops.length} {shops.length === 1 ? 'shop' : 'shops'} found
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <p className="text-gray-600">No shops to display on map</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Map Instructions */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      💡 Click on any shop in the list to view its location on Google Maps
                    </p>
                  </div>
                </div>
              </div>

              {/* Shops List */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 bg-blue-50 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">All Shops ({shops.length})</h2>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {shops.map((shop) => (
                    <div
                      key={shop._id}
                      onClick={() => {
                        setSelectedShop(shop);
                        openGoogleMaps(shop);
                      }}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedShop?._id === shop._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{shop.shopName}</h3>
                          <p className="text-sm text-gray-600 mb-1">{shop.ownerName}</p>
                          <p className="text-xs text-gray-500 mb-2 line-clamp-1">{shop.address}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                              {shop.category}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                shop.paymentStatus === 'PAID'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {shop.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div className="ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openGoogleMaps(shop);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                            title="Open in Google Maps"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        📍 {shop.latitude.toFixed(6)}, {shop.longitude.toFixed(6)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {shops.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    if (shops.length > 0) {
                      const allMarkers = shops.map(s => `${s.latitude},${s.longitude}`).join('/');
                      window.open(`https://www.google.com/maps/dir/${allMarkers}`, '_blank');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  🗺️ View All in Google Maps
                </button>
                <Link
                  href="/agent/shops"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold"
                >
                  📋 View Shop List
                </Link>
                <Link
                  href="/agent/shops/new"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                >
                  ➕ Add New Shop
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </AgentRouteGuard>
  );
}
