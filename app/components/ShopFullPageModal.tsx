'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, MapPin, Phone, Mail, Globe, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { calculateDistance, calculateTravelTime, formatTravelTime } from '../utils/distance';

interface ShopFullPageModalProps {
  shopId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ShopData {
  _id: string;
  shopName: string;
  ownerName?: string;
  category: string;
  mobile?: string;
  phone?: string;
  email?: string;
  area?: string;
  fullAddress?: string;
  address?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  imageUrl?: string;
  additionalPhotos?: string[];
  shopUrl?: string;
  website?: string;
  visitorCount?: number;
  rating?: number;
  reviews?: number;
  whatsappNumber?: string;
}

export default function ShopFullPageModal({ shopId, isOpen, onClose }: ShopFullPageModalProps) {
  const { location } = useLocation();
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoSlide, setAutoSlide] = useState(true);

  useEffect(() => {
    if (isOpen && shopId) {
      fetchShopDetails();
      setCurrentImageIndex(0);
    } else {
      setShop(null);
      setError(null);
      setCurrentImageIndex(0);
    }
  }, [isOpen, shopId]);

  // Track visit automatically when modal opens and shop is loaded
  useEffect(() => {
    if (isOpen && shopId && shop?._id) {
      fetch(`/api/shops/${shop._id}/visit`, { method: 'POST' })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.success && data.visitorCount !== undefined && shop) {
            setShop({ ...shop, visitorCount: data.visitorCount });
          }
        })
        .catch(error => {
          // Silently fail if tracking doesn't work - this is expected in some cases
          if (process.env.NODE_ENV === 'development') {
            console.log('Visit tracking failed (non-critical):', error.message);
          }
        });
    }
  }, [isOpen, shopId, shop?._id]);

  useEffect(() => {
    if (!isOpen || !shop || !autoSlide) return;

    const images = getAllImages();
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [isOpen, shop, autoSlide]);

  const fetchShopDetails = async () => {
    if (!shopId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shops/${shopId}`);
      const data = await response.json();
      
      if (data.success && data.shop) {
        setShop(data.shop);
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

  const getAllImages = (): string[] => {
    if (!shop) return [];
    const images: string[] = [];
    
    // Main photo
    if (shop.photoUrl || shop.imageUrl) {
      images.push(shop.photoUrl || shop.imageUrl || '');
    }
    
    // Additional photos
    if (shop.additionalPhotos && shop.additionalPhotos.length > 0) {
      images.push(...shop.additionalPhotos.filter(Boolean));
    }
    
    return images.filter(Boolean);
  };

  const images = getAllImages();
  const hasMultipleImages = images.length > 1;

  // Calculate distance and time
  const distance = shop?.latitude && shop?.longitude && location.latitude && location.longitude
    ? calculateDistance(location.latitude, location.longitude, shop.latitude, shop.longitude)
    : null;
  
  const travelTimeMinutes = distance && distance > 0 ? calculateTravelTime(distance) : 0;
  const travelTimeText = travelTimeMinutes > 0 ? formatTravelTime(travelTimeMinutes) : '';

  const googleMapsUrl = shop?.latitude && shop?.longitude
    ? `https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`
    : '#';

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
      setAutoSlide(false); // Pause auto-slide when user manually navigates
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      setAutoSlide(false); // Pause auto-slide when user manually navigates
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
    setAutoSlide(false); // Pause auto-slide when user manually navigates
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="min-h-screen w-full bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Fixed Top Right */}
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-50 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
          aria-label="Close modal"
        >
          <X className="w-6 h-6 text-gray-800" />
        </button>

        {loading && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-red-600 font-semibold text-xl mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {shop && !loading && (
          <div className="w-full">
            {/* Image Slider Section - Full Width */}
            {images.length > 0 ? (
              <div className="relative w-full h-[60vh] sm:h-[70vh] bg-black">
                {/* Main Image */}
                <div className="relative w-full h-full">
                  <Image
                    src={images[currentImageIndex]}
                    alt={`${shop.shopName} - Image ${currentImageIndex + 1}`}
                    fill
                    className="object-contain"
                    priority
                    sizes="100vw"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-shop.jpg';
                    }}
                  />
                </div>

                {/* Navigation Arrows */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>
                  </>
                )}

                {/* Image Indicators */}
                {hasMultipleImages && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          goToImage(index);
                        }}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'w-8 bg-white'
                            : 'w-2 bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Image Counter */}
                {hasMultipleImages && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 text-white rounded-lg text-sm font-semibold z-10">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full h-[60vh] sm:h-[70vh] bg-gray-200 flex items-center justify-center">
                <Image
                  src="/placeholder-shop.jpg"
                  alt="No image available"
                  width={400}
                  height={300}
                  className="object-contain"
                />
              </div>
            )}

            {/* Shop Details Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Shop Name and Category */}
              <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                  {shop.shopName}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                    {shop.category}
                  </span>
                  {/* Rating */}
                  {shop.rating && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 rounded-lg">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-bold text-gray-900">
                        {shop.rating.toFixed(1)}
                      </span>
                      {shop.reviews && (
                        <span className="text-xs text-gray-600 ml-1">
                          ({shop.reviews})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Distance, Time, Visitor - Colored */}
              {(distance || shop.visitorCount !== undefined) && (
                <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                  {/* Distance - Red */}
                  {distance && distance > 0 && (
                    <>
                      <span className="text-lg font-bold text-red-600">
                        {distance.toFixed(1)}km
                      </span>
                      {travelTimeText && <span className="text-gray-400">|</span>}
                    </>
                  )}
                  {/* Time - Yellow */}
                  {travelTimeText && (
                    <>
                      <span className="text-lg font-bold text-yellow-600">
                        {travelTimeText}
                      </span>
                      {shop.visitorCount !== undefined && <span className="text-gray-400">|</span>}
                    </>
                  )}
                  {/* Visitor - Blue */}
                  {shop.visitorCount !== undefined && (
                    <span className="text-lg font-bold text-blue-600">
                      {shop.visitorCount || 0}visitor
                    </span>
                  )}
                </div>
              )}

              {/* Contact Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Phone Number */}
                {(shop.mobile || shop.phone) && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <Phone className="w-6 h-6 text-blue-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                      <a
                        href={`tel:${shop.mobile || shop.phone}`}
                        className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {shop.mobile || shop.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Email */}
                {shop.email && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <Mail className="w-6 h-6 text-blue-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                      <a
                        href={`mailto:${shop.email}`}
                        className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors break-all"
                      >
                        {shop.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Address */}
                {(shop.fullAddress || shop.address || shop.area) && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl md:col-span-2">
                    <MapPin className="w-6 h-6 text-blue-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                      <p className="text-gray-700 text-lg">
                        {shop.fullAddress || shop.address || ''}
                        {shop.area && (
                          <span className="block mt-1 text-gray-600">
                            {shop.area}
                            {shop.city && `, ${shop.city}`}
                            {shop.pincode && ` - ${shop.pincode}`}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-6">
                {/* Google Maps Button */}
                {shop.latitude && shop.longitude && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <MapPin className="w-6 h-6" />
                    <span>View on Google Maps</span>
                  </a>
                )}

                {/* Phone Call Button */}
                {(shop.mobile || shop.phone) && (
                  <a
                    href={`tel:${shop.mobile || shop.phone}`}
                    className="flex items-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Phone className="w-6 h-6" />
                    <span>Call Now</span>
                  </a>
                )}

                {/* WhatsApp Button */}
                {shop.whatsappNumber && (
                  <a
                    href={`https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 py-4 bg-[#25D366] text-white rounded-xl font-bold text-lg hover:bg-[#20BA5A] transition-all shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                )}

                {/* Website Button */}
                {shop.website && (
                  <a
                    href={shop.website.startsWith('http') ? shop.website : `https://${shop.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 py-4 bg-gray-800 text-white rounded-xl font-bold text-lg hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Globe className="w-6 h-6" />
                    <span>Visit Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

