'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, MapPin, Phone, Mail, Globe, Eye } from 'lucide-react';

interface ShopDetails {
  _id: string;
  shopName: string;
  ownerName: string;
  category: string;
  mobile?: string;
  email?: string;
  area?: string;
  fullAddress: string;
  city?: string;
  pincode?: string;
  district?: string;
  latitude: number;
  longitude: number;
  photoUrl: string;
  iconUrl?: string;
  shopUrl?: string;
  website?: string;
  visitorCount: number;
  planType: string;
  paymentStatus: string;
  createdAt: string;
  whatsappNumber?: string;
  additionalPhotos?: string[];
  shopLogo?: string;
  offers?: Array<{ title: string; description: string; validTill: string }>;
}

interface ShopDetailsModalProps {
  shopId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShopDetailsModal({ shopId, isOpen, onClose }: ShopDetailsModalProps) {
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && shopId) {
      fetchShopDetails();
    } else {
      setShop(null);
      setError(null);
    }
  }, [isOpen, shopId]);

  const fetchShopDetails = async () => {
    if (!shopId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching shop details for ID:', shopId);
      const response = await fetch(`/api/shops/${shopId}`);
      const data = await response.json();
      
      console.log('Shop details response:', data);
      
      if (data.success && data.shop) {
        // Transform old model format if needed
        const shopData = data.shop;
        if (shopData.isOldModel) {
          // Map old model fields to new format
          shopData.shopName = shopData.shopName || shopData.name;
          shopData.photoUrl = shopData.photoUrl || shopData.imageUrl;
          shopData.iconUrl = shopData.iconUrl || shopData.imageUrl;
          shopData.fullAddress = shopData.fullAddress || shopData.address;
        }
        setShop(shopData);
      } else {
        setError(data.error || 'Shop details not found');
      }
    } catch (err) {
      console.error('Error fetching shop details:', err);
      setError('Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const googleMapsUrl = shop
    ? `https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`
    : '#';

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] sm:w-[85vw] md:w-[75vw] lg:w-[60vw] xl:w-[50vw] h-[80vh] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Shop Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {shop && !loading && (
            <div className="space-y-4">
              {/* 1. Shop Image - Full Page Image */}
              <div className="w-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center p-2">
                <div className="w-full flex justify-center">
                  <img
                    src={shop.photoUrl || shop.iconUrl || '/placeholder-shop.jpg'}
                    alt={shop.shopName}
                    className="max-w-full h-auto object-contain rounded-xl"
                    style={{ maxHeight: '70vh' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-shop.jpg';
                    }}
                  />
                </div>
              </div>

              {/* 2. Shop Name, Category, Mobile (one line) */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex-shrink-0">
                  {shop.shopName}
                </h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {shop.category}
                </span>
                {shop.mobile && (
                  <a
                    href={`tel:${shop.mobile}`}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-semibold text-gray-900"
                  >
                    <Phone className="w-4 h-4 text-blue-600" />
                    {shop.mobile}
                  </a>
                )}
              </div>

              {/* 3. WhatsApp (if available), Email (if available) - one line */}
              {(shop.whatsappNumber || shop.email) && (
                <div className="flex items-center gap-3 flex-wrap">
                  {shop.whatsappNumber && (
                    <a
                      href={`https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-semibold text-gray-900"
                    >
                      <Phone className="w-4 h-4 text-green-600" />
                      WhatsApp: {shop.whatsappNumber}
                    </a>
                  )}
                  {shop.email && (
                    <a
                      href={`mailto:${shop.email}`}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-semibold text-gray-900 truncate max-w-full"
                    >
                      <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{shop.email}</span>
                    </a>
                  )}
                </div>
              )}

              {/* 4. Website (if available), Address with Google Maps - one line */}
              <div className="flex items-center gap-3 flex-wrap">
                {shop.website && (
                  <a
                    href={shop.website.startsWith('http') ? shop.website : `https://${shop.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-semibold text-gray-900 truncate max-w-full"
                  >
                    <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="truncate">
                      {shop.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </span>
                  </a>
                )}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  <MapPin className="w-4 h-4" />
                  {shop.fullAddress || (shop.area && shop.city ? `${shop.area}, ${shop.city}` : 'View on Maps')}
                </a>
              </div>

              {/* 5. Offers (if available), Visitors count - one line */}
              <div className="flex items-start gap-4 flex-wrap pt-4 border-t border-gray-200">
                {shop.offers && shop.offers.length > 0 && (
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Offers</h3>
                    <div className="space-y-2">
                      {shop.offers.slice(0, 2).map((offer, index) => (
                        <div key={index} className="p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded text-xs">
                          <h4 className="font-bold text-gray-900">{offer.title}</h4>
                          <p className="text-gray-700">{offer.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-lg font-bold text-gray-900">{shop.visitorCount || 0}</p>
                    <p className="text-xs text-gray-600">Visitors</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

