import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../utils/ThemeContext';
import { Menu, X, Sun, Moon, ShieldAlert, Crown, User, HelpCircle } from 'lucide-react';

const NAV_LINKS = [
  { href: '/sos', label: 'Home', icon: 'home' },
  { href: '/blogs', label: 'Blogs', icon: 'article' },
  { href: '/chat', label: 'Chat', icon: 'chat_bubble_outline' },
  { href: '/settings', label: 'Settings', icon: 'tune' },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUserRole(session.user.role || 'user');
    } else {
      setUserRole(null);
    }
  }, [session, status]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [router.pathname]);

  const isActive = (href: string) => router.pathname === href || router.pathname.startsWith(href + '/');

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[96%] md:w-[92%] lg:w-[86%] max-w-6xl
        transition-all duration-500 ease-out-expo
        ${scrolled 
          ? isDark 
            ? 'bg-gray-950/85 border-white/10 shadow-2xl shadow-black/40' 
            : 'bg-white/85 border-black/10 shadow-2xl shadow-black/10'
          : isDark
            ? 'bg-gray-900/60 border-white/8'
            : 'bg-white/70 border-black/8'
        }
        backdrop-blur-2xl border rounded-3xl`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/sos" className="flex items-center gap-3 shrink-0 group">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -2 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30"
          >
            <ShieldAlert className="w-5 h-5 text-white" />
          </motion.div>
          <div className="hidden sm:block leading-tight">
            <span className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>SOS Emergency</span>
            <p className={`text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Safety & Rapid Assistance</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 bg-black/[0.02] light:bg-black/[0.02] rounded-2xl p-1">
          {NAV_LINKS.map(({ href, label, icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? isDark
                      ? 'text-orange-400'
                      : 'text-orange-600'
                    : isDark
                      ? 'text-white/60 hover:text-white'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                <span className={`material-icons text-[17px] ${active ? '' : 'opacity-70'}`}>{icon}</span>
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className={`absolute inset-0 rounded-xl -z-10 ${isDark ? 'bg-white/8' : 'bg-black/5'}`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
          {userRole !== 'admin' && (
            <Link
              href="/plans"
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive('/plans')
                  ? isDark ? 'text-orange-400' : 'text-orange-600'
                  : isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <Crown className="w-4 h-4 opacity-70" />
              Plans
              {isActive('/plans') && (
                <motion.div
                  layoutId="nav-active"
                  className={`absolute inset-0 rounded-xl -z-10 ${isDark ? 'bg-white/8' : 'bg-black/5'}`}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* SOS button */}
          <Link href="/sos" className="hidden md:block">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all"
            >
              <span className="material-icons text-[17px]">sos</span>
              SOS
            </motion.button>
          </Link>

          {/* Admin badge */}
          {userRole === 'admin' && (
            <Link href="/admin" className="hidden md:flex">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3 py-2 border text-sm font-medium rounded-xl transition-colors
                  border-purple-400/40 text-purple-400 hover:bg-purple-500/10"
              >
                <span className="material-icons text-[15px]">admin_panel_settings</span>
                Admin
              </motion.button>
            </Link>
          )}

          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            whileHover={{ scale: 1.08, rotate: isDark ? 15 : -15 }}
            whileTap={{ scale: 0.92 }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
              ${isDark
                ? 'bg-white/8 border border-white/10 hover:bg-white/12'
                : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            {isDark ? (
              <Sun className="w-[18px] h-[18px] text-amber-400" />
            ) : (
              <Moon className="w-[18px] h-[18px] text-indigo-500" />
            )}
          </motion.button>

          {/* Avatar */}
          <Link href="/profile" className="flex items-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all
                ${isDark ? 'border-white/15 bg-white/8' : 'border-gray-200 bg-gray-100'}`}
            >
              {session?.user?.image ? (
                <Image src={session.user.image} width={40} height={40} alt="avatar" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-gray-500'}`} />
                </div>
              )}
            </motion.div>
          </Link>

          {/* Mobile hamburger */}
          <motion.button
            onClick={() => setOpen(!open)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`md:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors
              ${isDark ? 'bg-white/8 border border-white/10' : 'bg-gray-100 border border-gray-200'}`}
          >
            {open ? (
              <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            ) : (
              <Menu className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            )}
          </motion.button>
        </div>
      </div>

      {/* Mobile panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden mx-2 overflow-hidden"
          >
            <div className={`rounded-2xl mb-2 border overflow-hidden
              ${isDark ? 'bg-gray-900/95 border-white/8' : 'bg-white/95 border-gray-200'}`}
            >
              <nav className="p-2 flex flex-col gap-0.5">
                {NAV_LINKS.map(({ href, label, icon }) => {
                  const active = isActive(href);
                  return (
                    <Link key={href} href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                        ${active
                          ? isDark ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-50 text-orange-600'
                          : isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                      <span className="material-icons text-[18px]">{icon}</span>
                      {label}
                    </Link>
                  );
                })}
                {userRole !== 'admin' && (
                  <Link href="/plans"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${isActive('/plans')
                        ? isDark ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-50 text-orange-600'
                        : isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                  >
                    <Crown className="w-[18px] h-[18px]" />
                    Plans
                  </Link>
                )}
                {userRole === 'admin' && (
                  <Link href="/admin"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${isDark ? 'text-purple-400 hover:bg-purple-500/10' : 'text-purple-600 hover:bg-purple-50'}`}
                  >
                    <span className="material-icons text-[18px]">admin_panel_settings</span>
                    Admin Panel
                  </Link>
                )}
                <Link href="/profile"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <User className="w-[18px] h-[18px]" />
                  My Profile
                </Link>
                <Link href="/support"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <HelpCircle className="w-[18px] h-[18px]" />
                  Help & Support
                </Link>
                <div className={`flex items-center gap-2 px-2 pt-2 mt-1 border-t ${isDark ? 'border-white/8' : 'border-gray-200'}`}>
                  <Link href="/sos" className="flex-1">
                    <button className="w-full py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20">
                      <span className="material-icons text-[17px]">sos</span>
                      Emergency SOS
                    </button>
                  </Link>
                  <button
                    onClick={toggleTheme}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                      ${isDark ? 'bg-white/8 text-amber-400' : 'bg-gray-200 text-indigo-500'}`}
                  >
                    {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
