'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocation } from '../contexts/LocationContext';
import type { Category } from '../types';
import { safeJsonParse } from '../utils/fetchHelpers';

export default function PopularCategories() {
  const router = useRouter();
  const { location } = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/categories?loc=${location.id}`);
        const data = await safeJsonParse<{ categories?: Category[] }>(res);
        // Sort by item count and take top 6
        const popular = (data?.categories || [])
          .sort((a: Category, b: Category) => b.itemCount - a.itemCount)
          .slice(0, 6);
        setCategories(popular);
      } catch (e) {
        console.error('Failed to load popular categories', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [location.id]);

  const handleCategoryClick = (category: Category) => {
    const params = new URLSearchParams({
      loc: location.id,
      city: location.city,
      locName: location.displayName,
    });
    router.push(`/${category.slug}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <section className="py-10 px-2 sm:px-3 lg:px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-[98%] mx-auto">
          <div className="h-8 w-56 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-8 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                <div className="p-4">
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-12 px-2 sm:px-3 lg:px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-[98%] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-0">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Popular Categories</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Most searched categories in your area</p>
          </div>
          <a href="/categories" className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-blue-600 hover:text-blue-700 transition-colors self-start sm:self-auto group">
            <span>View all</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="group rounded-xl sm:rounded-2xl bg-white shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-blue-200 text-left"
            >
              <div className="relative h-32 sm:h-40 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
                {category.iconUrl ? (
                  <Image
                    src={category.iconUrl}
                    alt={category.displayName}
                    fill
                    className="object-contain p-4 transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                )}
                {category.sponsored && (
                  <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    Ad
                  </span>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {category.displayName}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {category.itemCount} listings
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

