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
  heroShops?: HeroBannerData[]; // Multiple hero shops for rotation
  onBannerClick: (bannerId: string, section: 'hero', position: number, link: string) => void;
  height?: string;
  category?: string;
  rotationInterval?: number; // Rotation interval in milliseconds (default: 10000 = 10 seconds)
}

export default function HeroBanner({ hero, heroShops, onBannerClick, height = 'h-[480px]', category, rotationInterval = 10000 }: HeroBannerProps) {
  const pathname = usePathname();
  const [heroBanner, setHeroBanner] = useState<HeroBannerData | null>(hero || null);
  const [currentShopIndex, setCurrentShopIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Animation effects array for different transitions
  const animationEffects = [
    'fade',
    'slide',
    'zoom',
    'scale',
    'flip',
    'shimmer',
    'glow-pulse',
    'gradient-shift',
  ];
  
  // Glow background colors for different shops
  const glowColors = [
    'hero-glow-blue',
    'hero-glow-purple',
    'hero-glow-pink',
    'hero-glow-cyan',
    'hero-glow-green',
    'hero-glow-orange',
    'hero-glow-red',
    'hero-glow-yellow',
  ];

  // Auto-rotate hero shops if multiple shops provided
  useEffect(() => {
    if (heroShops && heroShops.length > 1) {
      const interval = setInterval(() => {
        setIsTransitioning(true);
        
        // Wait for transition animation to start
        setTimeout(() => {
          setCurrentShopIndex((prev) => {
            const nextIndex = (prev + 1) % heroShops.length;
            setHeroBanner(heroShops[nextIndex]);
            return nextIndex;
          });
          
          // Reset transition after animation completes
          setTimeout(() => {
            setIsTransitioning(false);
          }, 500); // Half second for transition
        }, 100);
      }, rotationInterval);

      return () => clearInterval(interval);
    } else if (hero) {
      setHeroBanner(hero);
    }
  }, [heroShops, hero, rotationInterval]);

  // Initialize with first shop if heroShops provided
  useEffect(() => {
    if (heroShops && heroShops.length > 0) {
      if (!heroBanner || heroBanner.bannerId !== heroShops[0].bannerId) {
        setHeroBanner(heroShops[0]);
        setCurrentShopIndex(0);
      }
    } else if (hero && !heroBanner) {
      setHeroBanner(hero);
    }
  }, [heroShops, hero]);

  // Fetch hero banner from API if not provided
  useEffect(() => {
    if (hero || heroShops) {
      return; // Don't fetch if hero or heroShops are provided
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
    // Return null if no hero banner - don't show placeholder
    return null;
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

  // Get current animation effect based on shop index
  const getCurrentAnimation = () => {
    if (!heroShops || heroShops.length <= 1) return 'fade-in';
    const effectIndex = currentShopIndex % animationEffects.length;
    const effect = animationEffects[effectIndex];
    
    // Map animation names to CSS classes
    const animationMap: Record<string, string> = {
      'fade': 'animate-fade-in',
      'slide': 'animate-slide-in-right',
      'zoom': 'animate-zoom-in',
      'scale': 'animate-scale-in',
      'flip': 'animate-flip-in',
      'shimmer': 'animate-shimmer',
      'glow-pulse': 'animate-glow-pulse',
      'gradient-shift': 'animate-gradient-shift',
    };
    
    return animationMap[effect] || 'animate-fade-in';
  };
  
  // Get current glow background color based on shop index
  const getCurrentGlowColor = () => {
    if (!heroShops || heroShops.length <= 1) return 'hero-glow-blue';
    const glowIndex = currentShopIndex % glowColors.length;
    return glowColors[glowIndex];
  };

  // If it's a shop (isBusiness), show modern animated style with glow background
  if (heroBanner.isBusiness) {
    const currentAnimation = getCurrentAnimation();
    const currentGlow = getCurrentGlowColor();
    const transitionClass = isTransitioning 
      ? 'opacity-0 scale-95' 
      : `${currentAnimation} opacity-100 scale-100`;
    
    return (
      <Link
        href={heroBanner.link}
        onClick={(e) => {
          if (heroBanner.link === '#') {
            e.preventDefault();
          }
          onBannerClick(heroBanner.bannerId, 'hero', currentShopIndex, heroBanner.link);
        }}
        className={`relative w-full ${height} rounded-xl overflow-hidden shadow-2xl border-2 border-white/30 hover:border-white/60 group transition-all duration-500 ${transitionClass}`}
        aria-label={`Shop: ${heroBanner.title || heroBanner.advertiser}`}
        style={{ position: 'relative' }}
      >
        {/* Modern Glow Background - Light Color Animated */}
        <div className={`absolute inset-0 ${currentGlow} rounded-xl z-0`} />
        
        {/* Shop Image */}
        {heroBanner.imageUrl ? (
          <>
            {/* Main Image */}
            <Image
              src={heroBanner.imageUrl}
              alt={heroBanner.title || heroBanner.advertiser || 'Shop'}
              fill
              className="object-contain sm:object-cover md:object-cover group-hover:scale-110 transition-transform duration-700 rounded-xl"
              priority={currentShopIndex === 0}
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            
            {/* Image Overlay for better visibility - Very light on mobile, no blur */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent sm:from-black/70 sm:via-black/30 sm:to-black/20 z-[12] rounded-xl" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center z-10">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Modern Shop Info Overlay - Enhanced Visibility - Lighter on mobile, no blur */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent sm:from-black/95 sm:via-black/70 p-2 sm:p-4 md:p-6 z-20">
          {/* Mobile: Shop Name, Distance, Area all in one line */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {/* Shop Name */}
            <h3 className="text-white text-xs sm:text-lg md:text-2xl font-bold drop-shadow-lg truncate flex-shrink min-w-0">
              {heroBanner.title || heroBanner.advertiser}
            </h3>
            {/* Distance - In same line on mobile */}
            {heroBanner.distance !== undefined && heroBanner.distance > 0 && (
              <>
                <span className="text-white/60 text-xs sm:text-sm">|</span>
                <span className="bg-red-500/80 text-white px-1 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap">
                  {heroBanner.distance.toFixed(1)}km
                </span>
              </>
            )}
            {/* Area - In same line on mobile */}
            {heroBanner.area && (
              <>
                <span className="text-white/60 text-xs sm:text-sm">|</span>
                <span className="bg-white/20 text-white px-1 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                  {heroBanner.area}
                </span>
              </>
            )}
            {/* Visitor Count - In same line on mobile */}
            {heroBanner.visitorCount !== undefined && (
              <>
                <span className="text-white/60 text-xs sm:text-sm">|</span>
                <span className="bg-blue-500/80 text-white px-1 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap">
                  {heroBanner.visitorCount} visitors
                </span>
              </>
            )}
            {/* Time - In same line on mobile (if distance exists) */}
            {heroBanner.distance !== undefined && heroBanner.distance > 0 && (() => {
              const estimatedTime = Math.round(heroBanner.distance * 1.5);
              return estimatedTime > 0 ? (
                <>
                  <span className="text-white/60 text-xs sm:text-sm">|</span>
                  <span className="bg-yellow-500/80 text-white px-1 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap">
                    {estimatedTime}min
                  </span>
                </>
              ) : null;
            })()}
          </div>
        </div>
        
        {/* Modern Rotation Indicator Dots with Glow */}
        {heroShops && heroShops.length > 1 && (
          <div className="absolute top-4 right-4 flex gap-2 z-30">
            {heroShops.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 shadow-lg ${
                  index === currentShopIndex 
                    ? 'bg-white scale-125 shadow-white/50 ring-2 ring-white/50' 
                    : 'bg-white/40 scale-100'
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Additional Modern Glow Effect on Hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-xl z-5" />
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
      
      {/* Distance, Time, Visitor - Transparent background with colored text */}
      {(heroBanner.distance !== undefined || heroBanner.isBusiness || heroBanner.visitorCount !== undefined) && (() => {
        const distance = heroBanner.distance || 0;
        const estimatedTime = distance > 0 ? Math.round(distance * 1.5) : 0;
        return (
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 md:bottom-4 md:left-4 md:right-4 z-20">
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2">
              {/* Distance - Red */}
              {distance > 0 && (
                <>
                  <span className="text-xs sm:text-sm md:text-base font-bold text-red-600 drop-shadow-lg whitespace-nowrap">
                    {distance.toFixed(1)}km
                  </span>
                  {(estimatedTime > 0 || heroBanner.visitorCount !== undefined) && (
                    <span className="text-xs sm:text-sm md:text-base text-white/60">|</span>
                  )}
                </>
              )}
              {/* Time - Yellow */}
              {estimatedTime > 0 && (
                <>
                  <span className="text-xs sm:text-sm md:text-base font-bold text-yellow-600 drop-shadow-lg whitespace-nowrap">
                    {estimatedTime}min
                  </span>
                  {heroBanner.visitorCount !== undefined && (
                    <span className="text-xs sm:text-sm md:text-base text-white/60">|</span>
                  )}
                </>
              )}
              {/* Visitor - Blue */}
              {heroBanner.visitorCount !== undefined && (
                <span className="text-xs sm:text-sm md:text-base font-bold text-blue-600 drop-shadow-lg whitespace-nowrap">
                  {heroBanner.visitorCount || 0}visitor
                </span>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
