import React from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { connectToDatabase } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, BookOpen, FileText } from 'lucide-react';

interface BlogProps {
  blog: any | null;
  related: any[];
}

const CAT_COLORS: Record<string, string> = {
  health: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
  emergency: 'bg-accent-coral/10 text-accent-coral border-accent-coral/20',
  'first-aid': 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
  'mental-health': 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
  general: 'bg-text-tertiary/10 text-text-tertiary border-text-tertiary/20',
};

function readTime(content: string) {
  const words = (content || '').replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function BlogPage({ blog, related }: BlogProps) {
  if (!blog) {
    return (
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-bg-base text-text-primary"
      >
        <Navbar />
        <FileText className="w-16 h-16 text-text-muted mb-5 animate-float-y" />
        <h2 className="text-2xl font-bold mb-2 text-text-primary">Article not found</h2>
        <p className="text-text-tertiary">This article may have been removed or doesn&apos;t exist.</p>
        <Link href="/blogs">
          <button className="mt-7 px-6 py-3 btn-primary">
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
      className="min-h-screen font-sans bg-bg-base"
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
              className="inline-flex items-center gap-2 text-sm font-medium mb-8 px-4 py-2.5 rounded-xl border border-border-default bg-bg-elevated text-text-tertiary hover:text-text-primary hover:border-border-hover hover:bg-bg-hover transition-all group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              All articles
            </Link>
          </motion.div>

          {/* Category badge */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-5">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${CAT_COLORS[blog.category] || CAT_COLORS.general}`}>
              {(blog.category || 'general').replace('-', ' ')}
            </span>
            <span className="text-xs flex items-center gap-1 text-text-muted">
              <Clock className="w-3.5 h-3.5" />
              {readTime(blog.content)} min read
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="text-3xl md:text-4xl lg:text-[2.6rem] font-extrabold leading-[1.15] mb-6 text-text-primary"
          >
            {blog.title}
          </motion.h1>

          {/* Author row */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-3 pb-6 mb-8 border-b border-border-default"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-gold to-accent-gold-light flex items-center justify-center text-bg-base text-sm font-bold shrink-0 ring-2 ring-border-default">
                {(blog.author?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-accent-emerald border-2 border-bg-base rounded-full" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-text-primary">{blog.author?.name || 'Unknown'}</p>
              <p className="text-xs mt-1 text-text-tertiary">
                {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </motion.div>

          {/* Cover image */}
          {blog.imageUrl && (
            <motion.div
              variants={itemVariants}
              className="rounded-2xl overflow-hidden mb-10 border border-border-default"
            >
              <img src={blog.imageUrl} alt={blog.title} className="w-full h-64 md:h-96 object-cover" />
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            variants={itemVariants}
            className="prose prose-base max-w-none mb-12 p-6 md:p-8 rounded-2xl border border-border-default bg-bg-elevated/50 backdrop-blur-sm
              prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary
              prose-a:text-accent-gold hover:prose-a:text-accent-gold-light prose-li:text-text-secondary
              prose-blockquote:text-text-tertiary prose-blockquote:border-accent-gold/30 prose-code:text-accent-gold
              prose-hr:border-border-default"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Tags */}
          {blog.tags?.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-2 pt-6 pb-6 border-t border-b border-border-default"
            >
              {blog.tags.map((tag: string, i: number) => (
                <Link key={i} href={`/blogs?search=${encodeURIComponent(tag)}`}>
                  <span className="text-xs px-3 py-1.5 rounded-full border border-border-default bg-bg-elevated text-text-tertiary hover:text-text-primary hover:border-border-hover hover:bg-bg-hover transition-colors cursor-pointer">
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
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-text-primary">
              <BookOpen className="w-5 h-5 text-accent-gold" />
              Related Articles
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((r: any) => (
                <Link key={r._id} href={`/blogs/${r._id}`}
                  className="group flex gap-4 p-4 rounded-2xl border border-border-default bg-bg-elevated/50 hover:border-accent-gold/30 hover:bg-bg-hover transition-all hover:-translate-y-0.5"
                >
                  {r.imageUrl ? (
                    <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 relative">
                      <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-20 h-16 rounded-xl flex items-center justify-center shrink-0 bg-bg-hover">
                      <FileText className="w-5 h-5 text-text-muted" />
                    </div>
                  )}
                  <div className="overflow-hidden flex flex-col justify-center">
                    <p className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-accent-gold transition-colors text-text-primary">
                      {r.title}
                    </p>
                    <p className="text-xs mt-1 text-text-muted">
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
