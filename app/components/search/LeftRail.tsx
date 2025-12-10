'use client';

import ShopCard from './ShopCard';

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

interface LeftRailProps {
  shops: Shop[];
}

export default function LeftRail({ shops }: LeftRailProps) {
  if (shops.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sticky top-20">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Recommended</h2>
      <div className="space-y-4">
        {shops.map((shop) => (
          <div key={shop.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
            <div className="text-sm font-semibold text-gray-900 mb-1">
              {shop.name || shop.shopName || 'Shop'}
            </div>
            <div className="text-xs text-gray-600 mb-1">{shop.category}</div>
            {shop.area && (
              <div className="text-xs text-gray-500">📍 {shop.area}</div>
            )}
            {shop.distance !== undefined && (
              <div className="text-xs text-blue-600 mt-1">
                {shop.distance.toFixed(1)} km away
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



