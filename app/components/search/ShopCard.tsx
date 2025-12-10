'use client';

import Image from 'next/image';
import Link from 'next/link';

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

interface ShopCardProps {
  shop: Shop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  const shopName = shop.name || shop.shopName || 'Shop';
  const imageUrl = shop.imageUrl || shop.photoUrl || '/placeholder-shop.jpg';
  const shopLink = shop.shopUrl ? `/shop/${shop.shopUrl}` : `/contact/${shop.id}`;

  return (
    <Link
      href={shopLink}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-48 h-48 md:h-auto">
          <Image
            src={imageUrl}
            alt={shopName}
            fill
            className="object-cover"
          />
          {shop.distance !== undefined && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
              {shop.distance.toFixed(1)} km
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{shopName}</h3>
          <p className="text-sm text-gray-600 mb-2">{shop.category}</p>
          
          {(shop.area || shop.city) && (
            <p className="text-xs text-gray-500 mb-1">
              📍 {shop.area || shop.city}
              {shop.pincode && ` - ${shop.pincode}`}
            </p>
          )}

          {shop.mobile && (
            <p className="text-xs text-blue-600 mt-2">📞 {shop.mobile}</p>
          )}

          {shop.website && (
            <p className="text-xs text-green-600 mt-1">🌐 {shop.website}</p>
          )}

          {shop.score !== undefined && (
            <div className="mt-2">
              <span className="text-xs text-gray-500">Score: </span>
              <span className="text-xs font-semibold text-blue-600">{shop.score.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}



