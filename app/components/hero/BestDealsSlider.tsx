'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BestDealsSliderProps {
  category?: string;
}

interface SliderImage {
  _id: string;
  imageUrl: string;
  alt: string;
  title?: string;
  linkUrl?: string;
  transitionEffect?: 'fade' | 'slide' | 'zoom' | 'flip' | 'cube' | 'coverflow' | 'cards' | 'creative' | 'shuffle';
  duration?: number;
}

const DEFAULT_SLIDER_IMAGES = [
  { src: '/Assets/5092428.jpg', alt: 'Shopping Sale' },
  { src: '/Assets/6874380.jpg', alt: 'Shopping Center Big Sale' },
];

export default function BestDealsSlider({ category }: BestDealsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [blur, setBlur] = useState(0);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturate, setSaturate] = useState(1);
  const [glow, setGlow] = useState(false);
  const [particles, setParticles] = useState(false);
  const [parallax, setParallax] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch slider images from API
  useEffect(() => {
    const fetchSliderImages = async () => {
      try {
        const params = new URLSearchParams({
          pageUrl: typeof window !== 'undefined' ? window.location.pathname : '/',
        });
        if (category) {
          params.append('category', category);
        }

        const res = await fetch(`/api/slider-images?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.sliderImages && data.sliderImages.length > 0) {
          setSliderImages(data.sliderImages);
        } else {
          // Fallback to default images
          setSliderImages(DEFAULT_SLIDER_IMAGES.map((img, idx) => ({
            _id: `default-${idx}`,
            imageUrl: img.src,
            alt: img.alt,
            transitionEffect: 'fade',
            duration: 5000,
          })));
        }
      } catch (error) {
        console.error('Error fetching slider images:', error);
        // Fallback to default images
        setSliderImages(DEFAULT_SLIDER_IMAGES.map((img, idx) => ({
          _id: `default-${idx}`,
          imageUrl: img.src,
          alt: img.alt,
          transitionEffect: 'fade',
          duration: 5000,
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchSliderImages();
  }, [category]);

  // Function 1: Auto-slide with configurable duration
  useEffect(() => {
    if (sliderImages.length <= 1 || isHovered || isPaused || loading) return;

    const currentDuration = sliderImages[currentIndex]?.duration || 5000;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      goToNext();
    }, currentDuration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered, isPaused, currentIndex, sliderImages, loading]);

  // Function 2: Go to specific slide
  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  // Function 3: Go to previous slide
  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setDirection('left');
    setCurrentIndex((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeout(() => setIsTransitioning(false), 600);
  }, [sliderImages.length, isTransitioning]);

  // Function 4: Go to next slide
  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setDirection('right');
    setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeout(() => setIsTransitioning(false), 600);
  }, [sliderImages.length, isTransitioning]);

  // Function 5: Pause/Resume auto-slide
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Function 6: Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, togglePause]);

  // Function 7: Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Function 8: Mouse drag support
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMoveDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const distance = dragStart - e.clientX;
    if (Math.abs(distance) > 50) {
      if (distance > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
      setIsDragging(false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Function 9: Get transition class based on effect type
  const getTransitionClass = (index: number, effect?: string) => {
    const isActive = index === currentIndex;
    const baseClass = 'absolute inset-0 transition-all duration-500';

    switch (effect) {
      case 'slide':
        return `${baseClass} ${isActive ? 'translate-x-0 opacity-100' : direction === 'right' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0'}`;
      case 'zoom':
        return `${baseClass} ${isActive ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`;
      case 'flip':
        return `${baseClass} ${isActive ? 'rotate-y-0 opacity-100' : 'rotate-y-180 opacity-0'}`;
      case 'cube':
        return `${baseClass} ${isActive ? 'rotate-y-0 opacity-100' : 'rotate-y-90 opacity-0'}`;
      case 'coverflow':
        return `${baseClass} ${isActive ? 'scale-100 z-10 opacity-100' : 'scale-75 z-0 opacity-50'}`;
      case 'cards':
        return `${baseClass} ${isActive ? 'translate-y-0 z-10 opacity-100' : 'translate-y-4 z-0 opacity-0'}`;
      case 'creative':
        return `${baseClass} ${isActive ? 'scale-100 rotate-0 opacity-100' : 'scale-90 rotate-12 opacity-0'}`;
      case 'shuffle':
        return `${baseClass} ${isActive ? 'translate-x-0 translate-y-0 opacity-100' : 'translate-x-8 translate-y-8 opacity-0'}`;
      default: // fade
        return `${baseClass} ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`;
    }
  };

  // Function 10: Hover effects
  const handleMouseEnter = () => {
    setIsHovered(true);
    setGlow(true);
    setScale(1.02);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setGlow(false);
    setScale(1);
  };

  // Function 11: Parallax effect on mouse move
  const handleMouseMoveParallax = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    setParallax(x);
  };

  // Function 12: Image preloading
  useEffect(() => {
    sliderImages.forEach((image, index) => {
      const img = new window.Image();
      img.src = image.imageUrl;
    });
  }, [sliderImages]);

  // Function 13: Progress indicator
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isHovered || isPaused || sliderImages.length <= 1) {
      setProgress(0);
      return;
    }

    const currentDuration = sliderImages[currentIndex]?.duration || 5000;
    const interval = 50; // Update every 50ms
    const increment = (100 / currentDuration) * interval;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(progressInterval);
  }, [currentIndex, isHovered, isPaused, sliderImages]);

  // Function 14: Random slide (shuffle)
  const goToRandomSlide = useCallback(() => {
    if (sliderImages.length <= 1) return;
    const randomIndex = Math.floor(Math.random() * sliderImages.length);
    if (randomIndex !== currentIndex) {
      goToSlide(randomIndex);
    }
  }, [sliderImages.length, currentIndex, goToSlide]);

  // Function 15: First slide
  const goToFirst = useCallback(() => {
    goToSlide(0);
  }, [goToSlide]);

  // Function 16: Last slide
  const goToLast = useCallback(() => {
    goToSlide(sliderImages.length - 1);
  }, [sliderImages.length, goToSlide]);

  // Function 17: Image click handler
  const handleImageClick = (image: SliderImage) => {
    if (image.linkUrl && image.linkUrl !== '#') {
      window.location.href = image.linkUrl;
    }
  };

  // Function 18: Fullscreen toggle
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!sliderRef.current) return;
    if (!document.fullscreenElement) {
      sliderRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // Function 19: Image filters on hover
  useEffect(() => {
    if (isHovered) {
      setBrightness(1.1);
      setContrast(1.05);
      setSaturate(1.1);
    } else {
      setBrightness(1);
      setContrast(1);
      setSaturate(1);
    }
  }, [isHovered]);

  // Function 20: Auto-play toggle indicator
  const getAutoPlayStatus = () => {
    if (isPaused) return 'Paused';
    if (isHovered) return 'Hovered';
    return 'Playing';
  };

  if (loading) {
    return (
      <div className="relative w-full bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 h-24 sm:h-32 md:h-36 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (sliderImages.length === 0) {
    return null;
  }

  return (
    <div
      ref={sliderRef}
      className="relative w-full bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={(e) => {
        handleMouseMoveParallax(e);
        handleMouseMoveDrag(e);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Slider Container */}
      <div className="relative w-full h-24 sm:h-32 md:h-36">
        {/* Slider Images with various effects */}
        {sliderImages.map((image, index) => {
          const isActive = index === currentIndex;
          const transitionClass = getTransitionClass(index, image.transitionEffect);
          
          return (
            <div
              key={image._id}
              ref={(el) => {
                imageRefs.current[index] = el;
              }}
              className={transitionClass}
              style={{
                transform: isActive && parallax ? `translateX(${parallax}px) scale(${scale})` : `scale(${scale})`,
                filter: isActive
                  ? `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px)`
                  : 'brightness(0.8) blur(2px)',
                boxShadow: glow && isActive ? '0 0 30px rgba(251, 191, 36, 0.5)' : 'none',
              }}
            >
              <Link href={image.linkUrl || '#'} onClick={(e) => {
                if (!image.linkUrl || image.linkUrl === '#') {
                  e.preventDefault();
                }
              }}>
                <Image
                  src={image.imageUrl}
                  alt={image.alt}
                  fill
                  className="object-cover object-center w-full cursor-pointer"
                  priority={index === 0}
                  sizes="100vw"
                />
              </Link>
              {image.title && isActive && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <h3 className="text-white text-sm font-semibold">{image.title}</h3>
                </div>
              )}
            </div>
          );
        })}

        {/* Progress Bar */}
        {sliderImages.length > 1 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-40">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-50"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Navigation Arrows with enhanced effects */}
        {sliderImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-gray-800 p-1 sm:p-1.5 rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500 group/arrow"
              aria-label="Previous slide"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover/arrow:translate-x-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-gray-800 p-1 sm:p-1.5 rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500 group/arrow"
              aria-label="Next slide"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover/arrow:translate-x-[2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Control Buttons */}
        {sliderImages.length > 1 && (
          <div className="absolute top-2 right-2 z-30 flex gap-2">
            <button
              onClick={togglePause}
              className="bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-all hover:scale-110"
              aria-label={isPaused ? 'Resume' : 'Pause'}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            <button
              onClick={toggleFullscreen}
              className="bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-all hover:scale-110"
              aria-label="Fullscreen"
              title="Fullscreen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        )}

        {/* Dots Indicator with enhanced design */}
        {sliderImages.length > 1 && (
          <div className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 z-30 flex gap-1 sm:gap-1.5">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-4 sm:w-6 shadow-lg shadow-white/50'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Slide Counter */}
        {sliderImages.length > 1 && (
          <div className="absolute top-2 left-2 z-30 bg-black/50 text-white px-2 py-1 rounded text-xs font-medium">
            {currentIndex + 1} / {sliderImages.length}
          </div>
        )}
      </div>
    </div>
  );
}
