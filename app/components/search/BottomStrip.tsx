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

interface BottomStripProps {
  shops: Shop[];
}

export default function BottomStrip({ shops }: BottomStripProps) {
  if (shops.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Nearby Shops</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {shops.map((shop) => {
          const shopName = shop.name || shop.shopName || 'Shop';
          const imageUrl = shop.imageUrl || shop.photoUrl || '/placeholder-shop.jpg';
          const shopLink = shop.shopUrl ? `/shop/${shop.shopUrl}` : `/contact/${shop.id}`;

          return (
            <Link
              key={shop.id}
              href={shopLink}
              className="block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative h-32 w-full">
                <Image
                  src={imageUrl}
                  alt={shopName}
                  fill
                  className="object-cover"
                />
                {shop.distance !== undefined && (
                  <div className="absolute top-1 right-1 bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    {shop.distance.toFixed(1)} km
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-900 truncate mb-1">
                  {shopName}
                </div>
                <div className="text-[10px] text-gray-600 truncate">{shop.category}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

