import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { signIn, getSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Eye, EyeOff, AlertCircle, ArrowRight, Mail, Lock, User, KeyRound, Activity, MapPin, Mic, Users, Zap } from 'lucide-react';

const easeOutExpo = [0.22, 1, 0.36, 1];

const featureItems = [
  { icon: Activity, label: "AI Fear & Emotion Detection", desc: "Real-time vocal distress analysis" },
  { icon: MapPin, label: "Live GPS Sharing", desc: "Instant location to emergency contacts" },
  { icon: Mic, label: "Keyword Voice Trigger", desc: "Say 'help' — SOS fires automatically" },
  { icon: Users, label: "Multi-Contact Alerts", desc: "Notify all your emergency contacts at once" },
];

const stats = [
  { value: "< 3s", label: "Alert Speed" },
  { value: "AI", label: "Detection" },
  { value: "24/7", label: "Active" },
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isPasscodeMode, setIsPasscodeMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    getSession().then(session => { if (session) router.push('/sos'); });
  }, [router]);

  const handlePasscodeLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch('/api/auth/passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        router.push('/sos');
      } else {
        setErrorMsg(data.message || 'Emergency login failed');
      }
    } catch (error) {
      setErrorMsg('Emergency login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      if (isLogin) {
        const result = await signIn('credentials', {
          email: email.toLowerCase().trim(),
          password,
          redirect: false
        });
        if (result?.error) {
          setErrorMsg(result.error || 'Login failed. Please check your credentials.');
        } else if (result?.ok) {
          router.push('/sos');
        }
      } else {
        const response = await fetch('/api/auth/signup', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.toLowerCase().trim(), password }),
        });
        const data = await response.json();
        if (response.ok) {
          setIsLogin(true);
          setErrorMsg("");
          setName(""); setEmail(""); setPassword(""); setPasscode("");
        } else {
          setErrorMsg(data.message || 'Signup failed');
        }
      }
    } catch (error) {
      setErrorMsg("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setErrorMsg("");
    signIn('google', { callbackUrl: '/sos' });
  };

  const formTitle = isPasscodeMode
    ? "Emergency Access"
    : isLogin
      ? "Welcome back"
      : "Create account";

  const formSubtitle = isPasscodeMode
    ? "Enter your emergency passcode for quick access"
    : isLogin
      ? "Sign in to your SOS Emergency account"
      : "Join SOS Emergency and stay protected";

  return (
    <div className="min-h-screen flex bg-bg-base overflow-hidden">
      {/* ── Left Branding Panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, var(--bg-base) 0%, var(--bg-elevated) 40%, var(--bg-surface) 100%)',
          }}
        />

        {/* Dot pattern overlay */}
        <div className="absolute inset-0 opacity-40 dot-pattern" />

        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[15%] left-[20%] w-[420px] h-[420px] rounded-full blur-[100px] animate-orb-float"
            style={{ background: 'rgba(59, 130, 246, 0.07)' }}
          />
          <div
            className="absolute bottom-[20%] right-[15%] w-[360px] h-[360px] rounded-full blur-[100px] animate-orb-float-reverse"
            style={{ background: 'rgba(139, 92, 246, 0.06)' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full blur-[120px] animate-orb-breathe"
            style={{ background: 'rgba(59, 130, 246, 0.04)' }}
          />
        </div>

        {/* Top content */}
        <div className="relative z-10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutExpo }}
            className="flex items-center gap-3.5 mb-20"
          >
            <div className="w-12 h-12 rounded-2xl bg-bg-surface border border-border-default flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-6 h-6 text-accent-gold" />
            </div>
            <div>
              <h1 className="text-text-primary font-bold text-xl tracking-tight">SOS Emergency</h1>
              <p className="text-text-tertiary text-xs tracking-wide">Safety & Rapid Assistance</p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: easeOutExpo }}
            className="mb-14"
          >
            <h2 className="text-[3.25rem] font-bold text-text-primary leading-[1.1] tracking-tight mb-5">
              Your safety,
              <br />
              <span className="text-gradient">always on.</span>
            </h2>
            <p className="text-text-secondary text-base max-w-md leading-relaxed">
              AI-powered emergency detection that watches over you — so help is always one signal away.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="space-y-4"
          >
            {featureItems.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.35 + i * 0.08, ease: easeOutExpo }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-bg-surface border border-border-default flex items-center justify-center shrink-0 transition-all duration-300 group-hover:border-border-hover group-hover:bg-bg-hover">
                    <Icon className="w-[18px] h-[18px] text-accent-gold" />
                  </div>
                  <div>
                    <p className="text-text-primary font-semibold text-sm tracking-tight">{f.label}</p>
                    <p className="text-text-tertiary text-xs">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65, ease: easeOutExpo }}
          className="relative z-10 flex gap-10"
        >
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-text-primary tracking-tight">{s.value}</p>
              <p className="text-text-tertiary text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Background */}
        <div className="absolute inset-0 bg-bg-base" />

        {/* Subtle orbs on right side */}
        <div className="absolute top-1/4 right-0 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'rgba(59, 130, 246, 0.04)' }}
        />
        <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'rgba(139, 92, 246, 0.03)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-bg-surface border border-border-default flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-accent-gold" />
            </div>
            <span className="text-text-primary font-bold text-lg tracking-tight">SOS Emergency</span>
          </div>

          {/* Card */}
          <div className="card-elevated p-8 lg:p-10">
            {/* Header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={formTitle}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: easeOutExpo }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-1.5">
                  {formTitle}
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {formSubtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: easeOutExpo }}
                  className="mb-6 flex items-start gap-3 rounded-xl px-4 py-3 border bg-accent-coral/[0.06] border-accent-coral/[0.18]"
                >
                  <AlertCircle className="w-4 h-4 text-accent-coral mt-0.5 shrink-0" />
                  <p className="text-accent-coral text-sm leading-snug">{errorMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {isPasscodeMode ? (
                <motion.form
                  key="passcode"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3, ease: easeOutExpo }}
                  onSubmit={handlePasscodeLogin}
                  className="space-y-5"
                >
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                      Emergency Passcode
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-gold transition-colors duration-200">
                        <KeyRound className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type="password"
                        required
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="Enter emergency passcode"
                        maxLength={10}
                        className="input py-3.5 rounded-xl pl-10"
                      />
                    </div>
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.97 }}
                    disabled={loading}
                    className="btn-danger w-full py-3.5 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && (
                      <span className="w-4 h-4 border-2 border-text-primary/25 border-t-text-primary rounded-full animate-spin" />
                    )}
                    Emergency Access
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => { setIsPasscodeMode(false); setErrorMsg(""); }}
                    className="w-full text-sm text-text-tertiary hover:text-text-primary transition-colors duration-200 py-2 flex items-center justify-center gap-1.5"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    Back to regular login
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="auth"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3, ease: easeOutExpo }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: easeOutExpo }}
                      >
                        <div className="w-full">
                          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                            Full Name
                          </label>
                          <div className="relative group">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-gold transition-colors duration-200">
                              <User className="w-[18px] h-[18px]" />
                            </div>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Enter your full name"
                              className="input py-3.5 rounded-xl pl-10"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="w-full">
                    <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-gold transition-colors duration-200">
                        <Mail className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="input py-3.5 rounded-xl pl-10"
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-gold transition-colors duration-200">
                        <Lock className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="input py-3.5 rounded-xl pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors duration-200"
                      >
                        {showPassword ? (
                          <EyeOff className="w-[18px] h-[18px]" />
                        ) : (
                          <Eye className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.97 }}
                    disabled={loading}
                    className="btn-primary w-full py-3.5 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && (
                      <span className="w-4 h-4 border-2 border-text-primary/25 border-t-text-primary rounded-full animate-spin" />
                    )}
                    {isLogin ? "Sign In" : "Create Account"}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {!isPasscodeMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--border-default), transparent)' }} />
                  <span className="text-text-muted text-[11px] uppercase tracking-[0.2em] font-medium">or</span>
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--border-default), transparent)' }} />
                </div>

                {/* Google */}
                <motion.button
                  type="button"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="btn-secondary w-full py-3.5 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </motion.button>

                {/* Emergency passcode */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setIsPasscodeMode(true); setErrorMsg(""); }}
                  className="btn-danger w-full mt-3 py-3.5 rounded-xl text-base"
                >
                  <Zap className="w-4 h-4" />
                  Emergency Passcode Access
                </motion.button>
              </motion.div>
            )}

            {/* Toggle login/signup */}
            {!isPasscodeMode && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-center text-text-tertiary text-sm mt-7"
              >
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }}
                  className="text-accent-gold hover:text-accent-gold-light font-semibold transition-colors duration-200 inline-flex items-center gap-1"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.p>
            )}
          </div>

          {/* Bottom legal text */}
          <p className="text-center text-text-muted text-xs mt-6 px-4">
            Protected by enterprise-grade encryption. Your data is never shared.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
