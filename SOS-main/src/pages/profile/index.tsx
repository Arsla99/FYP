import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut, getSession } from 'next-auth/react';
import Navbar from "../../components/Navbar";
import Link from 'next/link';
import { useTheme } from '../../utils/ThemeContext';

interface UserData {
  _id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  googleId?: string;
  bloodType?: string;
  age?: number;
  medicalConditions?: string;
  role?: string;
  contacts?: Array<{
    name: string;
    phone: string;
    relationship?: string;
  }>;
}

export default function Profile() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<UserData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, type: string, text: string } | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'health' | 'account'>('personal');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const showToast = (type: string, text: string) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchUserData = async () => {
        try {
        // Prefer NextAuth session (cookie). If not present, fallback to legacy token.
        const session = await getSession();
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (!session && !token) {
          router.push('/auth');
          return;
        }

        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/user/me', {
          method: 'GET',
          headers,
          credentials: 'same-origin',
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            router.push('/auth');
            return;
          }
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUserData({
          ...data,
          avatarUrl: data.avatarUrl || session?.user?.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(data.name) + "&background=f97316&color=fff&size=200",
        });
        setEditedData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchUserData();
    }
  }, [router, status, session]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({ ...userData });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ ...userData });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(editedData),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedData = await response.json();
      setUserData(updatedData.user);
      setIsEditing(false);
      showToast('success', '✅ Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('error', '❌ Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'File size must be less than 2MB');
      return;
    }

    setIsUploadingAvatar(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Update immediately in UI
        setUserData(prev => prev ? { ...prev, avatarUrl: base64String } : null);
        setEditedData(prev => ({ ...prev, avatarUrl: base64String }));
        
        // Save to backend
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/user/update-profile', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ avatarUrl: base64String }),
          credentials: 'same-origin',
        });

        if (response.ok) {
          showToast('success', '📸 Profile picture updated!');
        } else {
          throw new Error('Failed to upload');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      showToast('error', '❌ Failed to upload picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    await signOut({ redirect: false });
    setUserData(null);
    router.push('/auth');
  };

  if (isLoading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-14 h-14">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-[3px] border-orange-500/20 border-t-orange-500"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-1 rounded-full border-[2px] border-red-500/20 border-b-red-500"
            />
          </div>
          <p className={`text-sm font-medium tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className={`flex min-h-screen items-center justify-center flex-col gap-4 p-8 text-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <span className="material-icons text-5xl text-red-400">error_outline</span>
        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{error || 'Profile not found'}</p>
        <button onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95">
          Retry
        </button>
      </div>
    );
  }

  /* ── helpers ── */
  const initials = userData.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const cardBase = `rounded-3xl border overflow-hidden backdrop-blur-2xl shadow-2xl shadow-black/10 hover-lift transition-all duration-300
    ${isDark ? 'bg-gray-900/60 border-white/[0.08]' : 'bg-white/70 border-gray-200/60'}`;

  const Field = ({
    label, icon, value, editNode, viewNode,
  }: {
    label: string; icon: string; value?: string | number;
    editNode?: React.ReactNode; viewNode?: React.ReactNode;
  }) => (
    <div className={`flex items-start gap-4 py-4 border-b last:border-0
      ${isDark ? 'border-white/6' : 'border-gray-100'}`}
    >
      <span className={`material-icons text-[20px] mt-0.5 shrink-0 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-white/35' : 'text-gray-400'}`}>{label}</p>
        {isEditing && editNode
          ? editNode
          : viewNode ?? <p className={`text-sm font-medium ${value ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-white/25' : 'text-gray-400')}`}>{value || 'Not provided'}</p>
        }
      </div>
    </div>
  );

  const inputCls = `w-full text-sm px-4 py-2.5 rounded-xl border outline-none transition-all duration-200
    focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:shadow-[0_0_20px_rgba(249,115,22,0.12)]
    ${isDark ? 'bg-gray-800/80 border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`;

  const TABS = [
    { key: 'personal', label: 'Personal', icon: 'person' },
    { key: 'health', label: 'Health', icon: 'favorite' },
    { key: 'account', label: 'Account', icon: 'manage_accounts' },
  ] as const;

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'bg-gray-950' : 'bg-[#f8f9fa]'}`}>
      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className={`relative pt-20 pb-0 ${isDark ? 'bg-gray-900/40' : 'bg-white/60'} border-b ${isDark ? 'border-white/6' : 'border-gray-200/60'} backdrop-blur-xl`}>
          {/* Mesh line decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />
            <div className={`absolute -top-20 left-1/4 w-72 h-72 rounded-full blur-[120px] opacity-30 ${isDark ? 'bg-orange-500/20' : 'bg-orange-400/20'}`} />
            <div className={`absolute -top-10 right-1/4 w-56 h-56 rounded-full blur-[100px] opacity-20 ${isDark ? 'bg-pink-500/20' : 'bg-pink-400/15'}`} />
          </div>

          <div className="max-w-2xl mx-auto px-4 pt-8 pb-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 pb-6">

              {/* Avatar */}
              <div className="relative shrink-0 group">
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-[3px] shadow-xl shadow-black/20
                    ${isDark 
                      ? 'ring-orange-500/40 shadow-[0_0_40px_rgba(249,115,22,0.25)]' 
                      : 'ring-orange-400/50 shadow-[0_0_30px_rgba(249,115,22,0.20)]'}`}
                >
                  {userData.avatarUrl ? (
                    <img src={userData.avatarUrl} alt={userData.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-3xl font-bold">
                      {initials}
                    </div>
                  )}
                </motion.div>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-7 h-7 border-[3px] border-white/30 border-t-white rounded-full" />
                  </div>
                )}
                <label htmlFor="avatar-upload"
                  className={`absolute bottom-1 right-1 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all duration-300 hover:scale-110 active:scale-95
                    ${isDark 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/30' 
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/30'}
                    opacity-0 group-hover:opacity-100`}
                >
                  <span className="material-icons text-[17px]">photo_camera</span>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>

              {/* Name + meta */}
              <div className="flex-1 text-center sm:text-left pb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {userData.name}
                  </h1>
                  {userData.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 border border-purple-400/30 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                      <span className="material-icons text-[13px]">verified</span>Admin
                    </span>
                  )}
                </div>
                <p className={`text-sm flex items-center justify-center sm:justify-start gap-1.5 ${isDark ? 'text-white/45' : 'text-gray-500'}`}>
                  <span className="material-icons text-[16px]">alternate_email</span>
                  {userData.email}
                </p>
                {(userData.googleId || session?.user?.image) && (
                  <div className="mt-2 inline-flex items-center gap-1.5 border text-xs px-2.5 py-1 rounded-full backdrop-blur-sm
                    border-blue-400/25 bg-blue-500/8 text-blue-500"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="font-medium">Signed in with Google</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pb-1 shrink-0">
                <AnimatePresence mode="wait">
                  {!isEditing ? (
                    <motion.button key="edit"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={handleEdit}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border shadow-lg
                        ${isDark
                          ? 'bg-white/8 border-white/10 text-white hover:bg-white/15 shadow-black/20'
                          : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 shadow-gray-200/50'}`}
                    >
                      <span className="material-icons text-[17px]">edit</span>
                      Edit
                    </motion.button>
                  ) : (
                    <motion.div key="editbtns" className="flex gap-2"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                      <motion.button onClick={handleCancel}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all shadow-md
                          ${isDark ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 shadow-black/20' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 shadow-gray-200/40'}`}
                      >
                        Cancel
                      </motion.button>
                      <motion.button onClick={handleSave} disabled={isSaving}
                        whileHover={{ scale: isSaving ? 1 : 1.05 }} whileTap={{ scale: isSaving ? 1 : 0.95 }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-orange-500/25 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        {isSaving
                          ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full inline-block" />
                          : <span className="material-icons text-[16px]">check</span>
                        }
                        Save
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Tabs */}
            <div className="relative flex gap-0">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors z-10
                    ${activeTab === tab.key
                      ? 'text-orange-500'
                      : `${isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-500 hover:text-gray-700'}`
                    }`}
                >
                  <span className="material-icons text-[17px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                style={{
                  width: TABS.find(t => t.key === activeTab) ? `${100 / TABS.length}%` : '0%',
                  left: `${TABS.findIndex(t => t.key === activeTab) * (100 / TABS.length)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Tab Content ───────────────────────────────────────────────────── */}
        <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
          <AnimatePresence mode="wait">

            {/* Personal Tab */}
            {activeTab === 'personal' && (
              <motion.div key="personal"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={cardBase}>
                  <div className={`px-6 py-4 border-b flex items-center gap-2 ${isDark ? 'border-white/6' : 'border-gray-100'}`}>
                    <span className="material-icons text-[18px] text-orange-500">person</span>
                    <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Personal Information</h2>
                  </div>
                  <div className="px-6">
                    <Field label="Full Name" icon="badge" value={userData.name}
                      editNode={
                        <input className={inputCls} value={editedData.name || ''} placeholder="Your full name"
                          onChange={e => setEditedData({ ...editedData, name: e.target.value })} />
                      }
                    />
                    <Field label="Email Address" icon="alternate_email" value={userData.email}
                      viewNode={<p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{userData.email}</p>}
                    />
                    <Field label="Age" icon="cake" value={userData.age}
                      editNode={
                        <input type="number" className={inputCls} value={editedData.age || ''} placeholder="Your age"
                          onChange={e => setEditedData({ ...editedData, age: parseInt(e.target.value) || undefined })} />
                      }
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Health Tab */}
            {activeTab === 'health' && (
              <motion.div key="health"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={cardBase}>
                  <div className={`px-6 py-4 border-b flex items-center gap-2 ${isDark ? 'border-white/6' : 'border-gray-100'}`}>
                    <span className="material-icons text-[18px] text-red-500">favorite</span>
                    <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Health & Medical</h2>
                  </div>
                  <div className="px-6">
                    <Field label="Blood Type" icon="water_drop"
                      value={userData.bloodType}
                      viewNode={
                        userData.bloodType
                          ? <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-500/15 text-red-500 border border-red-400/25 shadow-[0_0_12px_rgba(239,68,68,0.12)]">{userData.bloodType}</span>
                          : undefined
                      }
                      editNode={
                        <select className={inputCls} value={editedData.bloodType || ''}
                          onChange={e => setEditedData({ ...editedData, bloodType: e.target.value })}>
                          <option value="">Select blood type</option>
                          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                        </select>
                      }
                    />
                    <Field label="Medical Conditions" icon="medical_information" value={userData.medicalConditions}
                      editNode={
                        <textarea rows={4} className={inputCls + ' resize-none'}
                          value={editedData.medicalConditions || ''}
                          placeholder="Allergies, chronic conditions, medications…"
                          onChange={e => setEditedData({ ...editedData, medicalConditions: e.target.value })} />
                      }
                    />
                  </div>
                </div>

                {/* Health info note */}
                <div className={`mt-4 flex items-start gap-3 p-4 rounded-2xl border text-xs backdrop-blur-sm
                  ${isDark ? 'bg-blue-500/8 border-blue-400/20 text-blue-400/90' : 'bg-blue-50/80 border-blue-200 text-blue-700'}`}>
                  <span className="material-icons text-[17px] shrink-0 mt-0.5">info</span>
                  <p>This information is included in your SOS alert so first responders know about critical health conditions.</p>
                </div>
              </motion.div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <motion.div key="account" className="space-y-4"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Emergency Contacts */}
                <div className={cardBase}>
                  <div className={`px-6 py-4 border-b flex items-center gap-2 ${isDark ? 'border-white/6' : 'border-gray-100'}`}>
                    <span className="material-icons text-[18px] text-green-500">contacts</span>
                    <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Emergency Contacts</h2>
                  </div>
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {userData.contacts?.length
                          ? `${userData.contacts.length} contact${userData.contacts.length !== 1 ? 's' : ''} configured`
                          : 'No contacts added yet'
                        }
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-white/35' : 'text-gray-500'}`}>
                        These people get notified when you trigger SOS
                      </p>
                    </div>
                    <Link href="/settings">
                      <motion.button 
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-md
                          ${isDark ? 'bg-white/8 border-white/10 text-white hover:bg-white/15 shadow-black/20' : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 shadow-gray-200/50'}`}>
                        <span className="material-icons text-[15px]">manage_accounts</span>
                        Manage
                      </motion.button>
                    </Link>
                  </div>
                  {userData.contacts && userData.contacts.length > 0 && (
                    <div className={`px-6 pb-5 flex flex-wrap gap-2`}>
                      {userData.contacts.slice(0, 4).map((c, i) => (
                        <div key={i} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border backdrop-blur-sm
                          ${isDark ? 'bg-white/5 border-white/10 text-white/80' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-lg shadow-green-500/20">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{c.name}</span>
                          {c.relationship && <span className={isDark ? 'text-white/30' : 'text-gray-400'}>· {c.relationship}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Linked accounts */}
                <div className={cardBase}>
                  <div className={`px-6 py-4 border-b flex items-center gap-2 ${isDark ? 'border-white/6' : 'border-gray-100'}`}>
                    <span className="material-icons text-[18px] text-blue-400">link</span>
                    <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Linked Accounts</h2>
                  </div>
                  <div className="px-6 py-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 backdrop-blur-sm
                      ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Google</p>
                      <p className={`text-xs ${isDark ? 'text-white/35' : 'text-gray-500'}`}>
                        {userData.googleId ? userData.email : 'Not linked — sign in with Google to connect'}
                      </p>
                    </div>
                    {userData.googleId
                      ? <span className="flex items-center gap-1 text-xs font-semibold text-green-500 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.10)]">
                          <span className="material-icons text-[13px]">check_circle</span>Connected
                        </span>
                      : <span className={`text-xs font-medium px-2.5 py-1 rounded-full border
                          ${isDark ? 'border-white/10 text-white/30' : 'border-gray-200 text-gray-400'}`}>
                          Not linked
                        </span>
                    }
                  </div>
                </div>

                {/* Quick links */}
                <div className={cardBase}>
                  <div className={`px-6 py-4 border-b flex items-center gap-2 ${isDark ? 'border-white/6' : 'border-gray-100'}`}>
                    <span className="material-icons text-[18px] text-gray-400">apps</span>
                    <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Access</h2>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-y
                    sm:divide-y-0
                    divide-gray-100 dark:divide-white/6"
                  >
                    {[
                      { href: '/sos', icon: 'sos', label: 'Emergency SOS', color: 'text-red-500' },
                      { href: '/settings', icon: 'tune', label: 'Settings', color: isDark ? 'text-white/50' : 'text-gray-500' },
                      { href: '/plans', icon: 'workspace_premium', label: 'Plans', color: 'text-amber-500' },
                    ].map(({ href, icon, label, color }) => (
                      <Link key={href} href={href}
                        className={`flex flex-col items-center gap-1.5 p-4 transition-all duration-200 hover:scale-[1.02]
                          ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50/80'}`}
                      >
                        <span className={`material-icons text-2xl ${color}`}>{icon}</span>
                        <span className={`text-xs font-medium ${isDark ? 'text-white/50' : 'text-gray-600'}`}>{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sign out */}
                <motion.button onClick={logout}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold border transition-all shadow-lg
                    ${isDark
                      ? 'border-red-500/20 bg-red-500/8 text-red-400 hover:bg-red-500/15 shadow-red-500/10'
                      : 'border-red-200 bg-red-50/80 text-red-600 hover:bg-red-100 shadow-red-500/10'
                    }`}
                >
                  <span className="material-icons text-[18px]">logout</span>
                  Sign out
                </motion.button>

                <p className={`text-center text-[11px] ${isDark ? 'text-white/20' : 'text-gray-400'}`}>
                  <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
                  {' · '}
                  <Link href="/support" className="hover:underline">Help & Support</Link>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast?.show && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold text-white backdrop-blur-xl border border-white/10
              ${toast.type === 'success' ? 'bg-emerald-600/90 shadow-emerald-500/20' : ''}
              ${toast.type === 'error' ? 'bg-red-600/90 shadow-red-500/20' : ''}
              ${toast.type === 'info' ? 'bg-blue-600/90 shadow-blue-500/20' : ''}
              ${toast.type === 'warning' ? 'bg-orange-500/90 shadow-orange-500/20' : ''}
            `}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
