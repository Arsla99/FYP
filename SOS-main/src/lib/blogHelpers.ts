import { connectToDatabase } from '../lib/mongodb';

export async function fetchPublishedBlogs(options: { limit?: number; skip?: number } = {}) {
  const limit = options.limit ?? 100;
  const skip = options.skip ?? 0;
  const { db } = await connectToDatabase();

  const blogs = await db.collection('blogs')
    .find({ $or: [{ published: true }, { isPublished: true }] })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();

  const totalBlogs = await db.collection('blogs').countDocuments({ $or: [{ published: true }, { isPublished: true }] });

  return {
    blogs,
    pagination: {
      totalBlogs,
      currentPage: Math.floor(skip / limit) + 1,
      limit,
      hasMore: (skip + limit) < totalBlogs
    }
  };
}
