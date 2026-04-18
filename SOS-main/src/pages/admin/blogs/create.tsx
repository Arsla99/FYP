import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Navbar from '../../../components/Navbar';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Send } from 'lucide-react';

export default function CreateBlog() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'health',
    tags: '',
    imageUrl: '',
    isPublished: false
  });

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }

    if (session?.user?.role !== 'admin') {
      console.log('❌ Not admin, redirecting...');
      router.push('/sos');
      return;
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in title and content');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/blog/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        }),
      });

      if (response.ok) {
        alert('Blog created successfully!');
        router.push('/admin');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to create blog');
      }
    } catch (error) {
      console.error('Error creating blog:', error);
      alert('Error creating blog');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="min-h-screen text-text-primary font-sans relative overflow-hidden bg-bg-base">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="mr-4 w-10 h-10 flex items-center justify-center rounded-xl bg-bg-elevated border border-border-default hover:bg-white/10 hover:border-border-hover transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-text-primary" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Create New Blog</h1>
              <p className="text-text-tertiary text-sm mt-0.5">Publish safety and emergency content</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-3xl border border-border-default bg-bg-surface backdrop-blur-2xl p-6 shadow-2xl shadow-black/20">
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full input"
                placeholder="Enter blog title..."
              />
            </div>

            <div className="rounded-3xl border border-border-default bg-bg-surface backdrop-blur-2xl p-6 shadow-2xl shadow-black/20">
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={12}
                className="w-full textarea resize-none"
                placeholder="Write your blog content here..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-3xl border border-border-default bg-bg-surface backdrop-blur-2xl p-6 shadow-2xl shadow-black/20">
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full select"
                >
                  <option value="health" className="bg-bg-surface">Health & Wellness</option>
                  <option value="emergency" className="bg-bg-surface">Emergency Tips</option>
                  <option value="first-aid" className="bg-bg-surface">First Aid</option>
                  <option value="mental-health" className="bg-bg-surface">Mental Health</option>
                  <option value="general" className="bg-bg-surface">General</option>
                </select>
              </div>

              <div className="rounded-3xl border border-border-default bg-bg-surface backdrop-blur-2xl p-6 shadow-2xl shadow-black/20">
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full input"
                  placeholder="emergency, safety, health"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-border-default bg-bg-surface backdrop-blur-2xl p-6 shadow-2xl shadow-black/20">
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Image URL (optional)
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full input"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="rounded-3xl border border-border-default bg-bg-surface backdrop-blur-2xl p-6 shadow-2xl shadow-black/20">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-checked:bg-accent-gold rounded-full transition-all peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md" />
                </div>
                <span className="ml-3 text-text-secondary font-medium">Publish immediately</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create Blog
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
