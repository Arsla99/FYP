import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔌 Testing MongoDB connection...');
    
    const { db } = await connectToDatabase();
    
    const collections = await db.listCollections().toArray();
    const stats = await db.stats();
    
    res.status(200).json({
      success: true,
      message: 'MongoDB connection successful!',
      database: process.env.MONGODB_DB || 'sosfyp',
      collections: collections.map(c => c.name),
      stats: {
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ MongoDB test failed:', error);
    res.status(500).json({
      success: false,
      message: 'MongoDB connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
