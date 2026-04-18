import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../utils/ThemeContext';
import {
  Menu, X, Sun, Moon, ShieldAlert, Crown, User, HelpCircle,
  BookOpen, MessageCircle, Settings, Zap, LayoutDashboard,
  Activity
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/sos', label: 'Dashboard', icon: Activity },
  { href: '/blogs', label: 'Safety Guide', icon: BookOpen },
  { href: '/chat', label: 'Messages', icon: MessageCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (session?.user) setUserRole(session.user.role || 'user');
    else setUserRole(null);
  }, [session]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [router.pathname]);

  const isActive = (href: string) =>
    router.pathname === href || router.pathname.startsWith(href + '/');

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-bg-base/80 backdrop-blur-xl border-b border-border-default'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/sos" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-gold to-accent-gold-light flex items-center justify-center shadow-glow-gold"
            >
              <ShieldAlert className="w-[18px] h-[18px] text-bg-base" />
            </motion.div>
            <div className="hidden sm:block">
              <span className="font-bold text-[15px] tracking-tight text-text-primary">SOS</span>
              <span className="text-text-tertiary text-[15px] tracking-tight ml-1">Emergency</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-[16px] h-[16px]" />
                  {label}
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-bg-surface border border-border-default -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </Link>
              );
            })}
            {userRole !== 'admin' && (
              <Link href="/plans"
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/plans') ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Crown className="w-[16px] h-[16px]" />
                Plans
                {isActive('/plans') && (
                  <motion.div layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-bg-surface border border-border-default -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
                )}
              </Link>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* SOS quick button */}
            <Link href="/sos" className="hidden md:block">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent-coral text-white text-sm font-semibold rounded-xl shadow-glow-coral transition-all"
              >
                <Zap className="w-4 h-4" />
                SOS
              </motion.button>
            </Link>

            {userRole === 'admin' && (
              <Link href="/admin" className="hidden md:flex">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple hover:bg-accent-purple/20 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin
                </motion.button>
              </Link>
            )}

            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            <Link href="/profile" className="flex items-center">
              <motion.div whileHover={{ scale: 1.05 }}
                className="w-9 h-9 rounded-full overflow-hidden border border-border-default bg-bg-hover"
              >
                {session?.user?.image ? (
                  <Image src={session.user.image} width={36} height={36} alt="avatar" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-4 h-4 text-text-tertiary" />
                  </div>
                )}
              </motion.div>
            </Link>

            <motion.button onClick={() => setOpen(!open)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center bg-bg-surface border border-border-default text-text-secondary"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </motion.button>
          </div>
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
            className="md:hidden overflow-hidden bg-bg-elevated border-b border-border-default"
          >
            <div className="px-4 py-3 space-y-0.5">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-bg-surface text-text-primary border border-border-default'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Icon className="w-[17px] h-[17px]" />
                    {label}
                  </Link>
                );
              })}
              {userRole !== 'admin' && (
                <Link href="/plans"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/plans')
                      ? 'bg-bg-surface text-text-primary border border-border-default'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Crown className="w-[17px] h-[17px]" />
                  Plans
                </Link>
              )}
              {userRole === 'admin' && (
                <Link href="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-accent-purple/10 border border-accent-purple/20 text-accent-purple transition-colors"
                >
                  <LayoutDashboard className="w-[17px] h-[17px]" />
                  Admin Panel
                </Link>
              )}
              <Link href="/profile"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                <User className="w-[17px] h-[17px]" />
                My Profile
              </Link>
              <Link href="/support"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                <HelpCircle className="w-[17px] h-[17px]" />
                Help & Support
              </Link>
              <div className="pt-2 mt-1 border-t border-border-default">
                <Link href="/sos" className="block">
                  <button className="w-full py-2.5 bg-accent-coral text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-glow-coral">
                    <Zap className="w-4 h-4" />
                    Emergency SOS
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
