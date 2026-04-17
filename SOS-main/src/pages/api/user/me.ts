import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';
import { requireAuth } from '../../../utils/serverAuth';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await requireAuth(req, res);
    if (!user) {
      return; // requireAuth already sent 401 response
    }

    // Fetch full user details from database
    const { db } = await connectToDatabase();
    
    const userDetails = await db.collection('users').findOne(
      { _id: new ObjectId(user.id) },
      { projection: { password: 0 } }
    );

    if (!userDetails) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update last active time
    await db.collection('users').updateOne(
      { _id: new ObjectId(user.id) },
      { 
        $set: { 
          lastActive: new Date(),
          isActive: true 
        } 
      }
    );

    res.status(200).json({
      id: userDetails._id,
      email: userDetails.email,
      name: userDetails.name,
      role: userDetails.role || 'user',
      contacts: userDetails.contacts || [],
      keywords: userDetails.keywords || [],
      bloodType: userDetails.bloodType,
      medicalConditions: userDetails.medicalConditions,
      age: userDetails.age,
      avatarUrl: userDetails.avatarUrl,
      subscription: userDetails.subscription,
      createdAt: userDetails.createdAt,
      lastActive: new Date()
    });
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
