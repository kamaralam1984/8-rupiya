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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Bottom Sheet Modal - Half Page */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out h-[50vh] flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
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
            <div className="space-y-4 pb-4">
              {/* Shop Image */}
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 -mx-4">
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

              {/* Shop Name */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {shop.shopName}
                </h2>
                {shop.category && (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {shop.category}
                  </span>
                )}
              </div>

              {/* Full Address */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Full Address</p>
                    <p className="text-gray-900 leading-relaxed">{getFullAddress()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Call Button */}
                {(shop.mobile || shop.phone) && (
                  <button
                    onClick={handleCall}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-md"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Call</span>
                  </button>
                )}

                {/* WhatsApp Button */}
                {(shop.whatsappNumber || shop.mobile || shop.phone) && (
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#20BA5A] transition-colors shadow-md"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>WhatsApp</span>
                  </button>
                )}

                {/* Google Maps Button */}
                {(shop.latitude || shop.fullAddress || shop.address) && (
                  <button
                    onClick={handleGoogleMaps}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md col-span-2"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>View on Google Maps</span>
                  </button>
                )}
              </div>

              {/* Share Shop Button */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share Shop</span>
                </button>
              </div>

              {/* Location Info */}
              {shop.latitude && shop.longitude && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold mb-1">📍 Location Coordinates</p>
                  <p className="text-sm text-blue-900">
                    {shop.latitude.toFixed(6)}, {shop.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          )}
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

