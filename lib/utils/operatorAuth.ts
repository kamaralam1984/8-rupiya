import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Operator from '@/lib/models/Operator';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface OperatorJWTPayload {
  operatorId: string;
  operatorCode: string;
  email: string;
}

export function generateOperatorToken(payload: OperatorJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyOperatorToken(token: string): OperatorJWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as OperatorJWTPayload;
  } catch (error) {
    return null;
  }
}

export async function verifyOperatorTokenAndGetOperator(token: string) {
  try {
    await connectDB();
    const payload = verifyOperatorToken(token);
    if (!payload) return null;

    const operator = await Operator.findById(payload.operatorId);
    if (!operator || !operator.isActive) return null;

    return operator;
  } catch (error) {
    return null;
  }
}

export function getOperatorTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check cookies for SSR compatibility
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    return cookies['operator_token'] || null;
  }
  
  return null;
}

