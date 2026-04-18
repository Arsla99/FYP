import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut, getSession } from 'next-auth/react';
import Navbar from "../../components/Navbar";
import Link from 'next/link';
import { User, Heart, Settings, Camera, AtSign, BadgeCheck, Cake, Droplets, FileText, Info, Contact, Link2, CheckCircle2, LogOut, Edit3, Check, X, AlertCircle, ShieldAlert, Crown } from 'lucide-react';

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
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-14 h-14">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-[3px] border-accent-gold/20 border-t-accent-gold"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-1 rounded-full border-[2px] border-accent-coral/20 border-b-accent-coral"
            />
          </div>
          <p className="text-sm font-medium tracking-wide text-text-muted">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4 p-8 text-center bg-bg-base">
        <AlertCircle className="w-12 h-12 text-accent-coral" />
        <p className="font-semibold text-text-primary">{error || 'Profile not found'}</p>
        <button onClick={() => window.location.reload()}
          className="px-6 py-2.5 btn-primary rounded-xl text-sm font-semibold shadow-lg shadow-accent-gold/25 transition-all hover:scale-105 active:scale-95">
          Retry
        </button>
      </div>
    );
  }

  /* ── helpers ── */
  const initials = userData.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const cardBase = `card rounded-3xl border overflow-hidden hover-lift transition-all duration-300`;

  const Field = ({
    label, icon, value, editNode, viewNode,
  }: {
    label: string; icon: React.ReactNode; value?: string | number;
    editNode?: React.ReactNode; viewNode?: React.ReactNode;
  }) => (
    <div className="flex items-start gap-4 py-4 border-b last:border-0 border-border-default">
      <div className="mt-0.5 shrink-0 text-text-muted">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-1 text-text-tertiary">{label}</p>
        {isEditing && editNode
          ? editNode
          : viewNode ?? <p className={`text-sm font-medium ${value ? 'text-text-primary' : 'text-text-muted'}`}>{value || 'Not provided'}</p>
        }
      </div>
    </div>
  );

  const inputCls = `w-full text-sm px-4 py-2.5 rounded-xl border outline-none transition-all duration-200
    focus:ring-2 focus:ring-accent-gold/30 focus:border-accent-gold
    bg-bg-surface border-border-default text-text-primary placeholder-text-muted`;

  const TABS = [
    { key: 'personal' as const, label: 'Personal', icon: User },
    { key: 'health' as const, label: 'Health', icon: Heart },
    { key: 'account' as const, label: 'Account', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen font-sans bg-bg-base">
      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="relative pt-20 pb-0 bg-bg-surface border-b border-border-default backdrop-blur-xl">
          {/* Mesh line decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-gold via-accent-blue to-accent-purple" />
            <div className="absolute -top-20 left-1/4 w-72 h-72 rounded-full blur-[120px] opacity-30 bg-accent-gold/20" />
            <div className="absolute -top-10 right-1/4 w-56 h-56 rounded-full blur-[100px] opacity-20 bg-accent-purple/20" />
          </div>

          <div className="max-w-2xl mx-auto px-4 pt-8 pb-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 pb-6">

              {/* Avatar */}
              <div className="relative shrink-0 group">
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-[3px] ring-accent-gold/40 shadow-glow-gold"
                >
                  {userData.avatarUrl ? (
                    <img src={userData.avatarUrl} alt={userData.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent-gold to-accent-coral flex items-center justify-center text-text-primary text-3xl font-bold">
                      {initials}
                    </div>
                  )}
                </motion.div>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-bg-base/70 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-7 h-7 border-[3px] border-text-muted border-t-text-primary rounded-full" />
                  </div>
                )}
                <label htmlFor="avatar-upload"
                  className="absolute bottom-1 right-1 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-r from-accent-gold to-accent-coral text-text-primary shadow-accent-gold/30 opacity-0 group-hover:opacity-100"
                >
                  <Camera className="w-4 h-4" />
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>

              {/* Name + meta */}
              <div className="flex-1 text-center sm:text-left pb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                    {userData.name}
                  </h1>
                  {userData.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent-purple/15 border border-accent-purple/30 text-accent-purple">
                      <BadgeCheck className="w-3.5 h-3.5" />Admin
                    </span>
                  )}
                </div>
                <p className="text-sm flex items-center justify-center sm:justify-start gap-1.5 text-text-secondary">
                  <AtSign className="w-4 h-4" />
                  {userData.email}
                </p>
                {(userData.googleId || session?.user?.image) && (
                  <div className="mt-2 inline-flex items-center gap-1.5 border text-xs px-2.5 py-1 rounded-full backdrop-blur-sm
                    border-accent-blue/25 bg-accent-blue/8 text-accent-blue"
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
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg btn-secondary"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </motion.button>
                  ) : (
                    <motion.div key="editbtns" className="flex gap-2"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                      <motion.button onClick={handleCancel}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all shadow-md bg-bg-surface border-border-default text-text-secondary hover:bg-bg-hover"
                      >
                        Cancel
                      </motion.button>
                      <motion.button onClick={handleSave} disabled={isSaving}
                        whileHover={{ scale: isSaving ? 1 : 1.05 }} whileTap={{ scale: isSaving ? 1 : 0.95 }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-accent-gold/25 btn-primary"
                      >
                        {isSaving
                          ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-text-muted border-t-text-primary rounded-full inline-block" />
                          : <Check className="w-4 h-4" />
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
                      ? 'text-accent-gold'
                      : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                >
                  <tab.icon className="w-[17px] h-[17px]" />
                  {tab.label}
                </button>
              ))}
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 h-0.5 bg-gradient-to-r from-accent-gold to-accent-coral rounded-full"
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
                  <div className="px-6 py-4 border-b flex items-center gap-2 border-border-default">
                    <User className="w-[18px] h-[18px] text-accent-gold" />
                    <h2 className="text-sm font-semibold text-text-primary">Personal Information</h2>
                  </div>
                  <div className="px-6">
                    <Field label="Full Name" icon={<BadgeCheck className="w-5 h-5" />} value={userData.name}
                      editNode={
                        <input className={inputCls} value={editedData.name || ''} placeholder="Your full name"
                          onChange={e => setEditedData({ ...editedData, name: e.target.value })} />
                      }
                    />
                    <Field label="Email Address" icon={<AtSign className="w-5 h-5" />} value={userData.email}
                      viewNode={<p className="text-sm font-medium text-text-primary">{userData.email}</p>}
                    />
                    <Field label="Age" icon={<Cake className="w-5 h-5" />} value={userData.age}
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
                  <div className="px-6 py-4 border-b flex items-center gap-2 border-border-default">
                    <Heart className="w-[18px] h-[18px] text-accent-coral" />
                    <h2 className="text-sm font-semibold text-text-primary">Health & Medical</h2>
                  </div>
                  <div className="px-6">
                    <Field label="Blood Type" icon={<Droplets className="w-5 h-5" />}
                      value={userData.bloodType}
                      viewNode={
                        userData.bloodType
                          ? <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-accent-coral/15 text-accent-coral border border-accent-coral/25">{userData.bloodType}</span>
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
                    <Field label="Medical Conditions" icon={<FileText className="w-5 h-5" />} value={userData.medicalConditions}
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
                <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl border text-xs backdrop-blur-sm bg-accent-blue/8 border-accent-blue/20 text-accent-blue/90">
                  <Info className="w-[17px] h-[17px] shrink-0 mt-0.5" />
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
                  <div className="px-6 py-4 border-b flex items-center gap-2 border-border-default">
                    <Contact className="w-[18px] h-[18px] text-accent-emerald" />
                    <h2 className="text-sm font-semibold text-text-primary">Emergency Contacts</h2>
                  </div>
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-text-primary">
                        {userData.contacts?.length
                          ? `${userData.contacts.length} contact${userData.contacts.length !== 1 ? 's' : ''} configured`
                          : 'No contacts added yet'
                        }
                      </p>
                      <p className="text-xs mt-0.5 text-text-tertiary">
                        These people get notified when you trigger SOS
                      </p>
                    </div>
                    <Link href="/settings">
                      <motion.button 
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-md bg-bg-elevated border-border-default text-text-primary hover:bg-bg-hover">
                        <Settings className="w-[15px] h-[15px]" />
                        Manage
                      </motion.button>
                    </Link>
                  </div>
                  {userData.contacts && userData.contacts.length > 0 && (
                    <div className="px-6 pb-5 flex flex-wrap gap-2">
                      {userData.contacts.slice(0, 4).map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border backdrop-blur-sm bg-bg-elevated border-border-default text-text-primary"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-emerald to-accent-emerald-light flex items-center justify-center text-text-primary text-[10px] font-bold shrink-0 shadow-lg shadow-accent-emerald/20">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{c.name}</span>
                          {c.relationship && <span className="text-text-muted">· {c.relationship}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Linked accounts */}
                <div className={cardBase}>
                  <div className="px-6 py-4 border-b flex items-center gap-2 border-border-default">
                    <Link2 className="w-[18px] h-[18px] text-accent-blue" />
                    <h2 className="text-sm font-semibold text-text-primary">Linked Accounts</h2>
                  </div>
                  <div className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0 backdrop-blur-sm border-border-default bg-bg-elevated"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">Google</p>
                      <p className="text-xs text-text-tertiary">
                        {userData.googleId ? userData.email : 'Not linked — sign in with Google to connect'}
                      </p>
                    </div>
                    {userData.googleId
                      ? <span className="flex items-center gap-1 text-xs font-semibold text-accent-emerald bg-accent-emerald/10 border border-accent-emerald/20 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />Connected
                        </span>
                      : <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-border-default text-text-muted">
                          Not linked
                        </span>
                    }
                  </div>
                </div>

                {/* Quick links */}
                <div className={cardBase}>
                  <div className="px-6 py-4 border-b flex items-center gap-2 border-border-default">
                    <Settings className="w-[18px] h-[18px] text-text-muted" />
                    <h2 className="text-sm font-semibold text-text-primary">Quick Access</h2>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-y sm:divide-y-0 divide-border-default"
                  >
                    {[
                      { href: '/sos', icon: ShieldAlert, label: 'Emergency SOS', color: 'text-accent-coral' },
                      { href: '/settings', icon: Settings, label: 'Settings', color: 'text-text-muted' },
                      { href: '/plans', icon: Crown, label: 'Plans', color: 'text-accent-gold' },
                    ].map(({ href, icon: Icon, label, color }) => (
                      <Link key={href} href={href}
                        className="flex flex-col items-center gap-1.5 p-4 transition-all duration-200 hover:scale-[1.02] hover:bg-bg-hover"
                      >
                        <Icon className={`w-6 h-6 ${color}`} />
                        <span className="text-xs font-medium text-text-secondary">{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sign out */}
                <motion.button onClick={logout}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-lg btn-danger"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  Sign out
                </motion.button>

                <p className="text-center text-[11px] text-text-muted">
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
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold text-text-primary backdrop-blur-xl border border-border-default
              ${toast.type === 'success' ? 'bg-accent-emerald shadow-accent-emerald/20' : ''}
              ${toast.type === 'error' ? 'bg-accent-coral shadow-accent-coral/20' : ''}
              ${toast.type === 'info' ? 'bg-accent-blue shadow-accent-blue/20' : ''}
              ${toast.type === 'warning' ? 'bg-accent-gold shadow-accent-gold/20' : ''}
            `}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
