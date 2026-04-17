import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get NextAuth session
    const session: any = await getServerSession(req, res, authOptions as any);

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Only administrators can create blog posts',
        currentRole: session.user.role || 'user'
      });
    }

    const { db } = await connectToDatabase();
    
    // Get full user details
    const user = await db.collection('users').findOne({ 
      email: session.user.email 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { title, content, excerpt, tags, category, imageUrl, isPublished } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const blogPost: any = {
      title,
      content,
      excerpt: excerpt || (content ? content.substring(0, 200) + '...' : ''),
      tags: tags || [],
      category: category || 'general',
      imageUrl: imageUrl || '',
      isPublished: isPublished || false,
      published: isPublished || false, // compatibility
      author: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      likes: 0
    };

    const result = await db.collection('blogs').insertOne(blogPost);

    console.log(`✅ Blog post created by admin ${user.email}: ${title}`);

    return res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      blogId: result.insertedId,
      blog: { ...blogPost, _id: result.insertedId }
    });
  } catch (error) {
    console.error('❌ Error creating blog post:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
