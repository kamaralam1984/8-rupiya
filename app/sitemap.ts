import { MetadataRoute } from 'next';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import AdminShop from '@/lib/models/Shop';
import Category from '@/models/Category';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
  
  try {
    await connectDB();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/shop-directory`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
    ];

    // Fetch all active categories
    const categories = await Category.find({ isActive: true }).select('slug').lean();
    const categoryPages: MetadataRoute.Sitemap = categories.map((cat: any) => ({
      url: `${baseUrl}/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Fetch all visible shops from AgentShop
    const agentShops = await AgentShop.find({
      paymentStatus: 'PAID',
      isVisible: { $ne: false },
    })
      .select('shopUrl updatedAt')
      .lean()
      .limit(10000); // Limit to prevent timeout

    // Fetch all visible shops from AdminShop
    const adminShops = await AdminShop.find({
      $or: [
        { paymentStatus: 'PAID' },
        { paymentStatus: { $exists: false } },
      ],
      isVisible: { $ne: false },
    })
      .select('shopUrl updatedAt')
      .lean()
      .limit(10000);

    // Combine and create shop URLs
    const shopPages: MetadataRoute.Sitemap = [
      ...agentShops.map((shop: any) => ({
        url: shop.shopUrl 
          ? `${baseUrl}${shop.shopUrl.startsWith('/') ? shop.shopUrl : `/${shop.shopUrl}`}`
          : `${baseUrl}/contact/${shop._id}`,
        lastModified: shop.updatedAt ? new Date(shop.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...adminShops.map((shop: any) => ({
        url: shop.shopUrl 
          ? `${baseUrl}${shop.shopUrl.startsWith('/') ? shop.shopUrl : `/${shop.shopUrl}`}`
          : `${baseUrl}/contact/${shop._id}`,
        lastModified: shop.updatedAt ? new Date(shop.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ];

    // Remove duplicates
    const uniqueShopPages = shopPages.filter(
      (page, index, self) => index === self.findIndex((p) => p.url === page.url)
    );

    return [...staticPages, ...categoryPages, ...uniqueShopPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least static pages on error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ];
  }
}

