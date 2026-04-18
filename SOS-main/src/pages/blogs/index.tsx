import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  LayoutGrid,
  HeartPulse,
  Siren,
  Stethoscope,
  Brain,
  FileText,
  Clock,
  User,
  Calendar,
  Star,
  Loader2,
  Inbox,
  ChevronRight,
} from 'lucide-react';

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
  { value: 'all', label: 'All', icon: LayoutGrid },
  { value: 'health', label: 'Health', icon: HeartPulse, color: 'text-accent-emerald' },
  { value: 'emergency', label: 'Emergency', icon: Siren, color: 'text-accent-coral' },
  { value: 'first-aid', label: 'First Aid', icon: Stethoscope, color: 'text-accent-blue' },
  { value: 'mental-health', label: 'Mental Health', icon: Brain, color: 'text-accent-purple' },
  { value: 'general', label: 'General', icon: FileText, color: 'text-text-tertiary' },
];

const CAT_COLORS: Record<string, string> = {
  health: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
  emergency: 'bg-accent-coral/10 text-accent-coral border-accent-coral/20',
  'first-aid': 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
  'mental-health': 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
  general: 'bg-text-tertiary/10 text-text-tertiary border-text-tertiary/20',
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
      className="min-h-screen font-sans bg-bg-base"
    >
      <Navbar />

      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <div className="relative pt-20 border-b border-border-default overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-50" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent-gold/5 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-accent-coral/5 blur-[100px]" />

        <div className="relative max-w-5xl mx-auto px-4 py-14 text-center">
          <motion.div
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={heroItemVariants}>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-5 border border-accent-gold/20 bg-accent-gold/10 text-accent-gold animate-float-y">
                <BookOpenIcon className="w-3.5 h-3.5" />
                Safety Knowledge Base
              </span>
            </motion.div>

            <motion.h1
              variants={heroItemVariants}
              className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-text-primary"
            >
              Health & <span className="text-gradient">Emergency</span> Blog
            </motion.h1>

            <motion.p
              variants={heroItemVariants}
              className="max-w-xl mx-auto text-base text-text-secondary"
            >
              Expert guides on first aid, emergency preparedness, mental health, and personal safety.
            </motion.p>

            {/* Search */}
            <motion.div variants={heroItemVariants} className="mt-8 max-w-md mx-auto">
              <div className="input flex items-center gap-3 focus-within:ring-2 focus-within:ring-accent-gold/20 focus-within:border-accent-gold/40">
                <Search className="w-5 h-5 text-text-tertiary shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search articles…"
                  className="flex-1 bg-transparent text-sm outline-none text-text-primary placeholder:text-text-muted"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="p-1 rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Category pills ───────────────────────────────────────────── */}
      <div className="sticky top-[60px] z-30 border-b border-border-default backdrop-blur-xl bg-bg-base/85">
        <div className="max-w-5xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map(cat => {
            const active = selectedCategory === cat.value;
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all
                  ${active
                    ? 'text-bg-base border-transparent'
                    : 'bg-bg-elevated border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-bg-surface'
                  }`}
              >
                {active && (
                  <motion.span
                    layoutId="activeCat"
                    className="absolute inset-0 bg-gradient-to-r from-accent-gold to-accent-gold-light rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${active ? 'text-bg-base' : cat.color}`} />
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
                className="w-12 h-12 rounded-full border-[3px] border-accent-gold/20 border-t-accent-gold"
              />
              <div className="absolute inset-0 rounded-full animate-pulse-ring blur-md opacity-40" />
            </div>
            <p className="text-sm text-text-tertiary">Loading articles…</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <Inbox className="w-16 h-16 mx-auto mb-5 text-text-muted animate-float-y" />
            <p className="font-semibold text-lg mb-1 text-text-secondary">
              {searchTerm ? `No results for "${searchTerm}"` : 'No articles in this category yet'}
            </p>
            <p className="text-sm text-text-tertiary">
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
                    <div className="card relative rounded-2xl overflow-hidden border border-border-default hover:border-accent-gold/30 transition-colors">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/5 to-accent-coral/5" />
                      </div>
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-[45%] h-56 md:h-auto overflow-hidden bg-bg-elevated flex items-center justify-center shrink-0 relative">
                          {featured.imageUrl ? (
                            <img
                              src={featured.imageUrl}
                              alt={featured.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                          ) : (
                            <FileText className="w-20 h-20 text-accent-gold/20" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-bg-base/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                        <div className="flex flex-col justify-between p-6 md:p-8 flex-1 relative">
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${CAT_COLORS[featured.category] || CAT_COLORS.general}`}>
                                {(featured.category || 'general').replace('-', ' ')}
                              </span>
                              <span className="text-xs font-semibold bg-gradient-to-r from-accent-gold to-accent-gold-light text-bg-base px-3 py-1 rounded-full shadow-glow-gold">
                                <span className="inline-flex items-center gap-1">
                                  <Star className="w-3 h-3" /> Featured
                                </span>
                              </span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-snug text-text-primary group-hover:text-accent-gold transition-colors">
                              {featured.title}
                            </h2>
                            <p className="text-sm md:text-[15px] leading-relaxed line-clamp-3 text-text-secondary">
                              {excerpt(featured.content, 200)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 mt-6 pt-5 border-t border-border-default text-xs text-text-tertiary">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-gold to-accent-gold-light flex items-center justify-center text-bg-base font-bold text-[10px] ring-2 ring-border-default">
                                {(featured.author?.name || 'A').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-text-secondary">{featured.author?.name || 'Unknown'}</span>
                            </div>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(featured.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
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
                      className="group flex flex-col h-full rounded-2xl overflow-hidden border border-border-default card hover:border-accent-gold/30 transition-colors"
                    >
                      <div className="h-48 overflow-hidden flex items-center justify-center relative bg-bg-elevated">
                        {blog.imageUrl ? (
                          <img
                            src={blog.imageUrl}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <FileText className="w-12 h-12 text-text-muted/30" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-base/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                      <div className="flex flex-col flex-1 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${CAT_COLORS[blog.category] || CAT_COLORS.general}`}>
                            {(blog.category || 'general').replace('-', ' ')}
                          </span>
                        </div>
                        <h3 className="font-bold text-base mb-2 leading-snug line-clamp-2 text-text-primary group-hover:text-accent-gold transition-colors">
                          {blog.title}
                        </h3>
                        <p className="text-sm line-clamp-2 mb-4 flex-1 text-text-secondary">
                          {excerpt(blog.content)}
                        </p>
                        {blog.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {blog.tags.slice(0, 3).map((t, ti) => (
                              <span key={ti} className="badge-muted">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] pt-3 border-t border-border-default text-text-tertiary">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {blog.author?.name || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
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

/* Helper to avoid direct Lucide import conflict in JSX for the hero label */
function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
