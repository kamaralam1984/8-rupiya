'use client';

import { ShopperAuthProvider } from '@/app/contexts/ShopperAuthContext';

export default function ShopperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShopperAuthProvider>
      {children}
    </ShopperAuthProvider>
  );
}


