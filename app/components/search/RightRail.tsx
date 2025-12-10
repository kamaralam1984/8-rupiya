'use client';

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

interface RightRailProps {
  shops: Shop[];
}

export default function RightRail({ shops }: RightRailProps) {
  if (shops.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sticky top-20">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Trending & Offers</h2>
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
            <div className="text-xs text-amber-600 mt-1 font-semibold">
              ⭐ Best Offers
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

