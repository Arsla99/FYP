import React, { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { useTheme } from '../../utils/ThemeContext';
import PageTransition, { StaggerContainer, StaggerItem, FadeIn } from '../../components/animations/PageTransition';
import PremiumButton from '../../components/ui/PremiumButton';
import Input from '../../components/ui/Input';
import SectionTitle from '../../components/ui/SectionTitle';

interface Contact {
  _id?: string;
  name: string;
  phone: string;
  relationship?: string;
}

interface Keyword {
  _id?: string;
  word: string;
}

export default function Settings() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [userRole, setUserRole] = useState<string>('user');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State for emergency contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContact, setNewContact] = useState<Contact>({ name: '', phone: '', relationship: '' });

  // State for emergency keywords
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; type: string; text: string } | null>(null);

  const showToast = (type: string, text: string) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast(null), 3000);
  };

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      // Prefer NextAuth session (cookie-based). If present, use it.
      const session = await getSession();
      if (session?.user?.id) {
        // session.user may not include role in some setups
        setUserRole((session.user as any).role || 'user');
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Fallback to legacy token stored in localStorage (if any)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!token) {
        router.push('/auth');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role || 'user');
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token');
          router.push('/auth');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        router.push('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch user's emergency contacts
  const fetchContacts = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/user/contacts', { headers });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  // Fetch user's emergency keywords
  const fetchKeywords = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/user/keywords', { headers });

      if (response.ok) {
        const data = await response.json();
        setKeywords(data.keywords || []);
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchContacts();
      fetchKeywords();
    }
  }, [isAuthenticated]);

  // Save emergency contact
  const saveContact = async () => {
    if (!newContact.name || !newContact.phone) {
      showToast('error', 'Please fill in name and phone number');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/user/contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify(newContact),
      });

      if (response.ok) {
        showToast('success', 'Contact saved successfully!');
        setNewContact({ name: '', phone: '', relationship: '' });
        fetchContacts();
      } else {
        throw new Error('Failed to save contact');
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      showToast('error', 'Failed to save contact');
    }
  };

  // Delete emergency contact
  const deleteContact = async (contactId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/user/contacts', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ contactId }),
      });

      if (response.ok) {
        showToast('success', 'Contact deleted successfully!');
        fetchContacts();
      } else {
        throw new Error('Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      showToast('error', 'Failed to delete contact');
    }
  };

  // Save emergency keyword
  const saveKeyword = async () => {
    if (!newKeyword.trim()) {
      showToast('error', 'Please enter a keyword');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/user/keywords', {
        method: 'POST',
        headers,
        body: JSON.stringify({ word: newKeyword.trim().toLowerCase() }),
      });

      if (response.ok) {
        showToast('success', 'Keyword saved successfully!');
        setNewKeyword('');
        fetchKeywords();
      } else {
        throw new Error('Failed to save keyword');
      }
    } catch (error) {
      console.error('Error saving keyword:', error);
      showToast('error', 'Failed to save keyword');
    }
  };

  // Delete emergency keyword
  const deleteKeyword = async (keywordId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/user/keywords', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ keywordId }),
      });

      if (response.ok) {
        showToast('success', 'Keyword deleted successfully!');
        fetchKeywords();
      } else {
        throw new Error('Failed to delete keyword');
      }
    } catch (error) {
      console.error('Error deleting keyword:', error);
      showToast('error', 'Failed to delete keyword');
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gray-900/60 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/20 p-12 flex flex-col items-center"
        >
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-white/10" />
            <div className="absolute inset-0 rounded-full border-t-4 border-orange-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-white/5" />
          </div>
          <p className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Loading Settings...</p>
          <p className="text-sm text-white/50 mt-2">Preparing your emergency preferences</p>
        </motion.div>
      </div>
    );
  }

  // Don't render the component if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen text-white font-sans relative overflow-hidden">
      <Navbar />

      <PageTransition className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-3">
              Emergency Settings
            </h1>
            <p className={`text-lg max-w-xl mx-auto ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Configure your emergency contacts and voice-activated keywords
            </p>
          </FadeIn>

          <StaggerContainer className="grid lg:grid-cols-2 gap-8">
            {/* Emergency Contacts Section */}
            <StaggerItem>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="bg-gray-900/60 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/20 hover:shadow-card-hover hover-lift h-full"
              >
                <div className="p-6 md:p-8">
                  <SectionTitle
                    title="Emergency Contacts"
                    subtitle="People who will be notified in an emergency"
                    align="left"
                  />

                  {/* Add New Contact Form */}
                  <div className="mb-6 space-y-4">
                    <Input
                      type="text"
                      placeholder="Contact Name"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    />
                    <Input
                      type="tel"
                      placeholder="Phone Number (+1234567890)"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    />
                    <Input
                      type="text"
                      placeholder="Relationship (optional)"
                      value={newContact.relationship}
                      onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                    />
                    <PremiumButton
                      onClick={saveContact}
                      variant="primary"
                      size="lg"
                      className="w-full"
                      leftIcon={<span className="material-icons text-lg">person_add</span>}
                    >
                      Add Contact
                    </PremiumButton>
                  </div>

                  {/* Existing Contacts List */}
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {contacts.map((contact, index) => (
                        <motion.div
                          key={contact._id || index}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`rounded-2xl p-4 flex justify-between items-start transition-colors ${
                            isDark ? 'bg-white/5 border border-white/[0.05] hover:bg-white/[0.07]' : 'bg-black/[0.03] border border-black/[0.05] hover:bg-black/[0.05]'
                          }`}
                        >
                          <div>
                            <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{contact.name}</div>
                            <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{contact.phone}</div>
                            {contact.relationship && (
                              <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{contact.relationship}</div>
                            )}
                          </div>
                          {contact._id && (
                            <motion.button
                              onClick={() => deleteContact(contact._id!)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-red-400 hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-white/5"
                            >
                              <span className="material-icons">delete</span>
                            </motion.button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {contacts.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-gray-500'}`}
                      >
                        <p>No emergency contacts added yet.</p>
                        <p className="text-sm mt-2 opacity-70">Add contacts above to receive emergency alerts.</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </StaggerItem>

            {/* Emergency Keywords Section */}
            <StaggerItem>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="bg-gray-900/60 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/20 hover:shadow-card-hover hover-lift h-full"
              >
                <div className="p-6 md:p-8">
                  <SectionTitle
                    title="Emergency Keywords"
                    subtitle="Voice triggers that activate emergency detection"
                    align="left"
                  />

                  {/* Add New Keyword Form */}
                  <div className="mb-6 space-y-4">
                    <Input
                      type="text"
                      placeholder="Emergency keyword (e.g., help, danger)"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveKeyword();
                        }
                      }}
                    />
                    <PremiumButton
                      onClick={saveKeyword}
                      variant="primary"
                      size="lg"
                      className="w-full"
                      leftIcon={<span className="material-icons text-lg">add_circle</span>}
                    >
                      Add Keyword
                    </PremiumButton>
                  </div>

                  {/* Existing Keywords List */}
                  <div className="space-y-3">
                    <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      Keywords that will trigger emergency alerts when detected in audio:
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence mode="popLayout">
                        {keywords.map((keyword, index) => (
                          <motion.div
                            key={keyword._id || index}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.25, delay: index * 0.03 }}
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-sm flex items-center shadow-lg shadow-orange-500/20"
                          >
                            {keyword.word}
                            {keyword._id && (
                              <motion.button
                                onClick={() => deleteKeyword(keyword._id!)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="ml-2 text-white/80 hover:text-white transition-colors"
                              >
                                <span className="material-icons text-sm">close</span>
                              </motion.button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {keywords.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-gray-500'}`}
                      >
                        <p>No emergency keywords added yet.</p>
                        <p className="text-sm mt-2 opacity-70">Add keywords above for voice-activated emergency detection.</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          </StaggerContainer>

          {/* Quick Actions */}
          <FadeIn delay={0.3} className="mt-8">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-gray-900/60 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/20 hover:shadow-card-hover hover-lift"
            >
              <div className="p-6 md:p-8">
                <SectionTitle
                  title="Quick Actions"
                  subtitle="Navigate to important sections of the app"
                  align="left"
                />

                <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StaggerItem>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Link
                        href="/sos"
                        className="block bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 p-4 rounded-2xl text-center shadow-lg shadow-red-500/20 transition-all"
                        style={{ color: 'white' }}
                      >
                        <span className="material-icons text-2xl block mb-2">emergency</span>
                        <span className="font-bold">Emergency SOS</span>
                      </Link>
                    </motion.div>
                  </StaggerItem>

                  <StaggerItem>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Link
                        href="/profile"
                        className="block bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 p-4 rounded-2xl text-center shadow-lg shadow-blue-500/20 transition-all"
                        style={{ color: 'white' }}
                      >
                        <span className="material-icons text-2xl block mb-2">person</span>
                        <span className="font-bold">Profile</span>
                      </Link>
                    </motion.div>
                  </StaggerItem>

                  <StaggerItem>
                    <motion.button
                      onClick={() => {
                        localStorage.removeItem('token');
                        router.push('/auth');
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 p-4 rounded-2xl text-center shadow-lg shadow-black/20 transition-all"
                      style={{ color: 'white' }}
                    >
                      <span className="material-icons text-2xl block mb-2">logout</span>
                      <span className="font-bold">Logout</span>
                    </motion.button>
                  </StaggerItem>
                </StaggerContainer>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      </PageTransition>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div
              className={`px-6 py-4 rounded-2xl font-semibold shadow-2xl shadow-black/40 backdrop-blur-2xl border border-white/10 flex items-center gap-3 ${
                toast.type === 'success'
                  ? 'bg-green-500/90 text-white'
                  : toast.type === 'error'
                  ? 'bg-red-500/90 text-white'
                  : toast.type === 'warning'
                  ? 'bg-amber-500/90 text-white'
                  : 'bg-blue-500/90 text-white'
              }`}
            >
              <span className="material-icons">
                {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : toast.type === 'warning' ? 'warning' : 'info'}
              </span>
              <span>{toast.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
