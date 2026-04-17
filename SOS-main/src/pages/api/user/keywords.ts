import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../utils/db';
import User from '../../../models/User';
import { requireAuth } from '../../../utils/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  // Use server-side auth helper which supports NextAuth sessions and legacy JWT tokens
  const user = await requireAuth(req as any, res as any);
  if (!user) return; // requireAuth already sent response

  const { method } = req;

  try {
    const userDoc = await (User as any).findById(user.id);
    if (!userDoc) return res.status(404).json({ message: 'User not found' });

    switch (method) {
      case 'GET':
        return res.status(200).json({ keywords: userDoc.keywords || [] });

      case 'POST': {
        const { keyword } = req.body;
        if (!keyword || typeof keyword !== 'string') return res.status(400).json({ message: 'Invalid keyword' });
        const trimmed = keyword.trim().toLowerCase();
        if (!trimmed) return res.status(400).json({ message: 'Keyword cannot be empty' });
        userDoc.keywords = userDoc.keywords || [];
        if (userDoc.keywords.includes(trimmed)) return res.status(400).json({ message: 'Keyword already exists' });
        userDoc.keywords.push(trimmed);
        await userDoc.save();
        return res.status(201).json({ message: 'Keyword added successfully', keywords: userDoc.keywords });
      }

      case 'DELETE': {
        const { keyword } = req.body;
        if (!keyword || typeof keyword !== 'string') return res.status(400).json({ message: 'Invalid keyword' });
        const trimmed = keyword.trim().toLowerCase();
        userDoc.keywords = userDoc.keywords || [];
        const idx = userDoc.keywords.indexOf(trimmed);
        if (idx === -1) return res.status(404).json({ message: 'Keyword not found' });
        userDoc.keywords.splice(idx, 1);
        await userDoc.save();
        return res.status(200).json({ message: 'Keyword deleted successfully', keywords: userDoc.keywords });
      }

      case 'PUT': {
        const { keywords } = req.body;
        if (!Array.isArray(keywords)) return res.status(400).json({ message: 'Keywords must be an array' });
        const cleaned = keywords
          .map((k: any) => (typeof k === 'string' ? k.trim().toLowerCase() : ''))
          .filter((k: string) => k.length > 0)
          .filter((k: string, i: number, arr: string[]) => arr.indexOf(k) === i);
        userDoc.keywords = cleaned;
        await userDoc.save();
        return res.status(200).json({ message: 'Keywords updated successfully', keywords: userDoc.keywords });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PUT']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in keywords handler:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
