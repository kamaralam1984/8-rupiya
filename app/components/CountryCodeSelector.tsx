'use client';

import { useState } from 'react';

interface Country {
  code: string;
  name: string;
  flag: string;
  isoCode: string; // ISO 3166-1 alpha-2 code for better flag rendering
}

// Helper function to get flag emoji from country code
const getFlagEmoji = (isoCode: string): string => {
  // Convert ISO code to flag emoji using Unicode regional indicator symbols
  const codePoints = isoCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const COUNTRIES: Country[] = [
  { code: '+91', name: 'India', flag: '🇮🇳', isoCode: 'IN' },
  { code: '+1', name: 'USA', flag: '🇺🇸', isoCode: 'US' },
  { code: '+1', name: 'Canada', flag: '🇨🇦', isoCode: 'CA' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', isoCode: 'GB' },
  { code: '+971', name: 'UAE', flag: '🇦🇪', isoCode: 'AE' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', isoCode: 'SA' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', isoCode: 'SG' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', isoCode: 'MY' },
  { code: '+61', name: 'Australia', flag: '🇦🇺', isoCode: 'AU' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿', isoCode: 'NZ' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦', isoCode: 'ZA' },
  { code: '+33', name: 'France', flag: '🇫🇷', isoCode: 'FR' },
  { code: '+49', name: 'Germany', flag: '🇩🇪', isoCode: 'DE' },
  { code: '+81', name: 'Japan', flag: '🇯🇵', isoCode: 'JP' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷', isoCode: 'KR' },
  { code: '+86', name: 'China', flag: '🇨🇳', isoCode: 'CN' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰', isoCode: 'PK' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩', isoCode: 'BD' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', isoCode: 'LK' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵', isoCode: 'NP' },
  { code: '+39', name: 'Italy', flag: '🇮🇹', isoCode: 'IT' },
  { code: '+34', name: 'Spain', flag: '🇪🇸', isoCode: 'ES' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱', isoCode: 'NL' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪', isoCode: 'SE' },
  { code: '+47', name: 'Norway', flag: '🇳🇴', isoCode: 'NO' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭', isoCode: 'CH' },
  { code: '+7', name: 'Russia', flag: '🇷🇺', isoCode: 'RU' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷', isoCode: 'TR' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬', isoCode: 'EG' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬', isoCode: 'NG' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷', isoCode: 'BR' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽', isoCode: 'MX' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷', isoCode: 'AR' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩', isoCode: 'ID' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭', isoCode: 'TH' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳', isoCode: 'VN' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭', isoCode: 'PH' },
];

interface CountryCodeSelectorProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export default function CountryCodeSelector({ value, onChange, className = '' }: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCountry = COUNTRIES.find(c => c.code === value) || COUNTRIES[0];

  // Try to get flag emoji, fallback to stored flag
  const getDisplayFlag = (country: Country): string => {
    try {
      const generated = getFlagEmoji(country.isoCode);
      // If generated flag is valid, use it; otherwise use stored flag
      return generated && generated.length > 0 ? generated : country.flag;
    } catch {
      return country.flag;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-l-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[100px]"
      >
        <span 
          className="text-xl leading-none inline-block" 
          role="img" 
          aria-label={selectedCountry.name}
          style={{ 
            fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
            fontSize: '1.25rem',
            lineHeight: '1',
            display: 'inline-block',
            minWidth: '20px',
            textAlign: 'center'
          }}
        >
          {getDisplayFlag(selectedCountry)}
        </span>
        <span className="text-sm font-semibold text-gray-700">{selectedCountry.code}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-72 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            <div className="p-2">
              {/* Remove duplicates by code and name */}
              {COUNTRIES.filter((country, index, self) => 
                index === self.findIndex(c => c.code === country.code && c.name === country.name)
              ).map((country) => (
                <button
                  key={`${country.code}-${country.name}`}
                  type="button"
                  onClick={() => {
                    onChange(country.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors ${
                    value === country.code ? 'bg-blue-100 border border-blue-300' : ''
                  }`}
                >
                  <span 
                    className="text-2xl leading-none flex-shrink-0 inline-block" 
                    role="img" 
                    aria-label={country.name}
                    style={{ 
                      fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
                      fontSize: '1.5rem',
                      lineHeight: '1',
                      display: 'inline-block',
                      minWidth: '24px',
                      textAlign: 'center'
                    }}
                  >
                    {getDisplayFlag(country)}
                  </span>
                  <span className="flex-1 text-left text-sm font-medium text-gray-700">
                    {country.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-600">{country.code}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
