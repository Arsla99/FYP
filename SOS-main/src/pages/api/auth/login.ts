// src/pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { db } = await connectToDatabase();
    const normalizedEmail = String(email).trim().toLowerCase();

    // Find user by email
    const user = await db.collection('users').findOne({ email: normalizedEmail });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last active time
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastActive: new Date(),
          isActive: true 
        } 
      }
    );

    // Ensure JWT secret exists
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email,
        role: user.role || 'user'
      },
      secret,
      { expiresIn: '7d' }
    );

    // Also set token as HttpOnly cookie for convenience
    const isProd = process.env.NODE_ENV === 'production';
    const cookieName = process.env.AUTH_COOKIE_NAME || 'token';
    const cookie = [
      `${cookieName}=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=604800', // 7 days
      isProd ? 'Secure' : '',
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookie);
    res.setHeader('Cache-Control', 'no-store');

    console.log(`✅ User ${user.email} logged in successfully`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token, // kept for backward compatibility
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        lastActive: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}