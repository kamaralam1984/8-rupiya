import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AgentJWTPayload {
  agentId: string;
  agentCode: string;
  email: string;
}

export function generateAgentToken(payload: AgentJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyAgentToken(token: string): AgentJWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AgentJWTPayload;
  } catch (error) {
    return null;
  }
}

export function getAgentTokenFromRequest(request: Request): string | null {
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
    
    return cookies['agent_token'] || null;
  }
  
  return null;
}


