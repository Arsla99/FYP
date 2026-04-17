import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../utils/db';
import User from '../../../models/User';
import { requireAuth } from '../../../utils/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const user = await requireAuth(req, res);
    if (!user) return;

    // Connect to database
    await connectDB();

    // Get all users except the current user
    const users = await (User as any).find({ _id: { $ne: user.id } })
      .select('name email avatarUrl role')
      .limit(50);

    return res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
