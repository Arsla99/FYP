import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import connectDB from '../../../utils/db';
import Message from '../../../models/Message';
import { requireAuth } from '../../../utils/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    await connectDB();

    const uid = new mongoose.Types.ObjectId(user.id);

    // Unread counts grouped by sender
    const unreadAgg = await Message.aggregate([
      { $match: { receiverId: uid, read: false } },
      { $group: { _id: '$senderId', count: { $sum: 1 } } },
    ]);

    // Last message per conversation partner
    const lastMsgAgg = await Message.aggregate([
      { $match: { $or: [{ senderId: uid }, { receiverId: uid }] } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', uid] }, '$receiverId', '$senderId'],
          },
          message:     { $first: '$message' },
          messageType: { $first: '$messageType' },
          timestamp:   { $first: '$timestamp' },
          senderId:    { $first: '$senderId' },
        },
      },
    ]);

    const counts: Record<string, number> = {};
    for (const row of unreadAgg) counts[row._id.toString()] = row.count;

    const typeLabels: Record<string, string> = {
      image: '📷 Image',
      video: '🎥 Video',
      voice: '🎤 Voice note',
    };

    const previews: Record<string, { text: string; type: string; timestamp: string; isMine: boolean }> = {};
    for (const row of lastMsgAgg) {
      previews[row._id.toString()] = {
        text: row.messageType !== 'text' ? (typeLabels[row.messageType] || row.message) : row.message,
        type: row.messageType,
        timestamp: row.timestamp,
        isMine: row.senderId.toString() === user.id,
      };
    }

    return res.status(200).json({ counts, previews });
  } catch (error) {
    console.error('Unread error:', error);
    return res.status(500).json({ counts: {}, previews: {} });
  }
}
