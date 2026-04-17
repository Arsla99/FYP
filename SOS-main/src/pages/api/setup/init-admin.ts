import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Delete any existing admin/test users first (clean slate)
    await db.collection('users').deleteMany({ 
      email: { $in: ['admin@sosfyp.com', 'user@sosfyp.com'] }
    });

    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    const testUserPassword = await bcrypt.hash('User123!', 12);

    const adminUser = {
      name: 'System Administrator',
      email: 'admin@sosfyp.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      lastActive: new Date(),
      isVerified: true
    };

    const testUser = {
      name: 'Test User',
      email: 'user@sosfyp.com',
      password: testUserPassword,
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      lastActive: new Date(),
      isVerified: true
    };

    await db.collection('users').insertOne(adminUser);
    await db.collection('users').insertOne(testUser);

    console.log('✅ Admin and test users created successfully');

    res.status(201).json({
      success: true,
      message: 'Users created successfully!',
      adminCredentials: {
        email: 'admin@sosfyp.com',
        password: 'Admin123!',
        role: 'admin'
      },
      userCredentials: {
        email: 'user@sosfyp.com',
        password: 'User123!',
        role: 'user'
      },
      instructions: {
        step1: 'Go to http://localhost:3000/auth',
        step2: 'Login with admin credentials for admin access',
        step3: 'Login with user credentials for SOS dashboard'
      }
    });
  } catch (error) {
    console.error('❌ Error creating users:', error);
    res.status(500).json({ 
      message: 'Failed to create users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
