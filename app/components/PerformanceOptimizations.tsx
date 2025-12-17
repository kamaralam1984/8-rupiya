'use client';

import { useEffect } from 'react';

export default function PerformanceOptimizations() {
  useEffect(() => {
    // Add resource hints for better performance
    const addResourceHint = (rel: string, href: string, as?: string, crossOrigin?: string) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (as) link.setAttribute('as', as);
      if (crossOrigin) link.crossOrigin = crossOrigin;
      document.head.appendChild(link);
    };

    // Preconnect to external domains
    addResourceHint('preconnect', 'https://fonts.googleapis.com');
    addResourceHint('preconnect', 'https://fonts.gstatic.com', undefined, 'anonymous');
    addResourceHint('dns-prefetch', 'https://res.cloudinary.com');
    addResourceHint('dns-prefetch', 'https://images.unsplash.com');

    // Prefetch critical resources
    addResourceHint('prefetch', '/og-image.jpg', 'image');
  }, []);

  return null;
}

