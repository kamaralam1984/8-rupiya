'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Shopper {
  id: string;
  name: string;
  phone: string;
  email: string;
  shopperCode: string;
  isActive: boolean;
  isVerified: boolean;
  totalShops: number;
}

interface ShopperAuthContextType {
  shopper: Shopper | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, shopper: Shopper) => void;
  logout: () => void;
  loading: boolean;
}

const ShopperAuthContext = createContext<ShopperAuthContextType | undefined>(undefined);

export function ShopperAuthProvider({ children }: { children: React.ReactNode }) {
  const [shopper, setShopper] = useState<Shopper | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('shopper_token');
      const storedShopper = localStorage.getItem('shopper_data');

      if (storedToken && storedShopper) {
        try {
          setToken(storedToken);
          setShopper(JSON.parse(storedShopper));
        } catch (error) {
          console.error('Error loading shopper data:', error);
          localStorage.removeItem('shopper_token');
          localStorage.removeItem('shopper_data');
        }
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, shopperData: Shopper) => {
    setToken(newToken);
    setShopper(shopperData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shopper_token', newToken);
      localStorage.setItem('shopper_data', JSON.stringify(shopperData));
    }
  };

  const logout = () => {
    setToken(null);
    setShopper(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shopper_token');
      localStorage.removeItem('shopper_data');
    }
  };

  return (
    <ShopperAuthContext.Provider
      value={{
        shopper,
        token,
        isAuthenticated: !!token && !!shopper,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </ShopperAuthContext.Provider>
  );
}

export function useShopperAuth() {
  const context = useContext(ShopperAuthContext);
  if (context === undefined) {
    throw new Error('useShopperAuth must be used within a ShopperAuthProvider');
  }
  return context;
}



