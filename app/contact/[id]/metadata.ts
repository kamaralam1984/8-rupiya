import { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import AdminShop from '@/lib/models/Shop';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
  
  try {
    await connectDB();

    // Try to find shop by ID
    let shop: any = await AgentShop.findById(id).lean();
    if (!shop) {
      shop = await AdminShop.findById(id).lean();
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
    const shopUrl = `${baseUrl}/contact/${id}`;

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

