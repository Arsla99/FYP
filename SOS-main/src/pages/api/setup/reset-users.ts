import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Clear existing users (be careful with this in production!)
    await db.collection('users').deleteMany({});
    
    console.log('🗑️ All users deleted');

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const adminUser = {
      name: 'System Administrator',
      email: 'admin@sosfyp.com',
      password: adminPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      lastActive: new Date(),
      isVerified: true,
      adminLevel: 'super'
    };

    const adminResult = await db.collection('users').insertOne(adminUser);

    // Create test user
    const userPassword = await bcrypt.hash('User123!', 12);
    const testUser = {
      name: 'Test User',
      email: 'user@sosfyp.com',
      password: userPassword,
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      lastActive: new Date(),
      isVerified: true
    };

    const userResult = await db.collection('users').insertOne(testUser);

    // Create additional demo users
    const demoUsers = [
      {
        name: 'John Doe',
        email: 'john@demo.com',
        password: await bcrypt.hash('Demo123!', 12),
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        isVerified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@demo.com',
        password: await bcrypt.hash('Demo123!', 12),
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        isVerified: true
      }
    ];

    await db.collection('users').insertMany(demoUsers);

    console.log('✅ All users reset and recreated');

    res.status(200).json({
      success: true,
      message: 'Users reset and recreated successfully',
      credentials: [
        {
          type: 'ADMIN',
          email: 'admin@sosfyp.com',
          password: 'Admin123!',
          role: 'admin',
          access: 'Full admin dashboard access'
        },
        {
          type: 'USER',
          email: 'user@sosfyp.com',
          password: 'User123!',
          role: 'user',
          access: 'SOS dashboard access'
        },
        {
          type: 'DEMO USER 1',
          email: 'john@demo.com',
          password: 'Demo123!',
          role: 'user',
          access: 'SOS dashboard access'
        },
        {
          type: 'DEMO USER 2',
          email: 'jane@demo.com',
          password: 'Demo123!',
          role: 'user',
          access: 'SOS dashboard access'
        }
      ],
      totalUsers: 4
    });
  } catch (error) {
    console.error('❌ Error resetting users:', error);
    res.status(500).json({ 
      message: 'Failed to reset users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
