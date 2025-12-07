'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import CategoryGrid from '../components/CategoryGrid';
import OffersStrip from '../components/OffersStrip';
import FeaturedBusinesses from '../components/FeaturedBusinesses';
import LatestOffers from '../components/LatestOffers';
import TopRatedBusinesses from '../components/TopRatedBusinesses';
import NewBusinesses from '../components/NewBusinesses';
import { safeJsonParse } from '../utils/fetchHelpers';
import NotFound from './not-found';

interface Page {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
  designSettings?: any;
}

export default function DynamicPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pageConfig, setPageConfig] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (slug) {
      fetchPage();
    }
  }, [slug]);
  
  // Inject custom CSS after mount to avoid hydration mismatch
  useEffect(() => {
    if (!mounted || !pageConfig) return;
    
    const styleId = 'page-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    const layoutConfig = pageConfig.layout || {};
    const primaryColor = layoutConfig.primaryColor || '#3b82f6';
    const secondaryColor = layoutConfig.secondaryColor || '#8b5cf6';
    const sectionSpacing = layoutConfig.sectionSpacing || '40px';
    
    styleElement.textContent = `
      :root {
        --primary-color: ${primaryColor};
        --secondary-color: ${secondaryColor};
        --section-spacing: ${sectionSpacing};
      }
    `;
  }, [mounted, pageConfig]);

  // Apply functions from designSettings
  useEffect(() => {
    if (!mounted || !page || !page.designSettings?.functions) return;

    const functions = page.designSettings.functions;

    // Smooth Scroll
    if (functions.smoothScroll) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }

    // Lazy Load Images
    if (functions.lazyLoad && 'IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }

    // Back to Top Button
    if (functions.backToTop) {
      const backToTopBtn = document.createElement('button');
      backToTopBtn.innerHTML = '⬆️';
      backToTopBtn.className = 'fixed bottom-8 right-8 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-opacity opacity-0 pointer-events-none';
      backToTopBtn.style.transition = 'opacity 0.3s';
      backToTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.appendChild(backToTopBtn);

      const toggleButton = () => {
        if (window.scrollY > 300) {
          backToTopBtn.style.opacity = '1';
          backToTopBtn.style.pointerEvents = 'auto';
        } else {
          backToTopBtn.style.opacity = '0';
          backToTopBtn.style.pointerEvents = 'none';
        }
      };

      window.addEventListener('scroll', toggleButton);
      toggleButton();

      return () => {
        window.removeEventListener('scroll', toggleButton);
        backToTopBtn.remove();
      };
    }

    // Reading Progress Bar
    if (functions.readingProgress) {
      const progressBar = document.createElement('div');
      progressBar.className = 'fixed top-0 left-0 h-1 bg-blue-600 z-50';
      progressBar.style.width = '0%';
      progressBar.style.transition = 'width 0.1s';
      document.body.appendChild(progressBar);

      const updateProgress = () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
      };

      window.addEventListener('scroll', updateProgress);

      return () => {
        window.removeEventListener('scroll', updateProgress);
        progressBar.remove();
      };
    }
  }, [mounted, page]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      // First try to get page from API
      const response = await fetch(`/api/pages/${slug}`);
      
      if (!response.ok) {
        setNotFound(true);
        return;
      }

      const data = await safeJsonParse<{ page: Page }>(response);
      
      if (data?.page && data.page.isPublished) {
        setPage(data.page);
        
        // Check if page is a homepage duplicate
        const isHomepageDuplicate = data.page.content?.includes('HOMEPAGE_DUPLICATE_PAGE') || 
                                   data.page.content?.includes('homepage-duplicate-page') ||
                                   data.page.content?.includes('window.homepageConfig');
        
        if (isHomepageDuplicate) {
          let configFound = false;
          
          // Try to extract config from JSON script tag first
          const jsonMatch = data.page.content?.match(/<script[^>]*type="application\/json"[^>]*id="homepage-config"[^>]*>([\s\S]*?)<\/script>/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              const config = JSON.parse(jsonMatch[1].trim());
              setPageConfig(config);
              configFound = true;
            } catch (parseError) {
              console.warn('Could not parse JSON config from script tag, using defaults:', parseError);
            }
          }
          
          // Fallback to window.homepageConfig pattern if JSON script not found
          if (!configFound) {
            const configMatch = data.page.content?.match(/window\.homepageConfig\s*=\s*({[\s\S]*?});/);
            if (configMatch && configMatch[1]) {
              try {
                const config = JSON.parse(configMatch[1].trim());
                setPageConfig(config);
                configFound = true;
              } catch (parseError) {
                console.warn('Could not parse window.homepageConfig, using defaults:', parseError);
              }
            }
          }
          
          // If no config found, use default config silently
          if (!configFound) {
            setPageConfig({
              sections: {
                hero: true,
                categories: true,
                offers: true,
                featuredBusinesses: true,
                topRated: true,
                newBusinesses: true,
              },
              layout: {
                theme: 'light',
                primaryColor: '#3b82f6',
                secondaryColor: '#8b5cf6',
                containerWidth: '98%',
                sectionSpacing: '40px',
              },
            });
          }
        }
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching page:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (notFound || !page) {
    return <NotFound />;
  }

  // Get design settings
  const designSettings = page.designSettings || {};
  const layout = designSettings.layout || 'container';
  const maxWidth = designSettings.maxWidth || '98%';
  const backgroundColor = designSettings.backgroundColor || '#ffffff';
  const textColor = designSettings.textColor || '#111827';

  // Check if this is a homepage duplicate page
  const isHomepageDuplicate = page.content?.includes('HOMEPAGE_DUPLICATE_PAGE') ||
                              page.content?.includes('homepage-duplicate-page') ||
                              page.content?.includes('data-homepage-duplicate="true")') ||
                              page.content?.includes('window.homepageConfig');

  // If it's a homepage duplicate, render exactly like homepage
  if (isHomepageDuplicate) {
    // Use pageConfig if available, otherwise use default homepage sections
    const config = pageConfig || {
      sections: {
        hero: true,
        categories: true,
        offers: true,
        featuredBusinesses: true,
        topRated: true,
        newBusinesses: true,
      },
      layout: {
        theme: 'light',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        containerWidth: '98%',
        sectionSpacing: '40px',
      },
    };
    
    const sections = config.sections || {
      hero: true,
      categories: true,
      offers: true,
      featuredBusinesses: true,
      topRated: true,
      newBusinesses: true,
    };
    const shopConfig = config.shopConfig || { enabled: false };

    // Get functions from designSettings for homepage duplicate
    const functions = page?.designSettings?.functions || {};
    const navbarClass = functions.stickyHeader ? 'sticky top-0 z-40' : '';

    // Render exactly like homepage - use same structure as app/page.tsx
    return (
      <div className="min-h-screen bg-gray-50">
        <div className={navbarClass}>
          <Navbar />
        </div>

        <main className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 pt-0 pb-4 sm:pb-6">
          {/* Hero Section */}
          {sections.hero && <HeroSection />}

          {/* Categories Section */}
          {sections.categories && <CategoryGrid />}

          {/* Offers Section */}
          {sections.offers && <LatestOffers />}

          {/* Featured Businesses */}
          {sections.featuredBusinesses && <FeaturedBusinesses />}

          {/* Top Rated Businesses */}
          {sections.topRated && <TopRatedBusinesses />}

          {/* New Businesses */}
          {sections.newBusinesses && <NewBusinesses />}
        </main>

        {/* Footer - Exact homepage style */}
        <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-16">
          <div className="max-w-[98%] mx-auto px-2 sm:px-3 lg:px-4 py-4 sm:py-6">
            <div className="text-center text-xs sm:text-sm text-gray-600">
              <p>© 2024 KVL Business. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Get functions from designSettings
  const functions = page?.designSettings?.functions || {};
  const navbarClass = functions.stickyHeader ? 'sticky top-0 z-40' : '';

  // Regular page with HTML content
  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor,
        color: textColor,
      }}
    >
      <div className={navbarClass}>
        <Navbar />
      </div>

      <main 
        className={`mx-auto px-2 sm:px-3 lg:px-4 py-8 sm:py-12`}
        style={{
          maxWidth: layout === 'full-width' ? '100%' : maxWidth,
          padding: designSettings.padding || '20px',
          margin: designSettings.margin || '0 auto',
        }}
      >
        <article 
          className="prose prose-lg max-w-none"
          style={{
            fontFamily: designSettings.fontFamily || 'Arial, sans-serif',
            fontSize: designSettings.fontSize || '16px',
            lineHeight: designSettings.lineHeight || '1.6',
          }}
        >
          <h1 
            className="text-4xl font-bold mb-6"
            style={{
              fontFamily: designSettings.headingFont || designSettings.fontFamily || 'Arial, sans-serif',
              fontSize: designSettings.headingSize || '2.5rem',
              color: designSettings.primaryColor || textColor,
            }}
          >
            {page.title}
          </h1>
          
          {page.content && (
            <div 
              dangerouslySetInnerHTML={{ __html: page.content }}
              className="page-content"
            />
          )}
        </article>
      </main>

      {/* Footer */}
      <footer 
        className="border-t mt-8 sm:mt-16"
        style={{
          backgroundColor: backgroundColor,
          borderColor: designSettings.primaryColor ? `${designSettings.primaryColor}20` : '#e5e7eb',
        }}
      >
        <div 
          className="mx-auto px-2 sm:px-3 lg:px-4 py-4 sm:py-6"
          style={{ maxWidth: maxWidth }}
        >
          <div className="text-center text-xs sm:text-sm" style={{ color: textColor }}>
            <p>© 2024 {page.title}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom CSS */}
      {designSettings.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: designSettings.customCSS }} />
      )}

      {/* Custom JavaScript */}
      {designSettings.customJS && (
        <script dangerouslySetInnerHTML={{ __html: designSettings.customJS }} />
      )}
    </div>
  );
}

