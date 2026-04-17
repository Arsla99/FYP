import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../utils/db';
import Blog from '../../../models/Blog';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  await connectDB();

  if (method === 'GET') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: 'Missing blog id' });

      const blog = await (Blog as any).findById(id).populate('author', 'name email');
      if (!blog) return res.status(404).json({ message: 'Blog not found' });

      // Fetch related blogs by category (exclude current)
      const related = await (Blog as any).find({
        _id: { $ne: blog._id },
        category: blog.category,
        isPublished: true
      })
        .limit(4)
        .sort({ createdAt: -1 })
        .select('title imageUrl category createdAt');

      return res.status(200).json({ success: true, blog, related });
    } catch (error) {
      console.error('Error fetching blog by id:', error);
      return res.status(500).json({ message: 'Error fetching blog' });
    }
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
