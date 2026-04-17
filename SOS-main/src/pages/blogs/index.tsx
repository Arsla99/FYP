import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../utils/ThemeContext';

interface Blog {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  author: { name: string; email: string };
  createdAt: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All', icon: 'apps' },
  { value: 'health', label: 'Health', icon: 'favorite', color: 'text-green-500' },
  { value: 'emergency', label: 'Emergency', icon: 'warning', color: 'text-red-500' },
  { value: 'first-aid', label: 'First Aid', icon: 'medical_services', color: 'text-blue-500' },
  { value: 'mental-health', label: 'Mental Health', icon: 'psychology', color: 'text-purple-500' },
  { value: 'general', label: 'General', icon: 'article', color: 'text-gray-400' },
];

const CAT_COLORS: Record<string, string> = {
  health: 'bg-green-500/10 text-green-500 border-green-500/20',
  emergency: 'bg-red-500/10 text-red-500 border-red-red-500/20',
  'first-aid': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'mental-health': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  general: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

function readTime(content: string) {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function excerpt(content: string, len = 120) {
  const plain = content.replace(/<[^>]+>/g, '');
  return plain.length > len ? plain.slice(0, len) + '…' : plain;
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

const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const gridItemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Blogs() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchBlogs(); }, [selectedCategory]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const cat = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const res = await fetch(`/api/blogs?limit=50${cat}`);
      if (res.ok) {
        const data = await res.json();
        setBlogs(data.blogs || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = blogs.filter(b => {
    const term = searchTerm.toLowerCase();
    return (b.title || '').toLowerCase().includes(term) ||
      (b.content || '').toLowerCase().includes(term) ||
      (b.tags || []).some(t => (t || '').toLowerCase().includes(term));
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`min-h-screen font-sans ${isDark ? 'bg-gray-950' : 'bg-[#f8f9fa]'}`}
    >
      <Navbar />

      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <div className={`pt-20 border-b ${isDark ? 'bg-gray-900/50 border-white/6' : 'bg-white border-gray-200'}`}>
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <motion.div
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={heroItemVariants}>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-5 border animate-float
                ${isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                <span className="material-icons text-sm">local_library</span>
                Safety Knowledge Base
              </span>
            </motion.div>

            <motion.h1 variants={heroItemVariants}
              className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Health & <span className="gradient-text">Emergency</span> Blog
            </motion.h1>

            <motion.p variants={heroItemVariants}
              className={`max-w-xl mx-auto text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Expert guides on first aid, emergency preparedness, mental health, and personal safety.
            </motion.p>

            {/* Search */}
            <motion.div variants={heroItemVariants} className="mt-8 max-w-md mx-auto">
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-orange-500/30
                ${isDark ? 'bg-gray-800 border-white/10 focus-within:border-orange-500/40' : 'bg-white border-gray-200 shadow-sm focus-within:border-orange-300'}`}>
                <span className={`material-icons text-[20px] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>search</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search articles…"
                  className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className={`transition-colors ${isDark ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <span className="material-icons text-[18px]">close</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Category pills ───────────────────────────────────────────── */}
      <div className={`sticky top-[60px] z-30 border-b backdrop-blur-xl ${isDark ? 'bg-gray-950/85 border-white/6' : 'bg-[#f8f9fa]/90 border-gray-200'}`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map(cat => {
            const active = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors
                  ${active
                    ? 'text-white border-transparent'
                    : isDark
                      ? 'bg-gray-900/60 border-white/8 text-white/60 hover:text-white hover:border-white/25 hover:bg-gray-900'
                      : 'bg-white/80 border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-white'
                  }`}
              >
                {active && (
                  <motion.span
                    layoutId="activeCat"
                    className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="material-icons text-[15px] relative z-10">{cat.icon}</span>
                <span className="relative z-10">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-10 pb-24">
        {loading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-5"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 rounded-full border-[3px] border-orange-500/20 border-t-orange-500"
              />
              <div className="absolute inset-0 rounded-full animate-pulse-glow blur-md opacity-40" />
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading articles…</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <span className={`material-icons text-6xl mb-5 block animate-float ${isDark ? 'text-white/15' : 'text-gray-300'}`}>article</span>
            <p className={`font-semibold text-lg mb-1 ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
              {searchTerm ? `No results for "${searchTerm}"` : 'No articles in this category yet'}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Try adjusting your search or pick another category.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory + searchTerm}
              variants={gridContainerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Featured post */}
              {featured && !searchTerm && (
                <motion.div variants={gridItemVariants} className="mb-12">
                  <Link href={`/blogs/${featured._id}`} className="group block">
                    <div className={`relative rounded-2xl overflow-hidden border glass-card hover-lift
                      ${isDark ? 'border-white/8 hover:border-orange-500/30' : 'border-gray-200 hover:border-orange-300'}
                    `}>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5" />
                      </div>
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-[45%] h-56 md:h-auto overflow-hidden bg-gradient-to-br from-orange-600/20 to-red-600/20 flex items-center justify-center shrink-0 relative">
                          {featured.imageUrl ? (
                            <img
                              src={featured.imageUrl}
                              alt={featured.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                          ) : (
                            <span className={`material-icons text-7xl ${isDark ? 'text-orange-500/30' : 'text-orange-300'}`}>article</span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                        <div className="flex flex-col justify-between p-6 md:p-8 flex-1 relative">
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${CAT_COLORS[featured.category] || CAT_COLORS.general}`}>
                                {(featured.category || 'general').replace('-', ' ')}
                              </span>
                              <span className="text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full shadow-md shadow-orange-500/20">
                                ✦ Featured
                              </span>
                            </div>
                            <h2 className={`text-2xl md:text-3xl font-bold mb-3 leading-snug group-hover:text-orange-500 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {featured.title}
                            </h2>
                            <p className={`text-sm md:text-[15px] leading-relaxed line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {excerpt(featured.content, 200)}
                            </p>
                          </div>
                          <div className={`flex items-center gap-4 mt-6 pt-5 border-t text-xs ${isDark ? 'border-white/6 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white/10">
                                {(featured.author?.name || 'A').charAt(0).toUpperCase()}
                              </div>
                              <span>{featured.author?.name || 'Unknown'}</span>
                            </div>
                            <span>{new Date(featured.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="flex items-center gap-1">
                              <span className="material-icons text-[14px]">schedule</span>
                              {readTime(featured.content)} min read
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(searchTerm ? filtered : rest).map((blog) => (
                  <motion.div key={blog._id} variants={gridItemVariants}>
                    <Link href={`/blogs/${blog._id}`}
                      className={`flex flex-col h-full rounded-2xl overflow-hidden border group glass-card hover-lift transition-colors
                        ${isDark ? 'border-white/8 hover:border-orange-500/30' : 'border-gray-200 hover:border-orange-300'}
                      `}
                    >
                      <div className={`h-48 overflow-hidden flex items-center justify-center relative ${isDark ? 'bg-white/4' : 'bg-gray-50'}`}>
                        {blog.imageUrl ? (
                          <img
                            src={blog.imageUrl}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <span className={`material-icons text-5xl ${isDark ? 'text-white/10' : 'text-gray-200'}`}>article</span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                      <div className="flex flex-col flex-1 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${CAT_COLORS[blog.category] || CAT_COLORS.general}`}>
                            {(blog.category || 'general').replace('-', ' ')}
                          </span>
                        </div>
                        <h3 className={`font-bold text-base mb-2 leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {blog.title}
                        </h3>
                        <p className={`text-sm line-clamp-2 mb-4 flex-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {excerpt(blog.content)}
                        </p>
                        {blog.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {blog.tags.slice(0, 3).map((t, ti) => (
                              <span key={ti} className={`text-[10px] px-2 py-0.5 rounded border ${isDark ? 'bg-white/4 border-white/8 text-white/40' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className={`flex items-center justify-between text-[11px] pt-3 border-t ${isDark ? 'border-white/6 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
                          <span>{blog.author?.name || 'Unknown'}</span>
                          <span className="flex items-center gap-1">
                            <span className="material-icons text-[13px]">schedule</span>
                            {readTime(blog.content)} min
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </motion.div>
  );
}
