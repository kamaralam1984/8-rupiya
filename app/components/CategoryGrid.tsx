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
  ShoppingBag,
  Stethoscope,
  Briefcase,
  Home,
  Wrench,
  BookOpen,
  Camera,
  Music,
  Coffee,
  ShoppingCart,
  Heart,
  Zap,
  Scissors,
  Phone,
  Star,
  Gift,
  CreditCard,
  Plane,
  Bus,
  Gamepad2,
  Baby,
  Shirt,
  Laptop,
  Tv,
  Headphones,
  Smartphone,
  Watch,
  Footprints,
  Cookie,
  IceCream,
  Droplet,
  Settings,
  Paintbrush,
  Apple,
  Milk,
  Flower2,
  Palette,
  Book,
  PenTool,
  Disc,
  Activity,
  Pill,
  Microscope,
  Leaf,
  HeartPulse,
  Users,
  Code,
  Languages,
  Droplets,
  Lightbulb,
  Snowflake,
  CircleDot,
  Film,
  Shield,
  Scale,
  Calculator,
  Printer,
  Store,
  MoreHorizontal,
} from 'lucide-react';

type CategoryIconTheme = {
  Icon: LucideIcon;
  bg: string;
  fg: string;
};

// Helper function to normalize slug for icon lookup
const normalizeSlug = (slug: string): string => {
  return slug.toLowerCase().trim();
};

const iconThemes: Record<string, CategoryIconTheme> = {
  // Existing categories
  restaurants: { Icon: UtensilsCrossed, bg: 'bg-gradient-to-br from-amber-100 to-amber-200', fg: 'text-amber-700' },
  hotels: { Icon: BedDouble, bg: 'bg-gradient-to-br from-sky-100 to-sky-200', fg: 'text-sky-700' },
  'beauty-spa': { Icon: Sparkles, bg: 'bg-gradient-to-br from-pink-100 to-pink-200', fg: 'text-pink-600' },
  'home-decor': { Icon: Lamp, bg: 'bg-gradient-to-br from-indigo-100 to-indigo-200', fg: 'text-indigo-700' },
  'wedding-planning': { Icon: HeartHandshake, bg: 'bg-gradient-to-br from-purple-100 to-purple-200', fg: 'text-purple-700' },
  education: { Icon: GraduationCap, bg: 'bg-gradient-to-br from-emerald-100 to-emerald-200', fg: 'text-emerald-700' },
  'rent-hire': { Icon: KeyRound, bg: 'bg-gradient-to-br from-teal-100 to-teal-200', fg: 'text-teal-700' },
  hospitals: { Icon: Hospital, bg: 'bg-gradient-to-br from-rose-100 to-rose-200', fg: 'text-rose-700' },
  contractors: { Icon: Hammer, bg: 'bg-gradient-to-br from-amber-100 to-orange-200', fg: 'text-amber-800' },
  'pet-shops': { Icon: PawPrint, bg: 'bg-gradient-to-br from-orange-100 to-orange-200', fg: 'text-orange-600' },
  'pg-hostels': { Icon: Building, bg: 'bg-gradient-to-br from-blue-100 to-blue-200', fg: 'text-blue-700' },
  'estate-agent': { Icon: Building2, bg: 'bg-gradient-to-br from-slate-100 to-slate-200', fg: 'text-slate-800' },
  dentists: { Icon: Smile, bg: 'bg-gradient-to-br from-blue-100 to-cyan-200', fg: 'text-blue-700' },
  gym: { Icon: Dumbbell, bg: 'bg-gradient-to-br from-lime-100 to-green-200', fg: 'text-lime-700' },
  loans: { Icon: PiggyBank, bg: 'bg-gradient-to-br from-yellow-100 to-yellow-200', fg: 'text-yellow-700' },
  'event-organisers': { Icon: PartyPopper, bg: 'bg-gradient-to-br from-fuchsia-100 to-pink-200', fg: 'text-fuchsia-700' },
  'driving-schools': { Icon: Car, bg: 'bg-gradient-to-br from-sky-100 to-blue-200', fg: 'text-sky-700' },
  'packers-movers': { Icon: Package, bg: 'bg-gradient-to-br from-amber-100 to-yellow-200', fg: 'text-amber-800' },
  'courier-service': { Icon: Truck, bg: 'bg-gradient-to-br from-rose-100 to-red-200', fg: 'text-rose-700' },
  
  // Electronics
  electronics: { Icon: Zap, bg: 'bg-gradient-to-br from-yellow-100 to-amber-200', fg: 'text-yellow-800' },
  'mobile-phones': { Icon: Smartphone, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  laptops: { Icon: Laptop, bg: 'bg-gradient-to-br from-slate-100 to-gray-200', fg: 'text-slate-800' },
  televisions: { Icon: Tv, bg: 'bg-gradient-to-br from-purple-100 to-pink-200', fg: 'text-purple-700' },
  cameras: { Icon: Camera, bg: 'bg-gradient-to-br from-indigo-100 to-blue-200', fg: 'text-indigo-700' },
  'audio-devices': { Icon: Headphones, bg: 'bg-gradient-to-br from-pink-100 to-rose-200', fg: 'text-pink-700' },
  
  // Fashion
  fashion: { Icon: Shirt, bg: 'bg-gradient-to-br from-purple-100 to-pink-200', fg: 'text-purple-700' },
  'mens-clothing': { Icon: Shirt, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  'womens-clothing': { Icon: Shirt, bg: 'bg-gradient-to-br from-pink-100 to-rose-200', fg: 'text-pink-700' },
  'kids-clothing': { Icon: Shirt, bg: 'bg-gradient-to-br from-yellow-100 to-amber-200', fg: 'text-yellow-800' },
  footwear: { Icon: Footprints, bg: 'bg-gradient-to-br from-amber-100 to-orange-200', fg: 'text-amber-800' },
  watches: { Icon: Watch, bg: 'bg-gradient-to-br from-slate-100 to-gray-200', fg: 'text-slate-800' },
  jewellery: { Icon: Star, bg: 'bg-gradient-to-br from-yellow-100 to-amber-200', fg: 'text-yellow-800' },
  'bags-luggage': { Icon: Package, bg: 'bg-gradient-to-br from-amber-100 to-orange-200', fg: 'text-amber-800' },
  
  // Home & Furniture
  'home-furniture': { Icon: Home, bg: 'bg-gradient-to-br from-green-100 to-emerald-200', fg: 'text-green-700' },
  furniture: { Icon: Home, bg: 'bg-gradient-to-br from-amber-100 to-orange-200', fg: 'text-amber-800' },
  'kitchen-appliances': { Icon: Settings, bg: 'bg-gradient-to-br from-blue-100 to-cyan-200', fg: 'text-blue-700' },
  'bathroom-accessories': { Icon: Droplet, bg: 'bg-gradient-to-br from-blue-100 to-sky-200', fg: 'text-blue-700' },
  
  // Grocery
  grocery: { Icon: ShoppingCart, bg: 'bg-gradient-to-br from-green-100 to-emerald-200', fg: 'text-green-700' },
  'fresh-fruits-vegetables': { Icon: Apple, bg: 'bg-gradient-to-br from-green-100 to-lime-200', fg: 'text-green-700' },
  'dairy-products': { Icon: Milk, bg: 'bg-gradient-to-br from-white to-blue-100', fg: 'text-blue-700' },
  'packaged-food': { Icon: Package, bg: 'bg-gradient-to-br from-amber-100 to-yellow-200', fg: 'text-amber-800' },
  beverages: { Icon: Droplet, bg: 'bg-gradient-to-br from-blue-100 to-cyan-200', fg: 'text-blue-700' },
  
  // Beauty & Personal Care
  'beauty-personal-care': { Icon: Sparkles, bg: 'bg-gradient-to-br from-pink-100 to-purple-200', fg: 'text-pink-700' },
  cosmetics: { Icon: Palette, bg: 'bg-gradient-to-br from-pink-100 to-rose-200', fg: 'text-pink-700' },
  skincare: { Icon: Flower2, bg: 'bg-gradient-to-br from-pink-100 to-purple-200', fg: 'text-pink-700' },
  haircare: { Icon: Scissors, bg: 'bg-gradient-to-br from-purple-100 to-pink-200', fg: 'text-purple-700' },
  grooming: { Icon: Scissors, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  perfumes: { Icon: Flower2, bg: 'bg-gradient-to-br from-purple-100 to-fuchsia-200', fg: 'text-purple-700' },
  
  // Sports & Fitness
  'sports-fitness': { Icon: Dumbbell, bg: 'bg-gradient-to-br from-lime-100 to-green-200', fg: 'text-lime-700' },
  'sports-equipment': { Icon: Dumbbell, bg: 'bg-gradient-to-br from-green-100 to-emerald-200', fg: 'text-green-700' },
  'fitness-gear': { Icon: Dumbbell, bg: 'bg-gradient-to-br from-orange-100 to-red-200', fg: 'text-orange-700' },
  
  // Kids & Toys
  'kids-toys': { Icon: Gamepad2, bg: 'bg-gradient-to-br from-yellow-100 to-amber-200', fg: 'text-yellow-800' },
  toys: { Icon: Gamepad2, bg: 'bg-gradient-to-br from-pink-100 to-purple-200', fg: 'text-pink-700' },
  'baby-care': { Icon: Baby, bg: 'bg-gradient-to-br from-pink-100 to-rose-200', fg: 'text-pink-700' },
  'school-supplies': { Icon: Book, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  
  // Automotive
  automotive: { Icon: Car, bg: 'bg-gradient-to-br from-slate-100 to-gray-200', fg: 'text-slate-800' },
  'car-accessories': { Icon: Car, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  'bike-accessories': { Icon: Car, bg: 'bg-gradient-to-br from-red-100 to-orange-200', fg: 'text-red-700' },
  helmets: { Icon: CircleDot, bg: 'bg-gradient-to-br from-gray-100 to-slate-200', fg: 'text-gray-700' },
  'gps-navigation': { Icon: Phone, bg: 'bg-gradient-to-br from-blue-100 to-cyan-200', fg: 'text-blue-700' },
  
  // Books & Media
  'books-media': { Icon: BookOpen, bg: 'bg-gradient-to-br from-indigo-100 to-blue-200', fg: 'text-indigo-700' },
  books: { Icon: BookOpen, bg: 'bg-gradient-to-br from-amber-100 to-orange-200', fg: 'text-amber-800' },
  stationery: { Icon: PenTool, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  'music-movies': { Icon: Disc, bg: 'bg-gradient-to-br from-purple-100 to-pink-200', fg: 'text-purple-700' },
  
  // Health & Wellness
  'health-wellness': { Icon: Activity, bg: 'bg-gradient-to-br from-green-100 to-emerald-200', fg: 'text-green-700' },
  'vitamins-supplements': { Icon: Pill, bg: 'bg-gradient-to-br from-blue-100 to-cyan-200', fg: 'text-blue-700' },
  'health-monitors': { Icon: Activity, bg: 'bg-gradient-to-br from-red-100 to-rose-200', fg: 'text-red-700' },
  'medical-equipment': { Icon: Microscope, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  
  // Pet Supplies
  'pet-supplies': { Icon: PawPrint, bg: 'bg-gradient-to-br from-orange-100 to-orange-200', fg: 'text-orange-600' },
  'pet-food': { Icon: PawPrint, bg: 'bg-gradient-to-br from-amber-100 to-yellow-200', fg: 'text-amber-800' },
  'pet-accessories': { Icon: PawPrint, bg: 'bg-gradient-to-br from-pink-100 to-rose-200', fg: 'text-pink-700' },
  
  // Travel
  travel: { Icon: Plane, bg: 'bg-gradient-to-br from-sky-100 to-blue-200', fg: 'text-sky-700' },
  luggage: { Icon: Package, bg: 'bg-gradient-to-br from-amber-100 to-orange-200', fg: 'text-amber-800' },
  'travel-accessories': { Icon: Package, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  backpacks: { Icon: Package, bg: 'bg-gradient-to-br from-gray-100 to-slate-200', fg: 'text-gray-700' },
  
  // Restaurants & Food
  cafes: { Icon: Coffee, bg: 'bg-gradient-to-br from-amber-100 to-orange-200', fg: 'text-amber-800' },
  'fast-food': { Icon: UtensilsCrossed, bg: 'bg-gradient-to-br from-red-100 to-orange-200', fg: 'text-red-700' },
  bakery: { Icon: Cookie, bg: 'bg-gradient-to-br from-amber-100 to-yellow-200', fg: 'text-amber-800' },
  'sweet-shops': { Icon: Cookie, bg: 'bg-gradient-to-br from-pink-100 to-rose-200', fg: 'text-pink-700' },
  'ice-cream-parlors': { Icon: IceCream, bg: 'bg-gradient-to-br from-blue-100 to-cyan-200', fg: 'text-blue-700' },
  
  // Health & Medical
  clinics: { Icon: Hospital, bg: 'bg-gradient-to-br from-blue-100 to-cyan-200', fg: 'text-blue-700' },
  doctors: { Icon: Stethoscope, bg: 'bg-gradient-to-br from-red-100 to-rose-200', fg: 'text-red-700' },
  pharmacy: { Icon: Pill, bg: 'bg-gradient-to-br from-green-100 to-emerald-200', fg: 'text-green-700' },
  'diagnostic-centers': { Icon: Microscope, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  ayurveda: { Icon: Leaf, bg: 'bg-gradient-to-br from-green-100 to-emerald-200', fg: 'text-green-700' },
  physiotherapy: { Icon: HeartPulse, bg: 'bg-gradient-to-br from-red-100 to-pink-200', fg: 'text-red-700' },
  
  // Education
  schools: { Icon: GraduationCap, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  colleges: { Icon: GraduationCap, bg: 'bg-gradient-to-br from-purple-100 to-indigo-200', fg: 'text-purple-700' },
  'coaching-centers': { Icon: BookOpen, bg: 'bg-gradient-to-br from-emerald-100 to-green-200', fg: 'text-emerald-700' },
  'computer-training': { Icon: Code, bg: 'bg-gradient-to-br from-blue-100 to-cyan-200', fg: 'text-blue-700' },
  'language-classes': { Icon: Languages, bg: 'bg-gradient-to-br from-purple-100 to-pink-200', fg: 'text-purple-700' },
  
  // Home Services
  'home-services': { Icon: Home, bg: 'bg-gradient-to-br from-amber-100 to-orange-200', fg: 'text-amber-800' },
  plumbers: { Icon: Droplets, bg: 'bg-gradient-to-br from-blue-100 to-cyan-200', fg: 'text-blue-700' },
  electricians: { Icon: Lightbulb, bg: 'bg-gradient-to-br from-yellow-100 to-amber-200', fg: 'text-yellow-800' },
  carpenters: { Icon: Hammer, bg: 'bg-gradient-to-br from-amber-100 to-orange-200', fg: 'text-amber-800' },
  painters: { Icon: Paintbrush, bg: 'bg-gradient-to-br from-purple-100 to-pink-200', fg: 'text-purple-700' },
  'ac-repair': { Icon: Snowflake, bg: 'bg-gradient-to-br from-blue-100 to-cyan-200', fg: 'text-blue-700' },
  'appliance-repair': { Icon: Settings, bg: 'bg-gradient-to-br from-gray-100 to-slate-200', fg: 'text-gray-700' },
  'cleaning-services': { Icon: Sparkles, bg: 'bg-gradient-to-br from-blue-100 to-sky-200', fg: 'text-blue-700' },
  
  // Automobile Services
  'car-dealerships': { Icon: Car, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  'service-centers': { Icon: Wrench, bg: 'bg-gradient-to-br from-gray-100 to-slate-200', fg: 'text-gray-700' },
  'spare-parts': { Icon: Settings, bg: 'bg-gradient-to-br from-amber-100 to-orange-200', fg: 'text-amber-800' },
  'car-wash': { Icon: Droplet, bg: 'bg-gradient-to-br from-blue-100 to-cyan-200', fg: 'text-blue-700' },
  'tyre-shops': { Icon: CircleDot, bg: 'bg-gradient-to-br from-gray-100 to-slate-200', fg: 'text-gray-700' },
  
  // Events & Entertainment
  'movie-theaters': { Icon: Film, bg: 'bg-gradient-to-br from-purple-100 to-pink-200', fg: 'text-purple-700' },
  'event-organizers': { Icon: PartyPopper, bg: 'bg-gradient-to-br from-fuchsia-100 to-pink-200', fg: 'text-fuchsia-700' },
  'party-planners': { Icon: PartyPopper, bg: 'bg-gradient-to-br from-yellow-100 to-amber-200', fg: 'text-yellow-800' },
  photographers: { Icon: Camera, bg: 'bg-gradient-to-br from-purple-100 to-pink-200', fg: 'text-purple-700' },
  'catering-services': { Icon: UtensilsCrossed, bg: 'bg-gradient-to-br from-amber-100 to-orange-200', fg: 'text-amber-800' },
  
  // Other Services
  salons: { Icon: Scissors, bg: 'bg-gradient-to-br from-pink-100 to-purple-200', fg: 'text-pink-700' },
  gyms: { Icon: Dumbbell, bg: 'bg-gradient-to-br from-lime-100 to-green-200', fg: 'text-lime-700' },
  'travel-agents': { Icon: Plane, bg: 'bg-gradient-to-br from-sky-100 to-blue-200', fg: 'text-sky-700' },
  'real-estate': { Icon: Building2, bg: 'bg-gradient-to-br from-green-100 to-emerald-200', fg: 'text-green-700' },
  insurance: { Icon: Shield, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  banks: { Icon: Building, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  lawyers: { Icon: Scale, bg: 'bg-gradient-to-br from-slate-100 to-gray-200', fg: 'text-slate-800' },
  'ca-tax-consultants': { Icon: Calculator, bg: 'bg-gradient-to-br from-blue-100 to-indigo-200', fg: 'text-blue-700' },
  'printing-services': { Icon: Printer, bg: 'bg-gradient-to-br from-gray-100 to-slate-200', fg: 'text-gray-700' },
  'courier-services': { Icon: Truck, bg: 'bg-gradient-to-br from-rose-100 to-red-200', fg: 'text-rose-700' },
  'general-store': { Icon: Store, bg: 'bg-gradient-to-br from-amber-100 to-orange-200', fg: 'text-amber-800' },
  supermarket: { Icon: ShoppingBag, bg: 'bg-gradient-to-br from-green-100 to-emerald-200', fg: 'text-green-700' },
  others: { Icon: MoreHorizontal, bg: 'bg-gradient-to-br from-slate-100 to-gray-200', fg: 'text-slate-700' },
};

const defaultTheme: CategoryIconTheme = {
  Icon: Grid3X3,
  bg: 'bg-gradient-to-br from-slate-100 to-slate-200',
  fg: 'text-slate-700',
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
  const normalizedSlug = normalizeSlug(categorySlug);
  const { Icon, bg, fg } = iconThemes[normalizedSlug] ?? defaultTheme;
  const sizeClass = className ?? 'w-16 h-16';

  return (
    <span
      className={`relative flex items-center justify-center rounded-full ${bg} ${sizeClass} shadow-md border-2 border-white/50`}
    >
      <Icon className={`w-[55%] h-[55%] ${fg}`} strokeWidth={2.5} />
    </span>
  );
};

interface CategoryWithDistance extends Category {
  distance?: number;
  visitorCount?: number;
}

export default function CategoryGrid() {
  const { location } = useLocation();
  const [categories, setCategories] = useState<CategoryWithDistance[]>([]);
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
        setIsLoading(true);
        
        // Fetch categories and nearest shops in parallel
        const [categoriesResponse, nearestShopsResponse] = await Promise.all([
          fetch(`/api/categories?loc=${location.id}`),
          location.latitude && location.longitude
            ? fetch(`/api/categories/nearest-shops?userLat=${location.latitude}&userLng=${location.longitude}`)
            : Promise.resolve(null),
        ]);

        const categoriesData = await categoriesResponse.json();
        const nearestShopsData = nearestShopsResponse ? await nearestShopsResponse.json() : null;

        const categoriesList = categoriesData.categories || [];
        const nearestShopsMap = nearestShopsData?.categoryShops || {};

        // Merge category data with nearest shop data
        const categoriesWithDistance = categoriesList.map((category: Category) => {
          const shopData = nearestShopsMap[category.slug] || { distance: 0, visitorCount: 0 };
              return {
                ...category,
            distance: shopData.distance || 0,
            visitorCount: shopData.visitorCount || 0,
              };
        });
        
        setCategories(categoriesWithDistance);
      } catch (error) {
        // Silent error - only log in development
        if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching categories:', error);
        }
        // Fallback: try to fetch categories without distance
        try {
          const response = await fetch(`/api/categories?loc=${location.id}`);
          const data = await response.json();
          setCategories(data.categories || []);
        } catch (fallbackError) {
          // Silent fallback error
          setCategories([]);
        }
        } finally {
          setIsLoading(false);
        }
      };

    fetchCategories();
  }, [location.id, location.latitude, location.longitude]);

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

  // Show message if no categories
  if (categories.length === 0) {
    return (
      <section className="py-6 sm:py-8 px-2 sm:px-3 lg:px-4 bg-white">
        <div className="max-w-[98%] mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4">Top Categories</h2>
          <p className="text-gray-600">No categories available. Please seed categories from the admin panel.</p>
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
                  {categories.map((category, index) => (
                    <button
                      key={`dropdown-${category.id || category.slug || index}`}
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
              {categories.map((category, index) => {
                const customImageUrl = getCategoryImageUrl(category.slug, category.iconUrl);

                return (
                  <button
                    key={`category-desktop-${category.id || category.slug || index}`}
                    onClick={() => handleCategoryClick(category)}
                    className="group shrink-0 flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={`Browse ${category.displayName} - ${category.itemCount} shops available`}
                    style={{ minWidth: '112px' }}
                  >
                    <div className="relative mb-2 flex items-center justify-center h-24 w-24 md:h-28 md:w-28">
                      {/* Always show icon prominently */}
                      <div className="relative w-full h-full rounded-full bg-white border-2 border-gray-200 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200 flex items-center justify-center overflow-hidden">
                      {customImageUrl ? (
                          <>
                          <Image
                            src={customImageUrl}
                            alt={category.displayName || category.slug || `Category ${category.id || ''}` || 'Category image'}
                            fill
                              className="object-cover opacity-30"
                          />
                            {/* Icon always visible on top */}
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                              <CategoryIcon categorySlug={category.slug} className="w-14 h-14 md:w-16 md:h-16" />
                        </div>
                          </>
                      ) : (
                          <CategoryIcon categorySlug={category.slug} className="w-16 h-16 md:w-20 md:h-20" />
                        )}
                        </div>
                      {/* Distance, Time, and Visitor Count Badge */}
                      {(category.distance !== undefined || category.visitorCount !== undefined) && (
                        <div className="absolute -top-1 -right-1 z-10">
                          <div className="bg-blue-600 text-white px-1 py-0.5 rounded text-[8px] font-bold shadow-lg flex flex-col items-center gap-0.5">
                            {category.distance !== undefined && category.distance > 0 && (
                              <>
                                <div className="flex items-center gap-0.5">
                                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span>{category.distance.toFixed(1)}km</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{Math.round(category.distance * 1.5)}min</span>
                                </div>
                              </>
                            )}
                            {category.visitorCount !== undefined && (
                              <div className="flex items-center gap-0.5">
                                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>{category.visitorCount || 0}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {category.sponsored && (
                        <span className="absolute -top-1 -left-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
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
              {categories.map((category, index) => {
                const customImageUrl = getCategoryImageUrl(category.slug, category.iconUrl);

                return (
                  <button
                    key={`category-mobile-${category.id || category.slug || index}`}
                    onClick={() => handleCategoryClick(category)}
                    className="shrink-0 flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px]"
                    aria-label={`Browse ${category.displayName} - ${category.itemCount} shops available`}
                  >
                    <div className="relative mb-2 flex items-center justify-center h-20 w-20">
                      {/* Always show icon prominently */}
                      <div className="relative w-full h-full rounded-full bg-white border-2 border-gray-200 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200 flex items-center justify-center overflow-hidden">
                      {customImageUrl ? (
                          <>
                          <Image
                            src={customImageUrl}
                            alt={category.displayName || category.slug || `Category ${category.id || ''}` || 'Category image'}
                            fill
                              className="object-cover opacity-30"
                          />
                            {/* Icon always visible on top */}
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                              <CategoryIcon categorySlug={category.slug} className="w-14 h-14" />
                        </div>
                          </>
                      ) : (
                          <CategoryIcon categorySlug={category.slug} className="w-16 h-16" />
                        )}
                        </div>
                      {/* Distance, Time, and Visitor Count Badge */}
                      {(category.distance !== undefined || category.visitorCount !== undefined) && (
                        <div className="absolute -top-1 -right-1 z-10">
                          <div className="bg-blue-600 text-white px-1 py-0.5 rounded text-[7px] font-bold shadow-lg flex flex-col items-center gap-0.5">
                            {category.distance !== undefined && category.distance > 0 && (
                              <>
                                <div className="flex items-center gap-0.5">
                                  <svg className="w-1.5 h-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span>{category.distance.toFixed(1)}km</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <svg className="w-1.5 h-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{Math.round(category.distance * 1.5)}min</span>
                                </div>
                              </>
                            )}
                            {category.visitorCount !== undefined && (
                              <div className="flex items-center gap-0.5">
                                <svg className="w-1.5 h-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>{category.visitorCount || 0}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {category.sponsored && (
                        <span className="absolute -top-1 -left-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-1 py-0.5 rounded-full">
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
