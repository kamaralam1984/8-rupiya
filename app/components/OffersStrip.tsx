'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Offer } from '../types';
import { useLocation } from '../contexts/LocationContext';

interface OffersStripProps {
  category?: string;
}

export default function OffersStrip({ category }: OffersStripProps) {
  const { location } = useLocation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const url = `/api/offers?loc=${location.id}${category ? `&cat=${category}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        setOffers(data.offers || []);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, [location.id, category]);

  const handleOfferClick = async (offer: Offer, position: number) => {
    try {
      await fetch('/api/analytics/offer-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offer.id, position }),
      });
    } catch (error) {
      console.error('Error tracking offer click:', error);
    }

    if (offer.shopId) {
      window.location.href = `/shop/${offer.shopId}?offer=${offer.id}`;
    }
  };

  const formatTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  if (isLoading) {
    return (
      <section className="py-8 px-2 sm:px-3 lg:px-4 bg-[#F8FAFC]">
        <div className="max-w-[98%] mx-auto">
          <div className="h-6 w-40 bg-gray-200 rounded mb-6 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (offers.length === 0) {
    return (
      <section className="py-8 px-2 sm:px-3 lg:px-4 bg-[#F8FAFC]">
        <div className="max-w-[98%] mx-auto">
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center shadow-sm">
            <p className="text-gray-600 mb-3 text-lg font-semibold">No offers available right now</p>
            <a
              href="/advertise"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
            >
              Advertise your offer here
            </a>
          </div>
        </div>
      </section>
    );
  }

  const visibleOffers = offers.slice(0, 6);

  return (
    <section className="py-6 sm:py-8 px-2 sm:px-3 lg:px-4 bg-[#F8FAFC]">
      <div className="max-w-[98%] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Special Offers</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Grab these limited-time deals before they&apos;re gone.</p>
          </div>
          <a
            href="/offers"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors self-start sm:self-auto"
          >
            View all offers →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {visibleOffers.map((offer, index) => (
            <div
              key={offer.id}
              className="relative bg-white rounded-xl sm:rounded-2xl shadow-md overflow-hidden group border border-gray-200"
            >
              <div className="relative h-40 sm:h-56 bg-linear-to-br from-blue-100 to-purple-100">
                {offer.imageUrl ? (
                  <Image
                    src={offer.imageUrl}
                    alt={offer.headline}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500" />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-5 py-3 sm:py-4 gap-3 sm:gap-0">
                <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0 flex-1">
                  {offer.discount && (
                    <span className="text-xl sm:text-2xl font-extrabold text-blue-600 tracking-tight">
                      {offer.discount}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {offer.expiresAt && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-orange-600">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2" />
                          <circle cx="12" cy="12" r="9" strokeWidth={2} />
                        </svg>
                        {formatTimeRemaining(offer.expiresAt)}
                      </span>
                    )}
                    {offer.sponsored && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-yellow-700">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 1l2.39 4.848 5.345.778-3.872 3.772.914 5.332L10 13.902l-4.777 2.828.914-5.332-3.872-3.772 5.345-.778L10 1z" />
                        </svg>
                        Sponsored
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleOfferClick(offer, index)}
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-blue-600 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors shrink-0 w-full sm:w-auto"
                >
                  Shop Now
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

