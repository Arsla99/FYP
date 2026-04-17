import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../utils/db';
import Message from '../../../models/Message';
import User from '../../../models/User';
import { requireAuth } from '../../../utils/serverAuth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb', // allow images/videos/audio
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    await connectDB();

    const { receiverId, message, messageType = 'text', mediaData, mediaMime } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }
    if (messageType === 'text' && (!message || !message.trim())) {
      return res.status(400).json({ message: 'Message text is required for text messages' });
    }
    if (['image', 'video', 'voice'].includes(messageType) && !mediaData) {
      return res.status(400).json({ message: 'Media data is required for media messages' });
    }

    const sender = await (User as any).findById(user.id).select('name avatarUrl');
    if (!sender) return res.status(404).json({ message: 'Sender not found' });

    const receiver = await (User as any).findById(receiverId);
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

    const newMessage = new Message({
      senderId: user.id,
      senderName: sender.name,
      senderAvatar: sender.avatarUrl,
      receiverId,
      message: message?.trim() || '',
      messageType,
      mediaData: mediaData || undefined,
      mediaMime: mediaMime || undefined,
    });

    await newMessage.save();

    return res.status(200).json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
