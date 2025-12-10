'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface HeroBannerData {
  bannerId: string;
  imageUrl: string;
  alt: string;
  link: string;
  title?: string;
  ctaText?: string;
  advertiser?: string;
  distance?: number;
  isBusiness?: boolean;
  userLat?: number | null;
  userLng?: number | null;
  lat?: number;
  lng?: number;
  area?: string;
  city?: string;
  visitorCount?: number;
  // New fields for effects and animations
  textEffect?: string;
  animation?: string;
  animationDuration?: number;
  animationDelay?: number;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  titleColor?: string;
  subtitleColor?: string;
  backgroundEffect?: string;
  overlayColor?: string;
  overlayOpacity?: number;
}

interface HeroBannerProps {
  hero?: HeroBannerData;
  onBannerClick: (bannerId: string, section: 'hero', position: number, link: string) => void;
  height?: string;
  category?: string;
}

export default function HeroBanner({ hero, onBannerClick, height = 'h-[480px]', category }: HeroBannerProps) {
  const pathname = usePathname();
  const [heroBanner, setHeroBanner] = useState<HeroBannerData | null>(hero || null);

  // Fetch hero banner from API if not provided
  useEffect(() => {
    if (hero) {
      setHeroBanner(hero);
      return;
    }

    const fetchHeroBanner = async () => {
      try {
        const params = new URLSearchParams({
          pageUrl: pathname || '/',
        });
        if (category) {
          params.append('category', category);
        }

        const res = await fetch(`/api/hero-banners?${params.toString()}`);
        const data = await res.json();
        
        if (data.success && data.heroBanners && data.heroBanners.length > 0) {
          const banner = data.heroBanners[0];
          setHeroBanner({
            bannerId: banner._id,
            imageUrl: banner.imageUrl,
            alt: banner.alt,
            link: banner.linkUrl || '#',
            title: banner.title,
            textEffect: banner.textEffect,
            animation: banner.animation,
            animationDuration: banner.animationDuration,
            animationDelay: banner.animationDelay,
            showTitle: banner.showTitle,
            showSubtitle: banner.showSubtitle,
            subtitle: banner.subtitle,
            titleColor: banner.titleColor,
            subtitleColor: banner.subtitleColor,
            backgroundEffect: banner.backgroundEffect,
            overlayColor: banner.overlayColor,
            overlayOpacity: banner.overlayOpacity,
          });
        }
      } catch (error) {
        console.error('Error fetching hero banner:', error);
      }
    };

    fetchHeroBanner();
  }, [pathname, category, hero]);

  const getAnimationClass = () => {
    if (!heroBanner?.animation || heroBanner.animation === 'none') return '';
    
    const animationMap: Record<string, string> = {
      'fade': 'animate-fade-in-out',
      'slide': 'animate-slide-in-out',
      'bounce': 'animate-bounce',
      'pulse': 'animate-pulse',
      'shake': 'animate-shake',
      'rotate': 'animate-rotate-slow',
      'scale': 'animate-scale-pulse',
      'wobble': 'animate-wobble',
      'flip': 'animate-flip',
      'zoom': 'animate-zoom-in-out',
      'glow-pulse': 'animate-glow-pulse',
      'wave': 'animate-wave',
      'float': 'animate-float',
      'spin': 'animate-spin-slow',
      'shimmer': 'animate-shimmer',
      'gradient-shift': 'animate-gradient-shift',
      'typewriter': 'animate-typewriter',
      'glitch': 'animate-glitch',
      'morph': 'animate-morph',
      'elastic': 'animate-elastic',
    };
    
    return animationMap[heroBanner.animation] || '';
  };

  const getTextEffectClass = () => {
    if (!heroBanner?.textEffect || heroBanner.textEffect === 'none') return '';
    
    const effectMap: Record<string, string> = {
      'glow': 'text-shadow-glow',
      'gradient': 'text-gradient-rainbow',
      'shadow': 'text-shadow-3d',
      'outline': 'text-outline',
      '3d': 'text-3d',
      'neon': 'text-neon',
      'rainbow': 'text-rainbow',
      'metallic': 'text-metallic',
      'glass': 'text-glass',
      'emboss': 'text-emboss',
      'anaglyph': 'text-anaglyph',
      'retro': 'text-retro',
      'holographic': 'text-holographic',
      'fire': 'text-fire',
      'ice': 'text-ice',
      'electric': 'text-electric',
      'gold': 'text-gold',
      'silver': 'text-silver',
      'chrome': 'text-chrome',
      'diamond': 'text-diamond',
    };
    
    return effectMap[heroBanner.textEffect] || '';
  };

  if (!heroBanner) {
    return (
      <div className={`w-full ${height} bg-linear-to-br from-gray-100 to-gray-200 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300`}>
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-600 font-medium mb-2">No hero banner</p>
        <button
          onClick={() => window.location.href = '/advertise'}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Advertise Here
        </button>
      </div>
    );
  }

  const ctaLabel = heroBanner.title || heroBanner.advertiser || 'View offer';
  const animationClass = getAnimationClass();
  const textEffectClass = getTextEffectClass();
  
  const overlayStyle = heroBanner.backgroundEffect === 'overlay' && heroBanner.overlayColor
    ? {
        backgroundColor: heroBanner.overlayColor,
        opacity: heroBanner.overlayOpacity || 0.3,
      }
    : {};

  const animationStyle: React.CSSProperties = {
    animationDuration: heroBanner.animationDuration ? `${heroBanner.animationDuration}s` : '2s',
    animationDelay: heroBanner.animationDelay ? `${heroBanner.animationDelay}s` : '0s',
  };

  // If it's a shop (isBusiness), show ONLY shop image (no text, no details)
  if (heroBanner.isBusiness) {
    return (
      <Link
        href={heroBanner.link}
        onClick={(e) => {
          if (heroBanner.link === '#') {
            e.preventDefault();
          }
          onBannerClick(heroBanner.bannerId, 'hero', 0, heroBanner.link);
        }}
        className={`relative w-full ${height} rounded-xl overflow-hidden shadow-lg border-2 border-blue-300 hover:border-blue-500 group transition-all duration-300 hover:scale-[1.02]`}
        aria-label={`Shop: ${heroBanner.title || heroBanner.advertiser}`}
      >
        {/* Shop Image Only - No Text, No Details */}
        {heroBanner.imageUrl ? (
          <Image
            src={heroBanner.imageUrl}
            alt={heroBanner.title || heroBanner.advertiser || 'Shop'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </Link>
    );
  }

  // Fallback to image banner if not a shop
  return (
    <div 
      className={`relative w-full ${height} rounded-xl overflow-hidden shadow-lg border border-gray-200 group ${animationClass}`}
      style={animationStyle}
    >
      <Link
        href={heroBanner.link}
        onClick={(e) => {
          if (heroBanner.link === '#') {
            e.preventDefault();
          }
          onBannerClick(heroBanner.bannerId, 'hero', 0, heroBanner.link);
        }}
        className="absolute inset-0 z-10"
        aria-label={`Open hero banner: ${ctaLabel}`}
      >
        <span className="sr-only">{heroBanner.ctaText || 'View Details'}</span>
      </Link>
      
      <Image
        src={heroBanner.imageUrl}
        alt={heroBanner.alt}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        priority
        sizes="(max-width: 1024px) 100vw, 60vw"
      />
      
      {/* Overlay */}
      {heroBanner.backgroundEffect === 'overlay' ? (
        <div className="absolute inset-0" style={overlayStyle} />
      ) : (
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
      )}
      
      {/* Title and Subtitle Overlay */}
      {(heroBanner.showTitle || heroBanner.showSubtitle) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20">
          {heroBanner.showTitle && heroBanner.title && (
            <h2 
              className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 ${textEffectClass}`}
              style={{ color: heroBanner.titleColor || '#ffffff' }}
            >
              {heroBanner.title}
            </h2>
          )}
          {heroBanner.showSubtitle && heroBanner.subtitle && (
            <p 
              className={`text-sm sm:text-base md:text-lg ${textEffectClass}`}
              style={{ color: heroBanner.subtitleColor || '#ffffff' }}
            >
              {heroBanner.subtitle}
            </p>
          )}
        </div>
      )}
      
      {/* Distance, Time, and Visitor Count Badge */}
      {(heroBanner.distance !== undefined || heroBanner.isBusiness || heroBanner.visitorCount !== undefined) && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
          <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-lg border border-white/50 flex flex-col gap-1.5">
            {heroBanner.distance !== undefined && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-bold text-gray-900">
                  {heroBanner.distance ? `${heroBanner.distance.toFixed(1)} km` : 'Nearby'}
                </span>
              </div>
            )}
            {heroBanner.distance && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold text-gray-900">
                  {Math.round(heroBanner.distance * 1.5)} min
                </span>
              </div>
            )}
            {heroBanner.visitorCount !== undefined && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm font-bold text-gray-900">
                  {heroBanner.visitorCount || 0} visitors
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
