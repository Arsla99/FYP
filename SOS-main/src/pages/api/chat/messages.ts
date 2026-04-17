import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../utils/db';
import Message from '../../../models/Message';
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

    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Fetch messages between current user and the specified user
    const messages = await (Message as any).find({
      $or: [
        { senderId: user.id, receiverId: userId },
        { senderId: userId, receiverId: user.id }
      ]
    })
      .sort({ timestamp: 1 })
      .limit(100);

    // Mark messages as read where current user is receiver
    await Message.updateMany(
      { receiverId: user.id, senderId: userId, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
