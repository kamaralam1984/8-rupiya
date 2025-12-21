import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface ShopperTokenPayload {
  shopperId: string;
  shopperCode: string;
  email: string;
}

export function generateShopperToken(payload: ShopperTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d', // 30 days
  });
}

export function verifyShopperToken(token: string): ShopperTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ShopperTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getShopperTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check cookies
  const token = request.cookies.get('shopper_token')?.value;
  return token || null;
}






