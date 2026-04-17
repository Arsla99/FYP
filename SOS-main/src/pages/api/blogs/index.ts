import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';
import connectDB from '../../../utils/db';
import Blog from '../../../models/Blog';
import { requireAuth, requireAdmin } from '../../../utils/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();
  const { db } = await connectToDatabase();
  const { method } = req;

  switch (method) {
    case 'GET': {
      try {
        const { limit = '10', page = '1', search, category } = req.query;
        const limitNum = parseInt(limit as string);
        const pageNum = parseInt(page as string);
        const skip = (pageNum - 1) * limitNum;

        // Build query: published blogs only (supporting both 'published' and 'isPublished')
        const publishedFilter: any = { $or: [{ published: true }, { isPublished: true }] };

        const query: any = { ...publishedFilter };

        if (category && category !== 'all') {
          query.category = category;
        }

        if (search) {
          query.$or = [
            { title: { $regex: search as string, $options: 'i' } },
            { content: { $regex: search as string, $options: 'i' } },
            { tags: { $in: [new RegExp(search as string, 'i')] } }
          ];
        }

        const rawBlogs = await db
          .collection('blogs')
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .toArray();

        const total = await db.collection('blogs').countDocuments(query);

        // Serialize ObjectId and Date fields for the client
        const blogs = rawBlogs.map((b: any) => ({
          ...b,
          _id: b._id ? b._id.toString() : null,
          createdAt: b.createdAt ? b.createdAt.toString() : null,
          updatedAt: b.updatedAt ? b.updatedAt.toString() : null,
        }));

        // Debugging aid: log and optionally return sample statuses
        try {
          console.log(`📚 /api/blogs GET => requested page=${pageNum} limit=${limitNum} category=${category || 'all'} search=${search || ''}`);
          console.log(`📊 Matched blogs: ${blogs.length}, Total matching in DB: ${total}`);
          const sample = blogs.slice(0, 5).map((b: any) => ({ _id: b._id, title: b.title, isPublished: b.isPublished, published: b.published }));
          console.log('🔎 Sample:', sample);
        } catch (e) {
          console.warn('Could not log debug info for /api/blogs', e);
        }

        const debugMode = (req.query.debug === '1' || req.query.debug === 'true');

        const payload: any = { success: true, blogs, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } };
        if (debugMode) {
          payload.debug = { matched: blogs.length, total, sample: blogs.slice(0, 10).map((b: any) => ({ _id: b._id, title: b.title, isPublished: b.isPublished, published: b.published })) };
        }

        return res.status(200).json(payload);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        return res.status(500).json({ message: 'Error fetching blogs' });
      }
    }

    case 'POST': {
      // create blog (admin only)
      const user = await requireAuth(req, res);
      if (!user) return;
      // only admins allowed
      if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

      try {
        const { title, content, category, tags = [], imageUrl, isPublished = false } = req.body;
        if (!title || !content || !category) return res.status(400).json({ message: 'Title, content, and category are required' });

        const blog = new Blog({ title: title.trim(), content: content.trim(), category, tags, imageUrl, isPublished, author: user.id });
        await blog.save();
        const populated = await (Blog as any).findById(blog._id).populate('author', 'name email');
        return res.status(201).json({ success: true, blog: populated });
      } catch (error) {
        console.error('Error creating blog:', error);
        return res.status(500).json({ message: 'Error creating blog' });
      }
    }

    case 'PUT': {
      const user = await requireAuth(req, res);
      if (!user) return;
      if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

      try {
        const { blogId, title, content, category, tags, imageUrl, isPublished } = req.body;
        if (!blogId) return res.status(400).json({ message: 'Blog ID is required' });

        const updated = await (Blog as any).findByIdAndUpdate(blogId, { title, content, category, tags, imageUrl, isPublished }, { new: true }).populate('author', 'name email');
        if (!updated) return res.status(404).json({ message: 'Blog not found' });
        return res.status(200).json({ success: true, blog: updated });
      } catch (error) {
        console.error('Error updating blog:', error);
        return res.status(500).json({ message: 'Error updating blog' });
      }
    }

    case 'DELETE': {
      const user = await requireAuth(req, res);
      if (!user) return;
      if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

      try {
        const { blogId } = req.body;
        if (!blogId) return res.status(400).json({ message: 'Blog ID is required' });
        const deleted = await (Blog as any).findByIdAndDelete(blogId);
        if (!deleted) return res.status(404).json({ message: 'Blog not found' });
        return res.status(200).json({ success: true, message: 'Blog deleted' });
      } catch (error) {
        console.error('Error deleting blog:', error);
        return res.status(500).json({ message: 'Error deleting blog' });
      }
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
