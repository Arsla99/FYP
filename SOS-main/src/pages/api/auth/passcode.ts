import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import connectDB from '../../../utils/db';
import User from '../../../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { passcode } = req.body;

  if (!passcode) {
    return res.status(400).json({ message: 'Passcode is required' });
  }

  try {
    await connectDB();

    // Find user with matching passcode
    const user = await (User as any).findOne({ passcode });

    if (!user) {
      return res.status(400).json({ message: 'Invalid passcode' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: '1h', // Shorter expiry for passcode login
    });

    res.status(200).json({ 
      token,
      message: 'Emergency access granted',
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error in passcode login:', error);
    res.status(500).json({ message: 'Server error during emergency login' });
  }
}
