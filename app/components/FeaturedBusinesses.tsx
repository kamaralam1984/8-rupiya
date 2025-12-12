'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { BusinessSummary } from '../types';
import { useLocation } from '../contexts/LocationContext';
import { safeJsonParse } from '../utils/fetchHelpers';

export default function FeaturedBusinesses() {
  const { location } = useLocation();
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/businesses/featured');
        const data = await safeJsonParse<{ businesses?: BusinessSummary[] }>(res);
        setBusinesses(data?.businesses || []);
      } catch (e) {
        // Silent error - component handles gracefully
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <section className="py-10 px-2 sm:px-3 lg:px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[98%] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-0">
            <div>
              <div className="h-8 w-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-2 animate-pulse" />
              <div className="h-5 w-80 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl bg-white shadow-lg border-2 border-gray-200 overflow-hidden">
                <div className="h-44 sm:h-52 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                <div className="p-4">
                  <div className="h-6 w-3/4 bg-gray-200 rounded-lg mb-3 animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-12 px-2 sm:px-3 lg:px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-[98%] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-0">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
              Featured Businesses {location.city || 'Patna'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2 font-medium">Discover top-rated businesses in your area</p>
          </div>
          <a href="/search?featured=1" className="inline-flex items-center gap-2 px-4 py-2 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg self-start sm:self-auto group">
            <span>View all</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {businesses.map((biz, index) => {
            // Generate random distance and location for demo (in real app, calculate from coordinates)
            const distance = (2 + Math.random() * 5).toFixed(1);
            const locations = ['Rajendra Nagar', 'Kankarbagh', 'Boring Road', 'Gandhi Maidan', 'Exhibition Road', 'Patliputra Road'];
            const area = locations[index % locations.length];
            const savePercent = Math.floor(Math.random() * 30) + 5;
            
            return (
              <article key={biz.id} className="group rounded-xl bg-white shadow-lg border-2 border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 cursor-pointer flex flex-col">
                <div className="relative h-44 sm:h-52 overflow-hidden bg-gray-100">
                  <Image 
                    src={biz.imageUrl} 
                    alt={biz.name} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-110" 
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" 
                  />
                  {index < 3 && (
                    <span className="absolute top-3 right-3 z-20 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg border border-red-400">
                      Save {savePercent}%
                    </span>
                  )}
                  {/* Rating Badge */}
                  <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm shadow-md border border-gray-200">
                    <span className="text-yellow-500 text-sm font-black">★</span>
                    <span className="text-sm font-black text-gray-900">{biz.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50">
                  <h3 className="text-sm sm:text-base font-black text-gray-900 mb-2.5 line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors leading-tight">
                    {biz.name}
                  </h3>
                  
                  {/* Location and Distance */}
                  <div className="mt-auto pt-3 border-t-2 border-gray-200">
                    <div className="flex items-start gap-1.5 mb-2">
                      <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span className="text-xs sm:text-sm font-bold text-gray-800 break-words flex-1 leading-relaxed">{area}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md border border-blue-200 w-fit">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs sm:text-sm font-bold text-blue-700">{distance} km</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
