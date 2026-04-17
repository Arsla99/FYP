import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Navbar from '../../components/Navbar';
import { useTheme } from '../../utils/ThemeContext';

type MsgType = 'text' | 'image' | 'video' | 'voice';

interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  message: string;
  messageType: MsgType;
  mediaData?: string;
  mediaMime?: string;
  timestamp: Date;
  read: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

interface Preview {
  text: string;
  type: string;
  timestamp: string;
  isMine: boolean;
}

// ─── helpers ────────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Avatar({ name, src, size = 'md' }: { name: string; src?: string | null; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (src) return <img src={src} alt={name} className={`${sz} rounded-full object-cover shrink-0 ring-2 ring-white/10`} />;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-white/10`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Message bubble ──────────────────────────────────────────────────────────
function MsgBubble({ msg, isOwn, isDark }: { msg: Message; isOwn: boolean; isDark: boolean }) {
  const bubble = isOwn
    ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-[20px] rounded-br-[6px] shadow-lg shadow-orange-500/20'
    : isDark
      ? 'bg-gray-800/80 backdrop-blur-md text-white rounded-[20px] rounded-bl-[6px] border border-white/[0.08] shadow-md'
      : 'bg-white/90 backdrop-blur-md border border-black/5 text-gray-900 rounded-[20px] rounded-bl-[6px] shadow-sm';

  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`flex gap-3 items-end ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {!isOwn && <Avatar name={msg.senderName} src={msg.senderAvatar} size="sm" />}
      <div className={`max-w-[72%] md:max-w-[55%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className={`text-[11px] font-medium mb-1 ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{msg.senderName}</span>
        )}
        <motion.div whileHover={{ scale: 1.01 }} className={`${bubble} px-4 py-3`}>
          {msg.messageType === 'text' && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
          )}
          {msg.messageType === 'image' && msg.mediaData && (
            <div>
              <img src={msg.mediaData} alt="image" className="rounded-xl max-w-[260px] max-h-[300px] object-cover cursor-pointer"
                onClick={() => window.open(msg.mediaData, '_blank')} />
              {msg.message && <p className="text-sm mt-1.5 leading-relaxed">{msg.message}</p>}
            </div>
          )}
          {msg.messageType === 'video' && msg.mediaData && (
            <div>
              <video src={msg.mediaData} controls className="rounded-xl max-w-[260px] max-h-[240px]" />
              {msg.message && <p className="text-sm mt-1.5">{msg.message}</p>}
            </div>
          )}
          {msg.messageType === 'voice' && msg.mediaData && (
            <div className="flex items-center gap-2 min-w-[180px]">
              <span className={`material-icons text-[20px] ${isOwn ? 'text-white/80' : 'text-orange-500'}`}>mic</span>
              <audio src={msg.mediaData} controls className="h-8 w-full" style={{ filter: isOwn ? 'invert(1) hue-rotate(180deg)' : 'none' }} />
            </div>
          )}
        </motion.div>
        <span className={`text-[10px] mt-1.5 mx-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{time}</span>
      </div>
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Chat() {
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Notifications
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [previews, setPreviews] = useState<Record<string, Preview>>({});
  const prevUnreadRef = useRef<Record<string, number>>({});
  const notifPermRef = useRef(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Media preview
  const [pendingMedia, setPendingMedia] = useState<{ data: string; mime: string; type: MsgType } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Fetch current user
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;
    fetch('/api/user/me').then(r => r.json()).then(d => {
      setCurrentUserId(d.id || d._id?.toString() || '');
    }).catch(console.error);
  }, [status, session]);

  // Fetch users list
  useEffect(() => {
    if (status !== 'authenticated' || !currentUserId) return;
    setIsLoading(true);
    fetch('/api/chat/users').then(r => r.json()).then(d => {
      setUsers(d.users || []);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, [status, currentUserId]);

  // Poll messages
  useEffect(() => {
    if (!selectedUser) return;
    const fetch_ = () => {
      fetch(`/api/chat/messages?userId=${selectedUser._id}`)
        .then(r => r.json()).then(d => setMessages(d.messages || [])).catch(console.error);
    };
    fetch_();
    const interval = setInterval(fetch_, 3000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  // Redirect if unauth
  useEffect(() => {
    if (status === 'unauthenticated') window.location.href = '/auth';
  }, [status]);

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => { notifPermRef.current = p === 'granted'; });
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      notifPermRef.current = Notification.permission === 'granted';
    }
  }, []);

  // Poll unread counts + previews every 5s
  useEffect(() => {
    if (!currentUserId) return;
    const poll = () => {
      fetch('/api/chat/unread')
        .then(r => r.json())
        .then(({ counts, previews: prev }: { counts: Record<string,number>; previews: Record<string,Preview> }) => {
          // Fire browser notification for newly unread messages from non-active user
          if (notifPermRef.current) {
            for (const [uid, count] of Object.entries(counts)) {
              const wasUnread = prevUnreadRef.current[uid] || 0;
              if (count > wasUnread && uid !== selectedUser?._id) {
                const sender = users.find(u => u._id === uid);
                const preview = prev[uid];
                new Notification(`New message from ${sender?.name || 'Someone'}`, {
                  body: preview?.text || 'Sent you a message',
                  icon: sender?.avatarUrl || '/favicon.ico',
                  tag: uid,
                });
              }
            }
          }
          prevUnreadRef.current = counts;
          setUnreadCounts(counts);
          setPreviews(prev);
        })
        .catch(console.error);
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [currentUserId, selectedUser, users]);

  // Clear unread for selected user
  useEffect(() => {
    if (!selectedUser) return;
    setUnreadCounts(prev => { const n = { ...prev }; delete n[selectedUser._id]; return n; });
    prevUnreadRef.current = { ...prevUnreadRef.current, [selectedUser._id]: 0 };
  }, [selectedUser]);

  const sendMessage = async (opts?: { type?: MsgType; mediaData?: string; mediaMime?: string }) => {
    if (!selectedUser || isSending) return;
    const type = opts?.type || 'text';
    if (type === 'text' && !newMessage.trim() && !pendingMedia) return;

    setIsSending(true);
    try {
      const body: any = {
        receiverId: selectedUser._id,
        message: newMessage.trim(),
        messageType: opts?.type || (pendingMedia ? pendingMedia.type : 'text'),
        mediaData: opts?.mediaData || pendingMedia?.data,
        mediaMime: opts?.mediaMime || pendingMedia?.mime,
      };
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        setPendingMedia(null);
      }
    } catch (e) { console.error(e); }
    finally { setIsSending(false); }
  };

  // ── Image / video pick ──────────────────────────────────────────────────────
  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10MB'); return; }
    const data = await fileToBase64(file);
    setPendingMedia({ data, mime: file.type, type });
    e.target.value = '';
  };

  // ── Voice recording ─────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size < 100) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const data = reader.result as string;
          await sendMessage({ type: 'voice', mediaData: data, mediaMime: 'audio/webm' });
        };
        reader.readAsDataURL(blob);
        setRecordingSeconds(0);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch { alert('Microphone access denied'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
  };

  const formatSeconds = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Loading states ──────────────────────────────────────────────────────────
  if (status === 'loading' || (isLoading && !currentUserId)) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full" />
          <p className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading chat…</p>
        </div>
      </div>
    );
  }

  // Sort: unread first, then by last message time
  const sortedUsers = [...users].sort((a, b) => {
    const ua = unreadCounts[a._id] || 0;
    const ub = unreadCounts[b._id] || 0;
    if (ub !== ua) return ub - ua;
    const ta = previews[a._id]?.timestamp ? new Date(previews[a._id].timestamp).getTime() : 0;
    const tb = previews[b._id]?.timestamp ? new Date(previews[b._id].timestamp).getTime() : 0;
    return tb - ta;
  });

  const filteredUsers = sortedUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className={`flex flex-col h-screen font-sans ${isDark ? 'bg-gray-950' : 'bg-[#f0f2f5]'}`}
    >
      <Navbar />

      <div className="flex flex-1 overflow-hidden pt-[64px]">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className={`${selectedUser ? 'hidden md:flex' : 'flex'} flex-col
          w-full md:w-[320px] lg:w-[340px] shrink-0 border-r border-white/[0.08] overflow-hidden
          bg-gray-900/60 backdrop-blur-2xl shadow-2xl shadow-black/20`}
        >
          {/* Sidebar header */}
          <div className="px-5 py-5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <h1 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Messages</h1>
              {totalUnread > 0 && (
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-lg shadow-orange-500/30">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
            <div className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all
              bg-white/5 border-white/[0.08] focus-within:border-orange-500/50 focus-within:bg-white/10`}>
              <span className={`material-icons text-[18px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>search</span>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search users…"
                className={`flex-1 text-sm bg-transparent outline-none ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
              />
            </div>
          </div>

          {/* Users list */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <span className={`material-icons text-4xl mb-3 ${isDark ? 'text-white/20' : 'text-gray-300'}`}>person_search</span>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No users found</p>
              </motion.div>
            ) : filteredUsers.map(user => (
              <button key={user._id} onClick={() => setSelectedUser(user)}
                className={`group w-full flex items-center gap-4 px-5 py-4 text-left transition-all duration-200
                  ${selectedUser?._id === user._id
                    ? 'bg-gradient-to-r from-orange-500/15 to-transparent border-r-2 border-orange-500'
                    : unreadCounts[user._id] > 0
                      ? 'bg-orange-500/5 hover:bg-orange-500/10'
                      : 'hover:bg-white/5'
                  }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={user.name} src={user.avatarUrl} />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white dark:border-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className={`text-sm truncate ${
                        unreadCounts[user._id] > 0
                          ? isDark ? 'text-white font-bold' : 'text-gray-900 font-bold'
                          : isDark ? 'text-white font-semibold' : 'text-gray-900 font-semibold'
                      }`}>{user.name}</p>
                      {user.role === 'admin' && <span className="material-icons text-purple-400 text-[13px]">verified</span>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {previews[user._id]?.timestamp && (
                        <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {(() => {
                            const d = new Date(previews[user._id].timestamp);
                            const now = new Date();
                            const isToday = d.toDateString() === now.toDateString();
                            return isToday
                              ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                          })()}
                        </span>
                      )}
                      {unreadCounts[user._id] > 0 && (
                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-md shadow-orange-500/20">
                          {unreadCounts[user._id] > 99 ? '99+' : unreadCounts[user._id]}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${
                    unreadCounts[user._id] > 0
                      ? isDark ? 'text-white/70' : 'text-gray-700'
                      : isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {previews[user._id]
                      ? `${previews[user._id].isMine ? 'You: ' : ''}${previews[user._id].text}`
                      : user.email
                    }
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Chat panel ───────────────────────────────────────────────────── */}
        <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-hidden`}>
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08] shrink-0 bg-gray-900/60 backdrop-blur-2xl">
                <button onClick={() => setSelectedUser(null)}
                  className={`md:hidden p-2 rounded-xl mr-1 transition-colors ${isDark ? 'hover:bg-white/8' : 'hover:bg-gray-100'}`}
                >
                  <span className={`material-icons text-[20px] ${isDark ? 'text-white' : 'text-gray-700'}`}>arrow_back</span>
                </button>
                <Avatar name={selectedUser.name} src={selectedUser.avatarUrl} />
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.name}</p>
                  <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-green-400' : 'text-green-500'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />Online
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className={`flex-1 overflow-y-auto px-5 py-6 space-y-4 ${isDark ? 'bg-gray-950' : 'bg-[#efeae2]'}`}
                style={{ backgroundImage: isDark ? undefined : 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d9d5c8\' fill-opacity=\'0.35\'%3E%3Cpath d=\'M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10C10 20 5.523 24.477 5.523 30S10 40 10 40s-4.477 4.477-4.477 10S10 60 10 60s4.477-4.477 10-4.477S30 60 30 60v-10c5.523 0 10-4.477 10-10s-4.477-10-10-10V20c5.523 0 10-4.477 10-10S30 0 20 0 10 4.477 10 10z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
              >
                {messages.length === 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center py-16">
                    <div className="bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl p-8 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                        <span className="material-icons text-3xl text-orange-500">chat_bubble_outline</span>
                      </div>
                      <p className={`font-semibold ${isDark ? 'text-white/70' : 'text-gray-600'}`}>No messages yet</p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                        Send a message, voice note, image, or video
                      </p>
                    </div>
                  </motion.div>
                ) : messages.map(msg => (
                  <MsgBubble key={msg._id} msg={msg} isOwn={msg.senderId === currentUserId} isDark={isDark} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Media preview */}
              <AnimatePresence>
                {pendingMedia && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                    className="px-5 pt-4 border-t border-white/[0.08] flex items-center gap-4 bg-gray-900/60 backdrop-blur-2xl"
                  >
                    {pendingMedia.type === 'image' && (
                      <img src={pendingMedia.data} className="h-16 w-16 object-cover rounded-xl border border-white/10" />
                    )}
                    {pendingMedia.type === 'video' && (
                      <video src={pendingMedia.data} className="h-16 w-24 object-cover rounded-xl" />
                    )}
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        {pendingMedia.type === 'image' ? 'Image' : 'Video'} ready to send
                      </p>
                    </div>
                    <button onClick={() => setPendingMedia(null)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all duration-200">
                      <span className="material-icons text-[18px]">close</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input bar */}
              <div className="px-4 py-4 border-t border-white/[0.08] shrink-0 bg-gray-900/60 backdrop-blur-2xl">
                <div className="flex items-end gap-2">

                  {/* Media buttons */}
                  <div className="flex items-center gap-1 shrink-0 pb-1">
                    <button onClick={() => fileInputRef.current?.click()}
                      title="Send image"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all duration-200">
                      <span className="material-icons text-[20px]">image</span>
                    </button>
                    <button onClick={() => videoInputRef.current?.click()}
                      title="Send video"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all duration-200">
                      <span className="material-icons text-[20px]">videocam</span>
                    </button>
                  </div>

                  {/* Hidden file inputs */}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFilePick(e, 'image')} />
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFilePick(e, 'video')} />

                  {/* Text / recording area */}
                  {isRecording ? (
                    <div className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl border
                      ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
                      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                      <span className="text-red-500 font-mono text-sm font-semibold">{formatSeconds(recordingSeconds)}</span>
                      <span className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Recording…</span>
                    </div>
                  ) : (
                    <input ref={textInputRef} type="text" value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Type a message…"
                      className={`flex-1 px-4 py-3 rounded-2xl border text-sm outline-none transition-all
                        focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50
                        ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                    />
                  )}

                  {/* Voice / Send button */}
                  {(newMessage.trim() || pendingMedia) ? (
                    <motion.button onClick={() => sendMessage()} disabled={isSending}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 shrink-0"
                    >
                      {isSending
                        ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="material-icons text-[18px]">sync</motion.span>
                        : <span className="material-icons text-[18px]">send</span>
                      }
                    </motion.button>
                  ) : (
                    <motion.button
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      title="Hold to record voice message"
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0
                        ${isRecording
                          ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/30'
                          : 'p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                        }`}
                    >
                      <span className="material-icons text-[20px]">mic</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className={`flex-1 flex flex-col items-center justify-center text-center px-8 ${isDark ? 'bg-gray-950' : 'bg-[#f0f2f5]'}`}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900/60 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/20 p-10 max-w-md">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 mx-auto
                  bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-white/10`}>
                  <span className="material-icons text-4xl text-orange-500">forum</span>
                </div>
                <p className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>SOS Chat</p>
                <p className={`text-sm max-w-xs mx-auto ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Select a contact from the list to start a conversation. You can send text, images, videos, and voice notes.
                </p>
                <div className="flex gap-5 mt-6 justify-center">
                  {[{icon:'image',label:'Images'},{icon:'videocam',label:'Video'},{icon:'mic',label:'Voice'}].map(f => (
                    <div key={f.label} className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
                        <span className="material-icons text-[18px] text-orange-500">{f.icon}</span>
                      </div>
                      <span className={`text-[10px] font-medium ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
