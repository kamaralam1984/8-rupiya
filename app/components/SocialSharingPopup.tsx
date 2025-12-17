'use client';

import { useState } from 'react';

interface SocialSharingPopupProps {
  shopUrl: string;
  shopName: string;
  shopImage?: string;
  shopDescription?: string;
  enableWhatsApp?: boolean;
  enableFacebook?: boolean;
  enableTwitter?: boolean;
  enableLinkedIn?: boolean;
  whatsappNumber?: string;
  customMessage?: string;
  onClose: () => void;
}

export default function SocialSharingPopup({
  shopUrl,
  shopName,
  shopImage,
  shopDescription,
  enableWhatsApp = true,
  enableFacebook = true,
  enableTwitter = true,
  enableLinkedIn = false,
  whatsappNumber,
  customMessage,
  onClose,
}: SocialSharingPopupProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${shopUrl}`
    : shopUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareText = customMessage || `Check out ${shopName}${shopDescription ? ` - ${shopDescription}` : ''} on 8Rupiya!`;
  const whatsappUrl = whatsappNumber 
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(shareText + ' ' + fullUrl)}`
    : `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + fullUrl)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Share Shop</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={fullUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-700"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {enableWhatsApp && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-500 text-white py-2 rounded-lg text-center hover:bg-green-600 font-semibold min-w-[100px]"
              >
                WhatsApp
              </a>
            )}
            {enableFacebook && (
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-center hover:bg-blue-700 font-semibold min-w-[100px]"
              >
                Facebook
              </a>
            )}
            {enableTwitter && (
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-400 text-white py-2 rounded-lg text-center hover:bg-blue-500 font-semibold min-w-[100px]"
              >
                Twitter
              </a>
            )}
            {enableLinkedIn && (
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-center hover:bg-blue-800 font-semibold min-w-[100px]"
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
