import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
  
  return {
    name: '8 Rupiya - Local Business Directory',
    short_name: '8 Rupiya',
    description: 'Find the best local shops, businesses, and services near you in Patna',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10b981',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['business', 'shopping', 'local'],
    lang: 'en-IN',
    dir: 'ltr',
    scope: '/',
    // Note: serviceworker field is not part of standard Web App Manifest spec
    // If you need service worker, register it separately in your app
  };
}


