'use client';

import Image from 'next/image';

interface CategoryHeroBannerData {
  bannerId: string;
  imageUrl: string;
  alt: string;
  link: string;
  title?: string;
  advertiser?: string;
  distance?: number;
  isBusiness?: boolean;
  rating?: number;
  reviews?: number;
}

interface CategoryHeroBannerProps {
  hero?: CategoryHeroBannerData;
  onBannerClick: (bannerId: string, section: 'hero', position: number, link: string) => void;
  height?: string;
}

export default function CategoryHeroBanner({ hero, onBannerClick, height = 'h-[480px]' }: CategoryHeroBannerProps) {
  if (!hero) {
    return (
      <div className={`w-full ${height} bg-linear-to-br from-gray-100 to-gray-200 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300`}>
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-600 font-medium mb-2">No business available</p>
      </div>
    );
  }

  const businessName = hero.title || hero.advertiser || hero.alt;

  return (
    <div 
      className={`relative w-full ${height} rounded-2xl overflow-hidden shadow-xl border border-gray-200 group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`} 
      onClick={() => onBannerClick(hero.bannerId, 'hero', 0, hero.link)}
    >
      <Image
        src={hero.imageUrl}
        alt={hero.alt}
        fill
        className="object-cover group-hover:scale-110 transition-transform duration-500"
        priority
        sizes="(max-width: 1024px) 100vw, 60vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      
      {/* Featured Badge - Top Left */}
      {hero.isBusiness && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-pulse">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured
          </div>
        </div>
      )}
      
      {/* Distance and Time Badge - Top Right (Hidden on mobile, shown on larger screens) */}
      {(hero.distance !== undefined || hero.isBusiness) && (
        <div className="hidden md:block absolute top-4 right-4 lg:top-5 lg:right-5 z-20">
          <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-xl border border-white/50 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-bold text-gray-900">
                {hero.distance ? `${hero.distance.toFixed(1)} km` : 'Nearby'}
              </span>
            </div>
            {hero.distance && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold text-gray-900">
                  {Math.round(hero.distance * 1.5)} min
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Business Info Overlay - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 md:p-8 lg:p-10">
        {/* Mobile: Shop name, distance, time in one line */}
        <div className="flex flex-col sm:flex-col md:flex-col gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-white text-xs sm:text-xl md:text-3xl lg:text-4xl font-bold drop-shadow-lg truncate flex-shrink">
              {businessName}
            </h2>
            {hero.distance !== undefined && hero.distance > 0 && (
              <>
                <span className="text-white/60 text-xs sm:text-sm">|</span>
                <span className="bg-red-500/80 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap">
                  {hero.distance.toFixed(1)}km
                </span>
              </>
            )}
            {hero.distance !== undefined && hero.distance > 0 && (
              <>
                <span className="text-white/60 text-xs sm:text-sm">|</span>
                <span className="bg-yellow-500/80 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap">
                  {Math.round(hero.distance * 1.5)}min
                </span>
              </>
            )}
          </div>
        
          {/* Rating and Reviews */}
          {(hero.rating || hero.reviews) && (
            <div className="flex items-center gap-3 sm:gap-4 mb-5">
              {hero.rating && (
                <div className="flex items-center gap-2 bg-white/25 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/30">
                  <span className="text-yellow-400 text-xl sm:text-2xl">★</span>
                  <span className="text-white text-lg sm:text-xl font-bold">{hero.rating.toFixed(1)}</span>
                  {hero.rating >= 4.5 && (
                    <span className="ml-1 text-xs font-semibold text-yellow-300">Top Rated</span>
                  )}
                </div>
              )}
              {hero.reviews && (
                <div className="bg-white/25 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/30">
                  <span className="text-white text-sm sm:text-base font-semibold">
                    {hero.reviews.toLocaleString()} reviews
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* CTA Button */}
          <button 
            className="bg-custom-gradient text-white px-6 py-3 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onBannerClick(hero.bannerId, 'hero', 0, hero.link);
            }}
          >
            <span>View Details</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

