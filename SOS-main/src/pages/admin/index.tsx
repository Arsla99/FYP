import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Navbar from '../../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, FileText, ShieldCheck, Trash2, Plus, X, AlertCircle, FileCheck } from 'lucide-react';

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
          <div className="absolute inset-0 rounded-full border-4 border-border-default" />
          <div className="absolute inset-0 rounded-full border-t-4 border-accent-gold animate-spin" />
        </div>
      </div>
    );
  }

  const TABS = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'blogs', label: 'Blogs', icon: FileText },
  ];

  return (
    <div className="min-h-screen font-sans bg-bg-base text-text-primary">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-7xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4" />
            Admin Portal
          </div>
          <h1 className="text-4xl font-extrabold mb-2">
            <span className="text-gradient">
              Admin Dashboard
            </span>
          </h1>
          <p className="text-text-tertiary text-sm">Manage users, content, and platform analytics</p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-10"
        >
          <div className="relative flex p-1 rounded-2xl bg-bg-elevated border border-border-default">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10
                  ${activeTab === tab.key
                    ? 'text-text-primary'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <tab.icon className="w-[17px] h-[17px]" />
                {tab.label}
              </button>
            ))}
            <motion.div
              layoutId="adminTabIndicator"
              className="absolute inset-y-1 bg-gradient-to-r from-accent-gold to-accent-coral rounded-xl -z-0"
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
                { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'from-accent-blue to-accent-blue', shadow: 'shadow-accent-blue/20' },
                { icon: ShieldCheck, label: 'Admin Users', value: stats.adminUsers, color: 'from-accent-emerald to-accent-emerald', shadow: 'shadow-accent-emerald/20' },
                { icon: FileText, label: 'Total Blogs', value: stats.totalBlogs, color: 'from-accent-purple to-accent-purple', shadow: 'shadow-accent-purple/20' },
                { icon: FileCheck, label: 'Published Blogs', value: stats.publishedBlogs, color: 'from-accent-gold to-accent-coral', shadow: 'shadow-accent-gold/20' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="relative overflow-hidden rounded-3xl border border-border-default card p-6 hover-lift"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl -mr-8 -mt-8`} />
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg ${stat.shadow}`}>
                      <stat.icon className="w-5 h-5 text-text-primary" />
                    </div>
                    <p className="text-text-tertiary text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-bold text-text-primary mt-1">{stat.value}</p>
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
              className="rounded-3xl border border-border-default bg-bg-surface overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-border-default flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent-blue" />
                  User Management
                </h2>
                <span className="text-xs text-text-tertiary bg-bg-elevated px-3 py-1 rounded-full border border-border-default">{users.length} users</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border-default bg-bg-elevated/50">
                      <th className="pb-3 pt-3 px-6 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Name</th>
                      <th className="pb-3 pt-3 px-6 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Email</th>
                      <th className="pb-3 pt-3 px-6 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Role</th>
                      <th className="pb-3 pt-3 px-6 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Joined</th>
                      <th className="pb-3 pt-3 px-6 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Contacts</th>
                      <th className="pb-3 pt-3 px-6 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-border-default hover:bg-bg-hover transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-text-primary text-xs font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-text-primary font-medium text-sm">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-text-secondary text-sm">{user.email}</td>
                        <td className="py-4 px-6">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user._id, e.target.value)}
                            className="bg-bg-elevated border border-border-default text-text-primary text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent-purple/30"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-text-secondary text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-text-secondary text-sm">{user.contacts?.length || 0} contacts</td>
                        <td className="py-4 px-6">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => deleteUser(user._id)}
                            className="bg-accent-coral/10 hover:bg-accent-coral/20 text-accent-coral border border-accent-coral/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Delete
                          </motion.button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-12 text-text-tertiary">
                    <Users className="w-10 h-10 text-text-muted mb-2 mx-auto" />
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
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent-purple" />
                  Blog Management
                </h2>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/admin/blogs/create')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold shadow-lg transition-all flex items-center gap-1.5 btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  Create New Blog
                </motion.button>
              </div>
              <div className="grid gap-4">
                {blogs.map((blog) => (
                  <motion.div 
                    key={blog._id} 
                    whileHover={{ scale: 1.005 }}
                    className="rounded-3xl border border-border-default card p-5"
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-text-primary">{blog.title}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                            (blog.isPublished || blog.published)
                              ? 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/20'
                              : 'bg-accent-gold/15 text-accent-gold border border-accent-gold/20'
                          }`}>
                            {(blog.isPublished || blog.published) ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-text-secondary text-sm mb-2">By {blog.author?.name || 'Unknown'} · {blog.category || 'general'}</p>
                        <p className="text-text-tertiary text-sm line-clamp-2">{blog.content.substring(0, 180)}...</p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push(`/admin/blogs/edit/${blog._id}`)}
                          className="bg-bg-elevated hover:bg-bg-hover text-text-primary border border-border-default px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => togglePublish(blog._id, !(blog.isPublished || blog.published))}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            (blog.isPublished || blog.published)
                              ? 'bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold border border-accent-gold/20'
                              : 'bg-accent-emerald/10 hover:bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/20'
                          }`}
                        >
                          {(blog.isPublished || blog.published) ? 'Unpublish' : 'Publish'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-accent-coral/10 hover:bg-accent-coral/20 text-accent-coral border border-accent-coral/20 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Delete
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {blogs.length === 0 && (
                  <div className="text-center py-12 rounded-3xl border border-border-default card">
                    <FileText className="w-10 h-10 text-text-muted mb-2 mx-auto" />
                    <p className="text-text-tertiary">No blogs found</p>
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
