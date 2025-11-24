'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Category } from '../types';
import { useLocation } from '../contexts/LocationContext';
import type { LucideIcon } from 'lucide-react';
import {
  BedDouble,
  Building,
  Building2,
  Car,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  GraduationCap,
  Grid3X3,
  Hammer,
  HeartHandshake,
  Hospital,
  KeyRound,
  Lamp,
  Package,
  PartyPopper,
  PawPrint,
  PiggyBank,
  Smile,
  Sparkles,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';

type CategoryIconTheme = {
  Icon: LucideIcon;
  bg: string;
  fg: string;
};

const iconThemes: Record<string, CategoryIconTheme> = {
  restaurants: { Icon: UtensilsCrossed, bg: 'bg-amber-50', fg: 'text-amber-600' },
  hotels: { Icon: BedDouble, bg: 'bg-sky-50', fg: 'text-sky-600' },
  'beauty-spa': { Icon: Sparkles, bg: 'bg-pink-50', fg: 'text-pink-500' },
  'home-decor': { Icon: Lamp, bg: 'bg-indigo-50', fg: 'text-indigo-600' },
  'wedding-planning': { Icon: HeartHandshake, bg: 'bg-purple-50', fg: 'text-purple-600' },
  education: { Icon: GraduationCap, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  'rent-hire': { Icon: KeyRound, bg: 'bg-teal-50', fg: 'text-teal-600' },
  hospitals: { Icon: Hospital, bg: 'bg-rose-50', fg: 'text-rose-600' },
  contractors: { Icon: Hammer, bg: 'bg-amber-50', fg: 'text-amber-700' },
  'pet-shops': { Icon: PawPrint, bg: 'bg-orange-50', fg: 'text-orange-500' },
  'pg-hostels': { Icon: Building, bg: 'bg-blue-50', fg: 'text-blue-600' },
  'estate-agent': { Icon: Building2, bg: 'bg-slate-50', fg: 'text-slate-700' },
  dentists: { Icon: Smile, bg: 'bg-blue-50', fg: 'text-blue-500' },
  gym: { Icon: Dumbbell, bg: 'bg-lime-50', fg: 'text-lime-600' },
  loans: { Icon: PiggyBank, bg: 'bg-yellow-50', fg: 'text-yellow-600' },
  'event-organisers': { Icon: PartyPopper, bg: 'bg-fuchsia-50', fg: 'text-fuchsia-600' },
  'driving-schools': { Icon: Car, bg: 'bg-sky-50', fg: 'text-sky-600' },
  'packers-movers': { Icon: Package, bg: 'bg-amber-50', fg: 'text-amber-700' },
  'courier-service': { Icon: Truck, bg: 'bg-rose-50', fg: 'text-rose-600' },
};

const defaultTheme: CategoryIconTheme = {
  Icon: Grid3X3,
  bg: 'bg-slate-100',
  fg: 'text-slate-600',
};

// Mapping category slugs to image file names in /Assets/catagory/
const categoryImageMap: Record<string, string> = {
  'restaurants': '/Assets/catagory/Restaurants.jpeg',
  'hotels': '/Assets/catagory/Hotel.jpeg',
  'beauty-spa': '/Assets/catagory/beautyspa.jpeg',
  'home-decor': '/Assets/catagory/home-decor.jpeg',
  'wedding-planning': '/Assets/catagory/wedding planning.jpeg',
  'education': '/Assets/catagory/education.jpeg',
  'rent-hire': '/Assets/catagory/rent-hire.jpeg',
  'hospitals': '/Assets/catagory/hospital.jpeg',
  'contractors': '/Assets/catagory/constructor.jpeg',
  'pet-shops': '/Assets/catagory/pet-shop.jpeg',
  'pg-hostels': '/Assets/catagory/pg-hostel.jpeg',
  'estate-agent': '/Assets/catagory/estate-agent.jpeg',
  'dentists': '/Assets/catagory/dentist.jpeg',
  'gym': '/Assets/catagory/gym weight room.jpeg',
  'loans': '/Assets/catagory/loan.jpeg',
  'event-organisers': '/Assets/catagory/event organiser.com_corporate-team-building',
  'driving-schools': '/Assets/catagory/driving-school.jpeg',
  'courier-service': '/Assets/catagory/courier-series',
  'packers-movers': '/Assets/catagory/constructor.jpeg', // Using constructor as placeholder, update when image available
};

const getCategoryImageUrl = (categorySlug: string, fallbackIconUrl?: string): string | undefined => {
  return categoryImageMap[categorySlug] || fallbackIconUrl;
};

const CategoryIcon = ({ categorySlug, className }: { categorySlug: string; className?: string }) => {
  const { Icon, bg, fg } = iconThemes[categorySlug] ?? defaultTheme;
  const sizeClass = className ?? 'w-16 h-16';

  return (
    <span
      className={`relative flex items-center justify-center rounded-full ${bg} ${sizeClass}`}
    >
      <Icon className={`w-[50%] h-[50%] ${fg}`} strokeWidth={2} />
    </span>
  );
};

export default function CategoryGrid() {
  const { location } = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllDropdown, setShowAllDropdown] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/categories?loc=${location.id}`);
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [location.id]);

  const handleCategoryClick = (category: Category) => {
    const params = new URLSearchParams({
      loc: location.id,
      city: location.city,
      locName: location.displayName,
    });
    router.push(`/${category.slug}?${params.toString()}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAllDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check scroll position and update arrow visibility
  const checkScrollPosition = (container: HTMLDivElement | null) => {
    if (!container) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const desktopContainer = desktopScrollRef.current;
    const mobileContainer = mobileScrollRef.current;

    const checkBoth = () => {
      // Check the visible container (desktop on larger screens, mobile on small screens)
      // Use getBoundingClientRect to check if container is actually visible
      if (desktopContainer && desktopContainer.getBoundingClientRect().width > 0) {
        checkScrollPosition(desktopContainer);
      } else if (mobileContainer && mobileContainer.getBoundingClientRect().width > 0) {
        checkScrollPosition(mobileContainer);
      }
    };

    // Initial check after a small delay to ensure containers are rendered
    const timeoutId = setTimeout(checkBoth, 100);

    const handleScroll = () => checkBoth();
    const handleResize = () => {
      setTimeout(checkBoth, 100);
    };

    desktopContainer?.addEventListener('scroll', handleScroll);
    mobileContainer?.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      desktopContainer?.removeEventListener('scroll', handleScroll);
      mobileContainer?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [categories]);

  const scrollLeft = () => {
    // Check which container is actually visible
    const desktopContainer = desktopScrollRef.current;
    const mobileContainer = mobileScrollRef.current;
    
    const container = (desktopContainer && desktopContainer.getBoundingClientRect().width > 0)
      ? desktopContainer
      : (mobileContainer && mobileContainer.getBoundingClientRect().width > 0)
      ? mobileContainer
      : null;
    
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollRight = () => {
    // Check which container is actually visible
    const desktopContainer = desktopScrollRef.current;
    const mobileContainer = mobileScrollRef.current;
    
    const container = (desktopContainer && desktopContainer.getBoundingClientRect().width > 0)
      ? desktopContainer
      : (mobileContainer && mobileContainer.getBoundingClientRect().width > 0)
      ? mobileContainer
      : null;
    
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <section className="py-8 px-2 sm:px-3 lg:px-4">
        <div className="max-w-[98%] mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg aspect-square mb-2 border border-gray-200"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-8 px-2 sm:px-3 lg:px-4 bg-white">
      <div className="max-w-[98%] mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6 relative" ref={dropdownRef}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Top Categories</h2>
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowAllDropdown((prev) => !prev)}
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
              aria-expanded={showAllDropdown}
              aria-haspopup="true"
            >
              <span className="hidden sm:inline">See all categories</span>
              <svg
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${showAllDropdown ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.354a.75.75 0 111.02 1.1l-4.25 3.84a.75.75 0 01-1.02 0l-4.25-3.84a.75.75 0 01.02-1.1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {showAllDropdown && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 max-w-[calc(100vw-2rem)] sm:max-w-[20rem] max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-2xl p-2 sm:p-3 z-20"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    All Categories ({categories.length})
                  </span>
                  <button
                    onClick={() => router.push(`/categories?loc=${location.id}`)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View page →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={`dropdown-${category.id}`}
                      onClick={() => {
                        setShowAllDropdown(false);
                        handleCategoryClick(category);
                      }}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
                        {category.iconUrl ? (
                          <Image
                            src={category.iconUrl}
                            alt={category.displayName}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        ) : (
                          <CategoryIcon categorySlug={category.slug} className="w-8 h-8" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-900 truncate">
                          {category.displayName}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {category.itemCount} listings
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop & Tablet: Horizontal Scrollable with Arrows */}
        <div className="hidden sm:block relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={desktopScrollRef}
            className="overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
              {categories.map((category) => {
                const customImageUrl = getCategoryImageUrl(category.slug, category.iconUrl);

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="group shrink-0 flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={`Browse ${category.displayName} - ${category.itemCount} shops available`}
                    style={{ minWidth: '112px' }}
                  >
                    <div className="relative mb-2 flex items-center justify-center h-24 w-24 md:h-28 md:w-28">
                      {customImageUrl ? (
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-white border-2 border-gray-100 shadow-sm group-hover:shadow-md transition-all duration-200">
                          <Image
                            src={customImageUrl}
                            alt={category.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-full bg-white border-2 border-gray-100 shadow-sm group-hover:shadow-md transition-all duration-200 flex items-center justify-center overflow-hidden">
                          <CategoryIcon categorySlug={category.slug} className="w-16 h-16 md:w-20 md:h-20" />
                        </div>
                      )}
                      {category.sponsored && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                          Ad
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-gray-600 text-center leading-tight max-w-[112px]">
                      {category.displayName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile: Horizontal Scroll with Arrows */}
        <div className="sm:hidden relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1.5 shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1.5 shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={mobileScrollRef}
            className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {categories.map((category) => {
                const customImageUrl = getCategoryImageUrl(category.slug, category.iconUrl);

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="shrink-0 flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px]"
                    aria-label={`Browse ${category.displayName} - ${category.itemCount} shops available`}
                  >
                    <div className="relative mb-2 flex items-center justify-center h-20 w-20">
                      {customImageUrl ? (
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-white border-2 border-gray-100 shadow-sm">
                          <Image
                            src={customImageUrl}
                            alt={category.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-full bg-white border-2 border-gray-100 shadow-sm flex items-center justify-center overflow-hidden">
                          <CategoryIcon categorySlug={category.slug} className="w-16 h-16" />
                        </div>
                      )}
                      {category.sponsored && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-1 py-0.5 rounded-full">
                          Ad
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-gray-600 text-center leading-tight max-w-[80px]">
                      {category.displayName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
