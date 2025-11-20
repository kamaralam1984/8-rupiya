export interface Category {
  id: string;
  slug: string;
  displayName: string;
  iconUrl?: string;
  itemCount: number;
  sponsored: boolean;
}

export interface Offer {
  id: string;
  shopId?: string;
  shopName: string;
  shopLogo?: string;
  imageUrl?: string;
  headline: string;
  description?: string;
  discount?: string;
  expiresAt?: string;
  cta: string;
  sponsored: boolean;
}

export interface Banner {
  id: string;
  section: 'hero' | 'left' | 'right' | 'top' | 'bottom';
  imageUrl: string;
  title?: string;
  cta?: string;
  ctaText?: string;
  linkUrl: string;
  link?: string;
  alt?: string;
  advertiser?: string;
  sponsored: boolean;
  position?: number;
}

export interface HeroSectionData {
  hero?: {
    bannerId: string;
    imageUrl: string;
    alt: string;
    link: string;
    title?: string;
    ctaText?: string;
    advertiser?: string;
  };
  left: Array<{
    bannerId: string;
    imageUrl: string;
    alt: string;
    link: string;
    advertiser?: string;
  }>;
  right: Array<{
    bannerId: string;
    imageUrl: string;
    alt: string;
    link: string;
    advertiser?: string;
  }>;
  bottom: Array<{
    bannerId: string;
    imageUrl: string;
    alt: string;
    link: string;
    advertiser?: string;
  }>;
}

export interface SearchSuggestion {
  type: 'shop' | 'category' | 'location';
  id: string;
  title: string;
  subtitle?: string;
}

export interface Location {
  id: string;
  city: string;
  state?: string;
  country: string;
  displayName: string;
  pincode?: number;
  district?: string;
  source?: 'auto' | 'manual' | 'pincode' | 'browser';
}

export interface BusinessSummary {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  city: string;
  state?: string;
}

