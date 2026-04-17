import React from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useTheme } from '../../utils/ThemeContext';
import { connectToDatabase } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { motion } from 'framer-motion';

interface BlogProps {
  blog: any | null;
  related: any[];
}

const CAT_COLORS: Record<string, string> = {
  health: 'bg-green-500/10 text-green-500 border-green-500/20',
  emergency: 'bg-red-500/10 text-red-500 border-red-500/20',
  'first-aid': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'mental-health': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  general: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

function readTime(content: string) {
  const words = (content || '').replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function BlogPage({ blog, related }: BlogProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!blog) {
    return (
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`min-h-screen flex flex-col items-center justify-center p-8 text-center ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}
      >
        <Navbar />
        <span className="material-icons text-6xl text-gray-400 mb-5 animate-float">article</span>
        <h2 className="text-2xl font-bold mb-2">Article not found</h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>This article may have been removed or doesn't exist.</p>
        <Link href="/blogs">
          <button className="mt-7 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]">
            Back to Blogs
          </button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`min-h-screen font-sans ${isDark ? 'bg-gray-950' : 'bg-[#f8f9fa]'}`}
    >
      <Navbar />

      <main className="pt-24 pb-24">
        <motion.article
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-2xl mx-auto px-4"
        >
          {/* Back */}
          <motion.div variants={itemVariants}>
            <Link href="/blogs"
              className={`inline-flex items-center gap-2 text-sm font-medium mb-8 px-4 py-2 rounded-xl border transition-all group
                ${isDark ? 'text-white/60 hover:text-white bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
              `}
            >
              <span className="material-icons text-[18px] transition-transform group-hover:-translate-x-0.5">arrow_back</span>
              All articles
            </Link>
          </motion.div>

          {/* Category badge */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-5">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${CAT_COLORS[blog.category] || CAT_COLORS.general}`}>
              {(blog.category || 'general').replace('-', ' ')}
            </span>
            <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <span className="material-icons text-[14px]">schedule</span>
              {readTime(blog.content)} min read
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className={`text-3xl md:text-4xl lg:text-[2.6rem] font-extrabold leading-[1.15] mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {blog.title}
          </motion.h1>

          {/* Author row */}
          <motion.div
            variants={itemVariants}
            className={`flex items-center gap-3 pb-6 mb-8 border-b ${isDark ? 'border-white/8' : 'border-gray-200'}`}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white/10">
                {(blog.author?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-gray-950 rounded-full" />
            </div>
            <div>
              <p className={`text-sm font-semibold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{blog.author?.name || 'Unknown'}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </motion.div>

          {/* Cover image */}
          {blog.imageUrl && (
            <motion.div
              variants={itemVariants}
              className={`rounded-2xl overflow-hidden mb-10 border ${isDark ? 'border-white/8' : 'border-gray-200'}`}
            >
              <img src={blog.imageUrl} alt={blog.title} className="w-full h-64 md:h-96 object-cover" />
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            variants={itemVariants}
            className={`prose prose-base max-w-none mb-12 p-6 md:p-8 rounded-2xl border glass-card
              ${isDark
                ? 'border-white/8 prose-invert prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-orange-400 prose-li:text-gray-300 prose-blockquote:text-gray-400 prose-blockquote:border-orange-500'
                : 'border-gray-200 prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-orange-600 prose-li:text-gray-700 prose-blockquote:border-orange-400'
              }`}
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Tags */}
          {blog.tags?.length > 0 && (
            <motion.div
              variants={itemVariants}
              className={`flex flex-wrap gap-2 pt-6 pb-6 border-t border-b ${isDark ? 'border-white/8' : 'border-gray-200'}`}
            >
              {blog.tags.map((tag: string, i: number) => (
                <Link key={i} href={`/blogs?search=${encodeURIComponent(tag)}`}>
                  <span className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer
                    ${isDark ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/25 hover:bg-white/10' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 hover:border-gray-300'}
                  `}>
                    #{tag}
                  </span>
                </Link>
              ))}
            </motion.div>
          )}
        </motion.article>

        {/* Related articles */}
        {related.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto px-4 mt-14"
          >
            <h2 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="material-icons text-orange-500">auto_stories</span>
              Related Articles
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((r: any) => (
                <Link key={r._id} href={`/blogs/${r._id}`}
                  className={`group flex gap-4 p-4 rounded-2xl border transition-all hover-lift
                    ${isDark ? 'bg-gray-900/60 border-white/8 hover:border-orange-500/30' : 'bg-white border-gray-200 hover:border-orange-300'}
                  `}
                >
                  {r.imageUrl ? (
                    <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 relative">
                      <img
                        src={r.imageUrl}
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className={`w-20 h-16 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <span className="material-icons text-gray-400">article</span>
                    </div>
                  )}
                  <div className="overflow-hidden flex flex-col justify-center">
                    <p className={`text-sm font-semibold line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {r.title}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </main>
    </motion.div>
  );
}

export async function getServerSideProps(context: any) {
  const { id } = context.params;
  try {
    const { db } = await connectToDatabase();
    if (!ObjectId.isValid(id)) return { props: { blog: null, related: [] } };

    const blog = await db.collection('blogs').findOne({ _id: new ObjectId(id) });
    if (!blog) return { props: { blog: null, related: [] } };

    const related = await db.collection('blogs')
      .find({ _id: { $ne: blog._id }, category: blog.category, $or: [{ published: true }, { isPublished: true }] })
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray();

    const deepSerialize = (value: any): any => {
      if (value === null || value === undefined) return value;
      if (value instanceof ObjectId || (value && (value as any)._bsontype === 'ObjectID')) {
        return value.toString();
      }
      if (value instanceof Date) return value.toString();
      if (Array.isArray(value)) return value.map(deepSerialize);
      if (typeof value === 'object') {
        const out: any = {};
        for (const [k, v] of Object.entries(value)) {
          out[k] = deepSerialize(v);
        }
        return out;
      }
      return value;
    };

    return { props: { blog: deepSerialize(blog), related: related.map(deepSerialize) } };
  } catch (error) {
    console.error('Error in blog page getServerSideProps:', error);
    return { props: { blog: null, related: [] } };
  }
}
