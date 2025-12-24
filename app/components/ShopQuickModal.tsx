'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Phone, MapPin, Share2, Facebook, Twitter, MessageCircle, Linkedin, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShopData {
  _id: string;
  shopName: string;
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
  whatsappNumber?: string;
  website?: string;
  visitorCount?: number;
}

interface ShopQuickModalProps {
  shopId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShopQuickModal({ shopId, isOpen, onClose }: ShopQuickModalProps) {
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
      // Use cache: 'no-store' for fresh data but keep it fast
      const response = await fetch(`/api/shops/${shopId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      
      if (data.success && data.shop) {
        // Handle both old and new shop model formats
        const shopData = data.shop;
        setShop({
          _id: shopData._id || shopData.id,
          shopName: shopData.shopName || shopData.name,
          ownerName: shopData.ownerName,
          category: shopData.category,
          mobile: shopData.mobile || shopData.phone,
          phone: shopData.phone || shopData.mobile,
          fullAddress: shopData.fullAddress || shopData.address,
          address: shopData.address || shopData.fullAddress,
          area: shopData.area,
          city: shopData.city,
          pincode: shopData.pincode,
          latitude: shopData.latitude,
          longitude: shopData.longitude,
          photoUrl: shopData.photoUrl || shopData.imageUrl,
          imageUrl: shopData.imageUrl || shopData.photoUrl,
          whatsappNumber: shopData.whatsappNumber || shopData.mobile || shopData.phone,
          website: shopData.website,
          visitorCount: shopData.visitorCount,
        });
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

  const handleCall = () => {
    const phoneNumber = shop?.mobile || shop?.phone;
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  const handleWhatsApp = () => {
    const whatsapp = shop?.whatsappNumber || shop?.mobile || shop?.phone;
    if (whatsapp) {
      const cleanNumber = whatsapp.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  const handleGoogleMaps = () => {
    if (shop?.latitude && shop?.longitude) {
      window.open(`https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`, '_blank');
    } else if (shop?.fullAddress || shop?.address) {
      const address = encodeURIComponent(shop.fullAddress || shop.address || '');
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  const getShopUrl = () => {
    return `${window.location.origin}/shop/${shopId}`;
  };

  const handleCopyLink = async () => {
    try {
      const shopUrl = getShopUrl();
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async (platform: 'facebook' | 'twitter' | 'whatsapp' | 'linkedin') => {
    const shopUrl = getShopUrl();
    const shopName = shop?.shopName || 'Shop';
    const text = `Check out ${shopName} on 8 Rupiya!`;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shopUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shopUrl)}`, '_blank');
        break;
      case 'whatsapp':
        const whatsappText = `${text} ${shopUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shopUrl)}`, '_blank');
        break;
    }
  };

  const getFullAddress = () => {
    const parts = [];
    if (shop?.fullAddress) parts.push(shop.fullAddress);
    if (shop?.address) parts.push(shop.address);
    if (shop?.area) parts.push(shop.area);
    if (shop?.city) parts.push(shop.city);
    if (shop?.pincode) parts.push(shop.pincode);
    return parts.filter(Boolean).join(', ') || 'Address not available';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with Blur - Click to Close */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity cursor-pointer"
        onClick={onClose}
      />
      
      {/* Centered Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        onClick={onClose}
      >
        <div
          className={`bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-out w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden pointer-events-auto ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Close Button */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-lg font-bold text-gray-900">Shop Details</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/80 rounded-full transition-all duration-200 hover:scale-110"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {shop && !loading && (
            <div className="space-y-4">
              {/* Shop Image */}
              <div className="relative w-full h-48 md:h-56 rounded-xl overflow-hidden bg-gray-100 shadow-lg">
                <Image
                  src={shop.photoUrl || shop.imageUrl || '/placeholder-shop.jpg'}
                  alt={shop.shopName}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-shop.jpg';
                  }}
                />
              </div>

              {/* Shop Name and Category */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5">
                    {shop.shopName}
                  </h2>
                  {shop.category && (
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-xs font-semibold">
                      {shop.category}
                    </span>
                  )}
                </div>
                {shop.visitorCount !== undefined && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Visitors</p>
                    <p className="text-base font-bold text-blue-600">{shop.visitorCount}</p>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-800 mb-1">📍 Address</p>
                    <p className="text-gray-900 leading-relaxed text-xs">{getFullAddress()}</p>
                  </div>
                </div>
              </div>

              {/* Contact Number */}
              {(shop.mobile || shop.phone) && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800 mb-1">📞 Contact Number</p>
                      <p className="text-gray-900 font-semibold text-sm">
                        {shop.mobile || shop.phone}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Call and WhatsApp Buttons - Side by Side */}
              {(shop.mobile || shop.phone || shop.whatsappNumber) && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Call Button */}
                  {(shop.mobile || shop.phone) && (
                    <button
                      onClick={handleCall}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <Phone className="w-5 h-5" />
                      <span>Call Now</span>
                    </button>
                  )}

                  {/* WhatsApp Button - Always show if contact exists */}
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#20BA5A] text-white rounded-xl font-semibold text-sm hover:from-[#20BA5A] hover:to-[#1DA851] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              )}

              {/* Google Maps Button */}
              {(shop.latitude || shop.fullAddress || shop.address) && (
                <button
                  onClick={handleGoogleMaps}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <MapPin className="w-5 h-5" />
                  <span>View on Google Maps</span>
                </button>
              )}

              {/* Additional Information */}
              {(shop.ownerName || (shop.latitude && shop.longitude)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Owner Name */}
                  {shop.ownerName && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-xs text-purple-700 font-semibold mb-1">👤 Owner</p>
                      <p className="text-xs text-purple-900 font-medium">{shop.ownerName}</p>
                    </div>
                  )}

                  {/* Location Coordinates */}
                  {shop.latitude && shop.longitude && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-700 font-semibold mb-1">📍 Coordinates</p>
                      <p className="text-xs text-blue-900 font-mono">
                        {shop.latitude.toFixed(6)}, {shop.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Share Shop Button */}
              <div className="border-t border-gray-200 pt-3">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share Shop</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Share Shop Modal */}
      {isShareModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
            onClick={() => setIsShareModalOpen(false)}
          />
          
          {/* Share Modal */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Share Shop</h3>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* URL Copy Section */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shop Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getShopUrl()}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Social Media Buttons */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 mb-3">Share on Social Media</p>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* WhatsApp */}
                  <button
                    onClick={() => {
                      handleShare('whatsapp');
                      setIsShareModalOpen(false);
                    }}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#20BA5A] transition-colors shadow-md"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-sm">WhatsApp</span>
                  </button>

                  {/* Facebook */}
                  <button
                    onClick={() => {
                      handleShare('facebook');
                      setIsShareModalOpen(false);
                    }}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] text-white rounded-xl font-semibold hover:bg-[#166FE5] transition-colors shadow-md"
                  >
                    <Facebook className="w-6 h-6" />
                    <span className="text-sm">Facebook</span>
                  </button>

                  {/* Twitter */}
                  <button
                    onClick={() => {
                      handleShare('twitter');
                      setIsShareModalOpen(false);
                    }}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] text-white rounded-xl font-semibold hover:bg-[#1A91DA] transition-colors shadow-md"
                  >
                    <Twitter className="w-6 h-6" />
                    <span className="text-sm">Twitter</span>
                  </button>
                </div>

                {/* LinkedIn - Full Width */}
                <button
                  onClick={() => {
                    handleShare('linkedin');
                    setIsShareModalOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0077B5] text-white rounded-xl font-semibold hover:bg-[#006399] transition-colors shadow-md"
                >
                  <Linkedin className="w-5 h-5" />
                  <span>LinkedIn</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

