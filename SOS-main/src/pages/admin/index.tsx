import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Navbar from '../../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  contacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
}

interface Blog {
  _id: string;
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  published?: boolean;
  author: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlogs: 0,
    publishedBlogs: 0,
    adminUsers: 0
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
      console.log('❌ Not admin, redirecting...', session?.user);
      router.push('/sos');
      return;
    }

    console.log('✅ Admin access granted');
    setLoading(false);
  }, [session, status, router]);

  // Fetch admin data
  useEffect(() => {
    if (!loading) {
      fetchUsers();
      fetchBlogs();
    }
  }, [loading]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setStats(prev => ({
          ...prev,
          totalUsers: data.pagination.totalUsers,
          adminUsers: data.users.filter((user: User) => user.role === 'admin').length
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchBlogs = async () => {
    try {
      // Admin should see ALL blogs, not just published ones
      const response = await fetch('/api/blogs/admin');

      if (response.ok) {
        const data = await response.json();
        const blogsList = data.blogs || [];
        setBlogs(blogsList);
        setStats(prev => ({
          ...prev,
          totalBlogs: blogsList.length,
          publishedBlogs: blogsList.filter((blog: Blog) => blog.isPublished || blog.published).length
        }));
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        fetchUsers();
        alert('User role updated successfully!');
      } else {
        alert('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        fetchUsers();
        alert('User deleted successfully!');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const togglePublish = async (blogId: string, publish: boolean) => {
    if (!confirm(publish ? 'Publish this blog?' : 'Unpublish this blog?')) return;
    try {
      const response = await fetch('/api/blogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId, isPublished: publish })
      });

      if (response.ok) {
        fetchBlogs();
        alert(publish ? 'Blog published' : 'Blog unpublished');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update blog');
      }
    } catch (error) {
      console.error('Error updating blog publish status:', error);
      alert('Error updating blog');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />
          <div className="absolute inset-0 rounded-full border-t-4 border-orange-500 animate-spin" />
        </div>
      </div>
    );
  }

  const TABS = [
    { key: 'overview', label: 'Overview', icon: 'dashboard' },
    { key: 'users', label: 'Users', icon: 'people' },
    { key: 'blogs', label: 'Blogs', icon: 'article' },
  ];

  return (
    <div className="min-h-screen text-white font-sans relative overflow-hidden">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-7xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <span className="material-icons text-sm">admin_panel_settings</span>
            Admin Portal
          </div>
          <h1 className="text-4xl font-extrabold mb-2">
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Admin Dashboard
            </span>
          </h1>
          <p className="text-white/40 text-sm">Manage users, content, and platform analytics</p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-10"
        >
          <div className="relative flex p-1 rounded-2xl bg-white/5 border border-white/10">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10
                  ${activeTab === tab.key
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span className="material-icons text-[17px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
            <motion.div
              layoutId="adminTabIndicator"
              className="absolute inset-y-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl -z-0"
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              style={{
                width: `${100 / TABS.length}%`,
                left: `${TABS.findIndex(t => t.key === activeTab) * (100 / TABS.length)}%`,
              }}
            />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {[
                { icon: 'people', label: 'Total Users', value: stats.totalUsers, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
                { icon: 'admin_panel_settings', label: 'Admin Users', value: stats.adminUsers, color: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/20' },
                { icon: 'article', label: 'Total Blogs', value: stats.totalBlogs, color: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20' },
                { icon: 'publish', label: 'Published Blogs', value: stats.publishedBlogs, color: 'from-orange-500 to-red-600', shadow: 'shadow-orange-500/20' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gray-900/60 backdrop-blur-2xl p-6 shadow-2xl shadow-black/20 hover-lift"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl -mr-8 -mt-8`} />
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg ${stat.shadow}`}>
                      <span className="material-icons text-white text-xl">{stat.icon}</span>
                    </div>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-white/[0.08] bg-gray-900/60 backdrop-blur-2xl shadow-2xl shadow-black/20 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-icons text-blue-400">people</span>
                  User Management
                </h2>
                <span className="text-xs text-white/40 bg-white/5 px-3 py-1 rounded-full border border-white/10">{users.length} users</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="pb-3 pt-3 px-6 text-xs font-semibold text-white/40 uppercase tracking-wider">Name</th>
                      <th className="pb-3 pt-3 px-6 text-xs font-semibold text-white/40 uppercase tracking-wider">Email</th>
                      <th className="pb-3 pt-3 px-6 text-xs font-semibold text-white/40 uppercase tracking-wider">Role</th>
                      <th className="pb-3 pt-3 px-6 text-xs font-semibold text-white/40 uppercase tracking-wider">Joined</th>
                      <th className="pb-3 pt-3 px-6 text-xs font-semibold text-white/40 uppercase tracking-wider">Contacts</th>
                      <th className="pb-3 pt-3 px-6 text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white font-medium text-sm">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-white/60 text-sm">{user.email}</td>
                        <td className="py-4 px-6">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user._id, e.target.value)}
                            className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-white/50 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-white/50 text-sm">{user.contacts?.length || 0} contacts</td>
                        <td className="py-4 px-6">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => deleteUser(user._id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Delete
                          </motion.button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-12 text-white/40">
                    <span className="material-icons text-4xl mb-2">people_outline</span>
                    <p>No users found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Blogs Tab */}
          {activeTab === 'blogs' && (
            <motion.div
              key="blogs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-icons text-purple-400">article</span>
                  Blog Management
                </h2>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/admin/blogs/create')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-green-500/20 transition-all flex items-center gap-1.5"
                >
                  <span className="material-icons text-sm">add</span>
                  Create New Blog
                </motion.button>
              </div>
              <div className="grid gap-4">
                {blogs.map((blog) => (
                  <motion.div 
                    key={blog._id} 
                    whileHover={{ scale: 1.005 }}
                    className="rounded-3xl border border-white/[0.08] bg-gray-900/60 backdrop-blur-2xl p-5 shadow-xl shadow-black/10"
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-white">{blog.title}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                            (blog.isPublished || blog.published)
                              ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          }`}>
                            {(blog.isPublished || blog.published) ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-white/50 text-sm mb-2">By {blog.author?.name || 'Unknown'} · {blog.category || 'general'}</p>
                        <p className="text-white/40 text-sm line-clamp-2">{blog.content.substring(0, 180)}...</p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push(`/admin/blogs/edit/${blog._id}`)}
                          className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => togglePublish(blog._id, !(blog.isPublished || blog.published))}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            (blog.isPublished || blog.published)
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20'
                              : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
                          }`}
                        >
                          {(blog.isPublished || blog.published) ? 'Unpublish' : 'Publish'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Delete
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {blogs.length === 0 && (
                  <div className="text-center py-12 rounded-3xl border border-white/[0.08] bg-gray-900/60">
                    <span className="material-icons text-4xl text-white/20 mb-2">article</span>
                    <p className="text-white/40">No blogs found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
