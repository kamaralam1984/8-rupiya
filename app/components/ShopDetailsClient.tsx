'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocation } from '@/app/contexts/LocationContext';
import Navbar from '@/app/components/Navbar';
import { calculateDistance } from '@/app/utils/distance';

interface ShopDetailsClientProps {
  shop: {
    id: string;
    shopName: string;
    ownerName?: string;
    category: string;
    area?: string;
    city?: string;
    pincode?: string;
    fullAddress?: string;
    mobile?: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
    latitude?: number;
    longitude?: number;
    whatsappNumber?: string;
    website?: string;
    visitorCount?: number;
  };
}

export default function ShopDetailsClient({ shop }: ShopDetailsClientProps) {
  const router = useRouter();
  const { location } = useLocation();
  
  // Calculate distance
  const distance = shop.latitude && shop.longitude && location.latitude && location.longitude
    ? calculateDistance(location.latitude, location.longitude, shop.latitude, shop.longitude)
    : null;
  
  const estimatedTime = distance ? Math.round(distance * 1.5) : null;
  const googleMapsUrl = shop.latitude && shop.longitude
    ? `https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`
    : '#';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </button>

        {/* Shop Image */}
        <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-xl mb-6">
          <Image
            src={shop.photoUrl || '/placeholder-shop.jpg'}
            alt={shop.shopName}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Km, Time, Visitor - Transparent background with colored text */}
          {(distance || estimatedTime || shop.visitorCount !== undefined) && (
            <div className="absolute top-4 right-4 px-3 py-2">
              <div className="flex flex-col gap-1.5">
                {distance && (
                  <span className="text-sm font-bold text-red-600 drop-shadow-lg">
                    {distance.toFixed(1)}km
                  </span>
                )}
                {estimatedTime && (
                  <span className="text-sm font-bold text-yellow-600 drop-shadow-lg">
                    {estimatedTime}min
                  </span>
                )}
                {shop.visitorCount !== undefined && (
                  <span className="text-sm font-bold text-blue-600 drop-shadow-lg">
                    {shop.visitorCount || 0}visitor
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Shop Info - No white background */}
        <div className="rounded-2xl p-6 sm:p-8 mb-4">
          {/* Km, Time, Visitor display below shop name */}
          {(distance || estimatedTime || shop.visitorCount !== undefined) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Distance - Red */}
              {distance && (
                <span className="text-sm font-semibold text-red-600">
                  {distance.toFixed(1)}km
                </span>
              )}
              
              {/* Separator */}
              {distance && (estimatedTime || shop.visitorCount !== undefined) && (
                <span className="text-sm text-gray-400">|</span>
              )}
              
              {/* Time - Yellow */}
              {estimatedTime && (
                <span className="text-sm font-semibold text-yellow-600">
                  {estimatedTime}min
                </span>
              )}
              
              {/* Separator */}
              {estimatedTime && shop.visitorCount !== undefined && (
                <span className="text-sm text-gray-400">|</span>
              )}
              
              {/* Visitor - Blue */}
              {shop.visitorCount !== undefined && (
                <span className="text-sm font-semibold text-blue-600">
                  {shop.visitorCount || 0}visitor
                </span>
              )}
            </div>
          )}
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{shop.shopName}</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-lg">{shop.category}</span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Address */}
            {shop.fullAddress && (
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-gray-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                  <p className="text-gray-700">{shop.fullAddress}</p>
                  <p className="text-gray-600">{shop.area || shop.city}{shop.pincode ? ` - ${shop.pincode}` : ''}</p>
                </div>
              </div>
            )}

            {/* Phone */}
            {(shop.mobile || shop.phone) && (
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-gray-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.129a11.042 11.042 0 005.516 5.516l1.129-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 19.72V23a2 2 0 01-2 2h-1C9.163 25 3 18.837 3 11V5z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                  <a href={`tel:${shop.mobile || shop.phone}`} className="text-gray-700 hover:text-amber-600 transition-colors">
                    {shop.mobile || shop.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {shop.email && (
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-gray-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <a href={`mailto:${shop.email}`} className="text-gray-700 hover:text-amber-600 transition-colors">
                    {shop.email}
                  </a>
                </div>
              </div>
            )}

            {/* Website */}
            {shop.website && (
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-gray-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Website</h3>
                  <a href={shop.website} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-amber-600 transition-colors">
                    Visit Website
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-3">
            {(shop.mobile || shop.phone) && (
              <a
                href={`tel:${shop.mobile || shop.phone}`}
                className="inline-flex items-center justify-center gap-3 bg-custom-gradient text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl hover:opacity-95 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.129a11.042 11.042 0 005.516 5.516l1.129-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 19.72V23a2 2 0 01-2 2h-1C9.163 25 3 18.837 3 11V5z" />
                </svg>
                <span>Call Now</span>
              </a>
            )}
            
            {shop.whatsappNumber && (
              <a
                href={`https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl hover:bg-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>WhatsApp</span>
              </a>
            )}

            {shop.latitude && shop.longitude && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Directions</span>
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

