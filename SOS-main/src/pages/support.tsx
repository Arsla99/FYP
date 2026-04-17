import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useTheme } from '../utils/ThemeContext';

// ─── FAQ Data ──────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'How does the SOS alert work?',
    a: 'When you press the SOS button, the app captures your current GPS location and sends an SMS message to all your configured emergency contacts via Twilio. The message includes a Google Maps link to your exact position.',
  },
  {
    q: 'What is fear / emotion detection?',
    a: 'The app can optionally listen to ambient audio through your microphone and use a speech-emotion model to detect signs of distress (fear, panic). If high fear is detected, the app can automatically trigger an alert on your behalf.',
  },
  {
    q: 'Does the app work with the phone screen off?',
    a: 'The app uses the Web Wake Lock API to keep the screen active while monitoring is running. For full background operation on mobile, we recommend adding the app to your home screen (PWA) and keeping the screen partially on.',
  },
  {
    q: 'How do I add emergency contacts?',
    a: 'Go to Settings → Emergency Contacts. You can add contacts with their name, phone number (with country code), and relationship. These contacts will be notified when you trigger an SOS.',
  },
  {
    q: 'What subscription plans are available?',
    a: 'We offer Free, Basic, and Pro plans. The Free plan includes 3 emergency contacts and basic monitoring. Basic and Pro plans include unlimited contacts, priority SMS, and advanced emotion analysis features.',
  },
  {
    q: 'Can I sign in with Google?',
    a: 'Yes. Click "Sign in with Google" on the login screen. Your Google name, email, and profile photo are synced to your SOS account automatically.',
  },
  {
    q: 'Is my location data stored?',
    a: 'Location data is only used in real time during an active SOS session to generate the alert message. It is not stored persistently in our database after the alert is sent.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Password reset is currently in development. As a temporary measure, please contact support with your registered email address and we will assist you manually.',
  },
];

// ─── Emergency Numbers ──────────────────────────────────────────────────────────
const EMERGENCY_NUMBERS = [
  { country: 'Pakistan', numbers: [{ label: 'Rescue / Ambulance', num: '1122' }, { label: 'Police', num: '15' }, { label: 'Fire Brigade', num: '16' }, { label: 'Edhi Foundation', num: '115' }, { label: 'NDMA', num: '1700' }] },
  { country: 'International', numbers: [{ label: 'Global Emergency', num: '911' }, { label: 'EU Emergency', num: '112' }, { label: 'UK Emergency', num: '999' }] },
];

// ─── Sub-components ─────────────────────────────────────────────────────────────
function FaqItem({ q, a, isDark }: { q: string; a: string; isDark: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gray-900/40 backdrop-blur-xl overflow-hidden transition-colors duration-200 hover:bg-white/[0.03]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 transition-colors hover:bg-white/[0.02]"
      >
        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{q}</span>
        <span className={`material-icons text-[18px] shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''} ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
          add
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className={`px-5 pb-4 text-sm leading-relaxed border-t border-white/[0.06] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function Support() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('sending');
    // Simulate a short delay — replace with a real API call if desired
    await new Promise(r => setTimeout(r, 1400));
    setStatus('sent');
  };

  return (
    <>
      <Head>
        <title>Support — SOS Emergency</title>
      </Head>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={`min-h-screen font-sans ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}
      >
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-28 pb-20">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-500 px-4 py-1.5 rounded-full text-xs font-semibold mb-4">
              <span className="material-icons text-sm">support_agent</span>
              Help Centre
            </div>
            <h1 className={`text-3xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              How can we help you?
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Browse frequently asked questions, check emergency numbers, or send us a message.
            </p>
          </motion.div>

          {/* Quick link cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
            {[
              { icon: 'quiz', label: 'FAQs', desc: 'Browse common questions', href: '#faq' },
              { icon: 'emergency', label: 'Emergency Numbers', desc: 'Pakistan & international', href: '#numbers' },
              { icon: 'mail', label: 'Contact Us', desc: 'Send a message', href: '#contact' },
            ].map((cardItem, i) => (
              <motion.a
                key={cardItem.label}
                href={cardItem.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center text-center gap-2 p-5 rounded-3xl border border-white/[0.08] bg-gray-900/60 backdrop-blur-2xl shadow-2xl shadow-black/20 hover-lift transition-colors"
              >
                <span className="material-icons text-2xl text-orange-500">{cardItem.icon}</span>
                <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{cardItem.label}</span>
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{cardItem.desc}</span>
              </motion.a>
            ))}
          </div>

          {/* FAQ Section */}
          <section id="faq" className="mb-14">
            <h2 className={`text-xl font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="material-icons text-orange-500">quiz</span>
              Frequently Asked Questions
            </h2>
            <div className="flex flex-col gap-3">
              {FAQ_ITEMS.map(item => (
                <FaqItem key={item.q} q={item.q} a={item.a} isDark={isDark} />
              ))}
            </div>
          </section>

          {/* Emergency Numbers */}
          <section id="numbers" className="mb-14">
            <h2 className={`text-xl font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="material-icons text-red-500">emergency</span>
              Emergency Numbers
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {EMERGENCY_NUMBERS.map(group => (
                <motion.div
                  key={group.country}
                  whileHover={{ y: -2 }}
                  className="rounded-3xl border border-white/[0.08] bg-gray-900/60 backdrop-blur-2xl shadow-2xl shadow-black/20 p-5 hover-lift"
                >
                  <h3 className={`font-semibold text-sm mb-3 flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="w-1.5 h-4 rounded-full bg-red-500 inline-block" />
                    {group.country}
                  </h3>
                  <ul className="space-y-2">
                    {group.numbers.map(n => (
                      <li key={n.num} className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{n.label}</span>
                        <a href={`tel:${n.num}`}
                          className="font-bold text-red-500 text-sm bg-red-500/10 px-2.5 py-0.5 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          {n.num}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Contact Form */}
          <section id="contact">
            <h2 className={`text-xl font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="material-icons text-blue-500">mail</span>
              Contact Us
            </h2>
            <div className="rounded-3xl border border-white/[0.08] bg-gray-900/60 backdrop-blur-2xl shadow-2xl shadow-black/20 p-6 md:p-8">
              {status === 'sent' ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                    <span className="material-icons text-3xl text-green-400">check_circle</span>
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Message Sent!</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Thanks for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-5 inline-flex items-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/20"
                  >
                    <span className="material-icons text-[18px]">refresh</span>
                    Send another message
                  </motion.button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                        placeholder="John Doe"
                        className="auth-input"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email Address *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                        placeholder="you@example.com"
                        className="auth-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. SOS not sending alerts"
                      className="auth-input"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Message *</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      required
                      rows={5}
                      placeholder="Describe your issue or question in detail..."
                      className="auth-input resize-none"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={status === 'sending'}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-3 auth-btn-primary flex items-center justify-center gap-2"
                  >
                    {status === 'sending' ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        <span className="material-icons text-[18px]">send</span>
                        Send Message
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </div>
          </section>

          <div className={`text-center text-xs mt-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            SOS Emergency © 2025 ·{' '}
            <Link href="/privacy-policy" className="text-orange-500">Privacy Policy</Link>
          </div>
        </main>
      </motion.div>
    </>
  );
}
