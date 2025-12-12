import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Banner from '@/models/Banner';
import type { Banner as BannerType } from '@/app/types';

// Fallback mock data - used only if database is empty
const mockBanners: BannerType[] = [
  // Hero banners
  {
    id: 'hero-1',
    section: 'hero',
    imageUrl: '/Assets/hero/hero-image.jpg',
    title: 'Discover Amazing Local Businesses',
    cta: 'Explore Now',
    ctaText: 'Visit Shop',
    linkUrl: '/',
    alt: 'Discover local businesses with 8rupeess',
    advertiser: '8rupeess',
    sponsored: true,
  },
  // Left column banners - 4 items
  {
    id: 'left-1',
    section: 'left',
    imageUrl: '/Assets/hero/2.png',
    title: 'Food Delivery',
    linkUrl: '/category/restaurants',
    alt: 'Swiggy food delivery',
    advertiser: 'Swiggy',
    sponsored: false,
  },
  {
    id: 'left-2',
    section: 'left',
    imageUrl: '/Assets/hero/3.png',
    title: 'Transportation Services',
    linkUrl: '/category/transport',
    alt: 'Ola cabs transportation',
    advertiser: 'Ola',
    sponsored: false,
  },
  {
    id: 'left-3',
    section: 'left',
    imageUrl: '/Assets/hero/4.png',
    title: 'Beauty & Wellness',
    linkUrl: '/category/beauty',
    alt: 'Nykaa beauty products',
    advertiser: 'Nykaa',
    sponsored: true,
  },
  {
    id: 'left-4',
    section: 'left',
    imageUrl: '/Assets/hero/5.png',
    title: 'Tata Services',
    linkUrl: '/category/tata',
    alt: 'Tata services',
    advertiser: 'Tata',
    sponsored: false,
  },
  // Right column banners - 4 items
  {
    id: 'right-1',
    section: 'right',
    imageUrl: '/Assets/hero/6.png',
    title: 'Online Shopping',
    linkUrl: '/category/shopping',
    alt: 'Flipkart online shopping',
    advertiser: 'Flipkart',
    sponsored: false,
  },
  {
    id: 'right-2',
    section: 'right',
    imageUrl: '/Assets/hero/7.png',
    title: 'Travel & Airlines',
    linkUrl: '/category/travel',
    alt: 'IndiGo airlines',
    advertiser: 'IndiGo',
    sponsored: false,
  },
  {
    id: 'right-3',
    section: 'right',
    imageUrl: '/Assets/hero/8.png',
    title: 'Banking Services',
    linkUrl: '/category/banking',
    alt: 'HDFC Bank services',
    advertiser: 'HDFC Bank',
    sponsored: true,
  },
  {
    id: 'right-4',
    section: 'right',
    imageUrl: '/Assets/hero/9.png',
    title: 'Reliance Services',
    linkUrl: '/category/reliance',
    alt: 'Reliance services',
    advertiser: 'Reliance',
    sponsored: false,
  },
  // Bottom strip banners (20 items) - Company logos in 2 rows of 10
  {
    id: 'bottom-1',
    section: 'top',
    imageUrl: '/Assets/Tata_logo.svg.png',
    linkUrl: '/shop/tata',
    alt: 'Tata logo',
    advertiser: 'Tata',
    sponsored: false,
  },
  {
    id: 'bottom-2',
    section: 'top',
    imageUrl: '/Assets/Reliance-Industries-Limited-Logo.png',
    linkUrl: '/shop/reliance',
    alt: 'Reliance Industries logo',
    advertiser: 'Reliance',
    sponsored: false,
  },
  {
    id: 'bottom-3',
    section: 'top',
    imageUrl: '/Assets/Parle-Logo-history.png',
    linkUrl: '/shop/parle',
    alt: 'Parle logo',
    advertiser: 'Parle',
    sponsored: false,
  },
  {
    id: 'bottom-4',
    section: 'top',
    imageUrl: '/Assets/Amul-Logo.png',
    linkUrl: '/shop/amul',
    alt: 'Amul logo',
    advertiser: 'Amul',
    sponsored: false,
  },
  {
    id: 'bottom-5',
    section: 'top',
    imageUrl: '/Assets/ITC_-_Company_Logo.jpg',
    linkUrl: '/shop/itc',
    alt: 'ITC logo',
    advertiser: 'ITC',
    sponsored: false,
  },
  {
    id: 'bottom-6',
    section: 'top',
    imageUrl: '/Assets/Infosys-Logo.jpg',
    linkUrl: '/shop/infosys',
    alt: 'Infosys logo',
    advertiser: 'Infosys',
    sponsored: false,
  },
  {
    id: 'bottom-7',
    section: 'top',
    imageUrl: '/Assets/Mahindra-Logo.png',
    linkUrl: '/shop/mahindra',
    alt: 'Mahindra logo',
    advertiser: 'Mahindra',
    sponsored: false,
  },
  {
    id: 'bottom-8',
    section: 'top',
    imageUrl: '/Assets/LIC-Logo.png',
    linkUrl: '/shop/lic',
    alt: 'LIC logo',
    advertiser: 'LIC',
    sponsored: false,
  },
  {
    id: 'bottom-9',
    section: 'top',
    imageUrl: '/Assets/Godrej_Logo.svg.png',
    linkUrl: '/shop/godrej',
    alt: 'Godrej logo',
    advertiser: 'Godrej',
    sponsored: false,
  },
  {
    id: 'bottom-10',
    section: 'top',
    imageUrl: '/Assets/Dabur_Logo.svg.png',
    linkUrl: '/shop/dabur',
    alt: 'Dabur logo',
    advertiser: 'Dabur',
    sponsored: false,
  },
  // Row 2: 10 more images
  {
    id: 'bottom-11',
    section: 'top',
    imageUrl: '/Assets/Bajaj_Motorcycles_logo.svg.png',
    linkUrl: '/shop/bajaj',
    alt: 'Bajaj logo',
    advertiser: 'Bajaj',
    sponsored: false,
  },
  {
    id: 'bottom-12',
    section: 'top',
    imageUrl: '/Assets/ASIANPAINT.NS-6124f67e.png',
    linkUrl: '/shop/asianpaint',
    alt: 'Asian Paints logo',
    advertiser: 'Asian Paints',
    sponsored: false,
  },
  {
    id: 'bottom-13',
    section: 'top',
    imageUrl: '/Assets/Adani_2012_logo.png',
    linkUrl: '/shop/adani',
    alt: 'Adani logo',
    advertiser: 'Adani',
    sponsored: false,
  },
  {
    id: 'bottom-14',
    section: 'top',
    imageUrl: '/Assets/Swiggy-logo.jpg',
    linkUrl: '/shop/swiggy',
    alt: 'Swiggy logo',
    advertiser: 'Swiggy',
    sponsored: false,
  },
  {
    id: 'bottom-15',
    section: 'top',
    imageUrl: '/Assets/Ola-Cabs-Logo-2048x1153.jpg',
    linkUrl: '/shop/ola',
    alt: 'Ola logo',
    advertiser: 'Ola',
    sponsored: false,
  },
  {
    id: 'bottom-16',
    section: 'top',
    imageUrl: '/Assets/Nykaa_New_Logo.svg',
    linkUrl: '/shop/nykaa',
    alt: 'Nykaa logo',
    advertiser: 'Nykaa',
    sponsored: false,
  },
  {
    id: 'bottom-17',
    section: 'top',
    imageUrl: '/Assets/Flipkart-logo (1).jpg',
    linkUrl: '/shop/flipkart',
    alt: 'Flipkart logo',
    advertiser: 'Flipkart',
    sponsored: false,
  },
  {
    id: 'bottom-18',
    section: 'top',
    imageUrl: '/Assets/IndiGo-Logo.jpg',
    linkUrl: '/shop/indigo',
    alt: 'IndiGo logo',
    advertiser: 'IndiGo',
    sponsored: false,
  },
  {
    id: 'bottom-19',
    section: 'top',
    imageUrl: '/Assets/HDFC-Bank-logo.jpg',
    linkUrl: '/shop/hdfc',
    alt: 'HDFC Bank logo',
    advertiser: 'HDFC Bank',
    sponsored: false,
  },
  {
    id: 'bottom-20',
    section: 'top',
    imageUrl: '/Assets/Britannia_images_Hero_600x400.jpg',
    linkUrl: '/shop/britannia',
    alt: 'Britannia logo',
    advertiser: 'Britannia',
    sponsored: false,
  },
  // Additional banners using remaining Assets images for variety
  {
    id: 'bottom-21',
    section: 'top',
    imageUrl: '/Assets/infosys-logo-infosys-icon-free-free-vector.jpg',
    linkUrl: '/shop/infosys-alt',
    alt: 'Infosys alternative logo',
    advertiser: 'Infosys',
    sponsored: false,
  },
  {
    id: 'bottom-22',
    section: 'top',
    imageUrl: '/Assets/parle-continues-to-be-indias-top-fmcg-brand-at-home-12th-time-in-a-row.webp',
    linkUrl: '/shop/parle-alt',
    alt: 'Parle brand image',
    advertiser: 'Parle',
    sponsored: false,
  },
  {
    id: 'bottom-23',
    section: 'top',
    imageUrl: '/Assets/colroful-abstract-circle-logo-design-template-vector.jpg',
    linkUrl: '/shop/partner',
    alt: 'Partner logo',
    advertiser: 'Partner',
    sponsored: false,
  },
];

// Revalidate every 5 minutes
export const revalidate = 300;
// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get('section') as BannerType['section'] | null;
    const loc = searchParams.get('loc'); // location ID
    const area = searchParams.get('area');
    const pincode = searchParams.get('pincode');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: any = { isActive: true };
    if (section) query.section = section;
    if (loc) query.locationId = loc;
    if (area) query.area = area;
    if (pincode) query.pincode = parseInt(pincode);

    // Fetch from database
    let dbBanners = await Banner.find(query)
      .sort({ section: 1, order: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    // If no banners found in DB, use mock data as fallback
    if (dbBanners.length === 0 && !section && !loc && !area && !pincode) {
      let banners = mockBanners;
      if (section) {
        banners = banners.filter((b) => b.section === section);
      }
      banners = banners.slice(0, limit);
      return NextResponse.json({ banners });
    }

    // Convert database banners to API format
    const banners: BannerType[] = dbBanners.map((banner: any) => ({
      id: banner._id.toString(),
      section: banner.section,
      imageUrl: banner.imageUrl,
      title: banner.title,
      cta: banner.cta,
      ctaText: banner.ctaText,
      linkUrl: banner.linkUrl,
      link: banner.linkUrl,
      alt: banner.alt,
      advertiser: banner.advertiser,
      sponsored: banner.sponsored || false,
      position: banner.position,
      lat: banner.lat,
      lng: banner.lng,
    }));

    return NextResponse.json({ banners }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error: any) {
    console.error('Error fetching banners:', error);
    // Fallback to mock data on error
    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get('section') as BannerType['section'] | null;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let banners = mockBanners;
    if (section) {
      banners = banners.filter((b) => b.section === section);
    }
    banners = banners.slice(0, limit);
    return NextResponse.json({ banners }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  }
}
