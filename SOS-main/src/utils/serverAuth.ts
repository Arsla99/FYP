
// src/utils/serverAuth.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../lib/mongodb';
import { ObjectId } from 'mongodb';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Unified authentication helper for API routes
 * Supports both NextAuth sessions and legacy JWT tokens
 */
export async function authenticateRequest(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthenticatedUser | null> {
  // Try NextAuth session first (preferred method)
  try {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.id) {
      return {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || '',
        role: session.user.role || 'user'
      };
    }
  } catch (error) {
    console.warn('⚠️ NextAuth session check failed, trying legacy token:', error);
  }

  // Fallback to legacy JWT token authentication
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return null;
  }

  try {
    // Verify JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('❌ JWT_SECRET not configured');
      return null;
    }

    const decoded = jwt.verify(token, secret) as any;
    
    if (!decoded.userId) {
      return null;
    }

    // Fetch user from database to ensure they still exist
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.warn('⚠️ Invalid JWT token');
    } else {
      console.error('❌ Error authenticating request:', error);
    }
    return null;
  }
}

/**
 * Middleware to require authentication
 * Returns 401 if not authenticated
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthenticatedUser | null> {
  const user = await authenticateRequest(req, res);
  
  if (!user) {
    res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
    return null;
  }

  return user;
}

/**
 * Middleware to require admin role
 * Returns 401 if not authenticated, 403 if not admin
 */
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthenticatedUser | null> {
  const user = await requireAuth(req, res);
  
  if (!user) {
    return null; // Already sent 401 response
  }

  if (user.role !== 'admin') {
    res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
    return null;
  }

  return user;
}
