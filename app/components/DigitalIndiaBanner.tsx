'use client';

import { useState, useEffect } from 'react';

// 20 Text Effects
const textEffects = [
  { name: 'glow', class: 'text-shadow-glow' },
  { name: 'gradient', class: 'text-gradient-rainbow' },
  { name: 'shadow', class: 'text-shadow-3d' },
  { name: 'outline', class: 'text-outline' },
  { name: '3d', class: 'text-3d' },
  { name: 'neon', class: 'text-neon' },
  { name: 'rainbow', class: 'text-rainbow' },
  { name: 'metallic', class: 'text-metallic' },
  { name: 'glass', class: 'text-glass' },
  { name: 'emboss', class: 'text-emboss' },
  { name: 'anaglyph', class: 'text-anaglyph' },
  { name: 'retro', class: 'text-retro' },
  { name: 'holographic', class: 'text-holographic' },
  { name: 'fire', class: 'text-fire' },
  { name: 'ice', class: 'text-ice' },
  { name: 'electric', class: 'text-electric' },
  { name: 'gold', class: 'text-gold' },
  { name: 'silver', class: 'text-silver' },
  { name: 'chrome', class: 'text-chrome' },
  { name: 'diamond', class: 'text-diamond' },
];

// 20 Animations
const animations = [
  { name: 'fade', class: 'animate-fade-in-out' },
  { name: 'slide', class: 'animate-slide-in-out' },
  { name: 'bounce', class: 'animate-bounce' },
  { name: 'pulse', class: 'animate-pulse' },
  { name: 'shake', class: 'animate-shake' },
  { name: 'rotate', class: 'animate-rotate-slow' },
  { name: 'scale', class: 'animate-scale-pulse' },
  { name: 'wobble', class: 'animate-wobble' },
  { name: 'flip', class: 'animate-flip' },
  { name: 'zoom', class: 'animate-zoom-in-out' },
  { name: 'glow-pulse', class: 'animate-glow-pulse' },
  { name: 'wave', class: 'animate-wave' },
  { name: 'float', class: 'animate-float' },
  { name: 'spin', class: 'animate-spin-slow' },
  { name: 'shimmer', class: 'animate-shimmer' },
  { name: 'gradient-shift', class: 'animate-gradient-shift' },
  { name: 'typewriter', class: 'animate-typewriter' },
  { name: 'glitch', class: 'animate-glitch' },
  { name: 'morph', class: 'animate-morph' },
  { name: 'elastic', class: 'animate-elastic' },
];

export default function DigitalIndiaBanner() {
  const [currentEffectIndex, setCurrentEffectIndex] = useState(0);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [backgroundEffect, setBackgroundEffect] = useState(0);

  // Auto-rotate effects every 3 seconds
  useEffect(() => {
    const effectInterval = setInterval(() => {
      setCurrentEffectIndex((prev) => (prev + 1) % textEffects.length);
    }, 3000);

    return () => clearInterval(effectInterval);
  }, []);

  // Auto-rotate animations every 4 seconds
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setCurrentAnimationIndex((prev) => (prev + 1) % animations.length);
    }, 4000);

    return () => clearInterval(animationInterval);
  }, []);

  // Auto-rotate background effects every 5 seconds
  useEffect(() => {
    const bgInterval = setInterval(() => {
      setBackgroundEffect((prev) => (prev + 1) % 10);
    }, 5000);

    return () => clearInterval(bgInterval);
  }, []);

  const currentEffect = textEffects[currentEffectIndex];
  const currentAnimation = animations[currentAnimationIndex];

  const getBackgroundStyle = () => {
    const styles = [
      'bg-gradient-to-r from-orange-500 via-white to-green-500',
      'bg-gradient-to-r from-orange-400 via-yellow-100 to-green-400',
      'bg-gradient-to-br from-orange-600 via-white to-green-600',
      'bg-gradient-to-l from-green-500 via-white to-orange-500',
      'bg-gradient-to-r from-orange-500 via-amber-50 to-green-500',
      'bg-gradient-to-r from-orange-600 via-white to-green-600',
      'bg-gradient-to-br from-orange-400 via-yellow-50 to-green-400',
      'bg-gradient-to-t from-orange-500 via-white to-green-500',
      'bg-gradient-to-bl from-orange-500 via-white to-green-500',
      'bg-gradient-to-tr from-orange-600 via-yellow-100 to-green-600',
    ];
    return styles[backgroundEffect];
  };

  return (
    <div className={`w-full ${getBackgroundStyle()} py-2 sm:py-3 shadow-md border-b-2 border-gray-300 relative overflow-hidden transition-all duration-1000`}>
      {/* Animated background patterns */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent_50%)] animate-pulse"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-400 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          {/* Hindi Text */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <h1 className={`text-lg sm:text-xl md:text-2xl font-bold ${currentEffect.class} ${currentAnimation.class} transition-all duration-500`}>
              डिजिटल इंडिया
            </h1>
            <span className="hidden sm:inline text-gray-600 font-bold animate-pulse">|</span>
            <p className={`text-sm sm:text-base md:text-lg font-semibold ${currentEffect.class} ${currentAnimation.class} transition-all duration-500`} style={{ animationDelay: '0.2s' }}>
              पावर टू एम्पावर
            </p>
          </div>
          
          {/* English Text */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline text-gray-600 font-bold animate-pulse">|</span>
            <h2 className={`text-base sm:text-lg md:text-xl font-bold ${currentEffect.class} ${currentAnimation.class} transition-all duration-500`} style={{ animationDelay: '0.4s' }}>
              Power to Empower
            </h2>
            <span className="hidden sm:inline text-gray-600 font-bold animate-pulse">|</span>
            <p className={`text-xs sm:text-sm md:text-base font-medium italic ${currentEffect.class} ${currentAnimation.class} transition-all duration-500`} style={{ animationDelay: '0.6s' }}>
              Empowering India Digitally
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
