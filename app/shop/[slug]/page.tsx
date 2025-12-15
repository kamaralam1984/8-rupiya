import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import AdminShop from '@/lib/models/Shop';
import ShopDetailsClient from '@/app/components/ShopDetailsClient';
import mongoose from 'mongoose';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
  
  try {
    await connectDB();

    // Try to find shop by slug - check multiple URL formats
    let shop: any = null;
    
    // Check if slug is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    
    // Try different URL formats
    const possibleUrls = [
      `/shop/${slug}`,
      `shop/${slug}`,
      `/${slug}`,
      slug,
    ];
    
    // First try AgentShop
    for (const url of possibleUrls) {
      shop = await AgentShop.findOne({ shopUrl: url }).lean();
      if (shop) break;
    }
    
    // If not found by shopUrl and slug is a valid ObjectId, try finding by ID
    if (!shop && isValidObjectId) {
      try {
        shop = await AgentShop.findById(slug).lean();
        if (shop) {
          // If found by ID, check if shopUrl exists, if not, redirect might be needed
          // But for now, just use the shop found by ID
        }
      } catch (error) {
        // Invalid ObjectId format, continue with AdminShop search
      }
    }
    
    // If not found in AgentShop, try AdminShop
    if (!shop) {
      for (const url of possibleUrls) {
        shop = await AdminShop.findOne({ shopUrl: url }).lean();
        if (shop) break;
      }
    }
    
    // If still not found and slug is a valid ObjectId, try finding AdminShop by ID
    if (!shop && isValidObjectId) {
      try {
        shop = await AdminShop.findById(slug).lean();
      } catch (error) {
        // Invalid ObjectId format, shop remains null
      }
    }

    if (!shop || shop.isVisible === false || shop.paymentStatus !== 'PAID') {
      return {
        title: 'Shop Not Found',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const shopName = shop.shopName || shop.name || 'Shop';
    const category = shop.category || '';
    const area = shop.area || shop.city || '';
    const pincode = shop.pincode || '';
    const address = shop.fullAddress || shop.address || '';
    const phone = shop.mobile || shop.phone || '';
    const email = shop.email || '';
    const description = `${shopName} - ${category} in ${area}${pincode ? `, PIN ${pincode}` : ''}. Contact: ${phone ? phone : email ? email : ''}. ${address ? `Address: ${address}` : ''}`;

    const title = `${shopName} - ${category} in ${area}${pincode ? ` (${pincode})` : ''} | 8 Rupiya`;
    const metaDescription = description.length > 160 ? description.substring(0, 157) + '...' : description;
    const imageUrl = shop.photoUrl || shop.imageUrl || `${baseUrl}/og-image.jpg`;
    const shopUrl = `${baseUrl}/shop/${slug}`;

    return {
      title,
      description: metaDescription,
      keywords: [
        shopName,
        category,
        area,
        pincode,
        `${category} in ${area}`,
        `${shopName} ${area}`,
        `shop near me ${area}`,
        `${category} shop ${pincode}`,
      ],
      alternates: {
        canonical: shopUrl,
      },
        openGraph: {
          type: 'website',
        url: shopUrl,
        title,
        description: metaDescription,
        siteName: '8 Rupiya',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: shopName,
          },
        ],
        locale: 'en_IN',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: metaDescription,
        images: [imageUrl],
      },
      other: {
        'business:contact_data:street_address': address,
        'business:contact_data:locality': area,
        'business:contact_data:postal_code': pincode,
        'business:contact_data:phone_number': phone,
        'business:contact_data:email': email,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Shop Details',
    };
  }
}

export default async function ShopPage({ params }: PageProps) {
  const { slug } = await params;
  
  try {
    await connectDB();

    // Try to find shop by slug - check multiple URL formats
    let shop: any = null;
    let source = 'unknown';
    
    // Check if slug is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    
    // Try different URL formats
    const possibleUrls = [
      `/shop/${slug}`,
      `shop/${slug}`,
      `/${slug}`,
      slug,
    ];
    
    // First try AgentShop by shopUrl
    for (const url of possibleUrls) {
      shop = await AgentShop.findOne({ shopUrl: url }).lean();
      if (shop) {
        source = 'agentshop';
        break;
      }
    }
    
    // If not found by shopUrl and slug is a valid ObjectId, try finding by ID
    if (!shop && isValidObjectId) {
      try {
        shop = await AgentShop.findById(slug).lean();
        if (shop) {
          source = 'agentshop';
        }
      } catch (error) {
        // Invalid ObjectId format, continue with AdminShop search
      }
    }
    
    // If not found in AgentShop, try AdminShop by shopUrl
    if (!shop) {
      for (const url of possibleUrls) {
        shop = await AdminShop.findOne({ shopUrl: url }).lean();
        if (shop) {
          source = 'adminshop';
          break;
        }
      }
    }
    
    // If still not found and slug is a valid ObjectId, try finding AdminShop by ID
    if (!shop && isValidObjectId) {
      try {
        shop = await AdminShop.findById(slug).lean();
        if (shop) {
          source = 'adminshop';
        }
      } catch (error) {
        // Invalid ObjectId format, shop remains null
      }
    }

    // Check if shop exists and is visible
    if (!shop) {
      console.error('Shop not found with slug:', slug, 'Tried URLs:', possibleUrls);
      notFound();
    }

    // Check visibility - only show if visible and paid
    if (shop.isVisible === false) {
      console.error('Shop is not visible:', slug);
      notFound();
    }

    if (shop.paymentStatus !== 'PAID') {
      console.error('Shop payment status is not PAID:', slug, 'Status:', shop.paymentStatus);
      notFound();
    }

    // Transform shop data to plain object (remove Mongoose methods and convert ObjectIds to strings)
    // Use JSON serialization to ensure all Mongoose objects are converted to plain values
    const shopPlain = JSON.parse(JSON.stringify(shop));
    
    const shopData = {
      id: shopPlain._id || shopPlain.id || '',
      shopName: shopPlain.shopName || shopPlain.name || '',
      ownerName: shopPlain.ownerName || '',
      category: shopPlain.category || '',
      area: shopPlain.area || shopPlain.city || '',
      city: shopPlain.city || '',
      pincode: shopPlain.pincode || '',
      fullAddress: shopPlain.fullAddress || shopPlain.address || '',
      address: shopPlain.address || shopPlain.fullAddress || '',
      mobile: shopPlain.mobile || shopPlain.phone || '',
      phone: shopPlain.phone || shopPlain.mobile || '',
      email: shopPlain.email || '',
      photoUrl: shopPlain.photoUrl || shopPlain.imageUrl || '',
      imageUrl: shopPlain.imageUrl || shopPlain.photoUrl || '',
      latitude: shopPlain.latitude || null,
      longitude: shopPlain.longitude || null,
      whatsappNumber: shopPlain.whatsappNumber || '',
      website: shopPlain.website || '',
      visitorCount: shopPlain.visitorCount || 0,
    };

    // Generate structured data (JSON-LD) - ensure all values are plain types
    const structuredData: any = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: String(shopData.shopName || ''),
      image: String(shopData.photoUrl || ''),
      description: String(`${shopData.shopName} - ${shopData.category} in ${shopData.area || shopData.city || ''}`),
      address: {
        '@type': 'PostalAddress',
        streetAddress: String(shopData.fullAddress || ''),
        addressLocality: String(shopData.area || shopData.city || ''),
        addressRegion: String(shopData.city || shopData.area || ''),
        postalCode: String(shopData.pincode || ''),
        addressCountry: 'IN',
      },
      telephone: String(shopData.mobile || ''),
      email: String(shopData.email || ''),
      url: String(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/shop/${slug}`),
      priceRange: '$$',
      servesCuisine: String(shopData.category || ''),
      areaServed: {
        '@type': 'City',
        name: String(shopData.city || shopData.area || 'Patna'),
      },
    };
    
    // Add geo coordinates only if both latitude and longitude are valid numbers
    if (shopData.latitude && shopData.longitude && 
        typeof shopData.latitude === 'number' && typeof shopData.longitude === 'number') {
      structuredData.geo = {
        '@type': 'GeoCoordinates',
        latitude: Number(shopData.latitude),
        longitude: Number(shopData.longitude),
      };
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ShopDetailsClient shop={shopData} />
      </>
    );
  } catch (error) {
    console.error('Error loading shop:', error);
    notFound();
  }
}

