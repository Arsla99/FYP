import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get NextAuth session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Admin access required',
        currentRole: session.user.role || 'user'
      });
    }

    const { db } = await connectToDatabase();
    
    // Admin sees ALL blogs (published and unpublished)
    const blogs = await db.collection('blogs')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const totalBlogs = blogs.length;
    const publishedCount = blogs.filter((b: any) => b.published || b.isPublished).length;

    console.log(`✅ Admin fetched ${totalBlogs} blogs (${publishedCount} published)`);

    res.status(200).json({
      success: true,
      blogs,
      stats: {
        total: totalBlogs,
        published: publishedCount,
        drafts: totalBlogs - publishedCount
      }
    });
  } catch (error) {
    console.error('❌ Error fetching admin blogs:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
