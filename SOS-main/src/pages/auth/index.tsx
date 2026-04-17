import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { signIn, getSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Eye, EyeOff, AlertCircle, ArrowRight, Mail, Lock, User, KeyRound } from 'lucide-react';
import PremiumButton from "../../components/ui/PremiumButton";
import Input from "../../components/ui/Input";

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

  return (
    <div className="min-h-screen flex bg-gray-950 overflow-hidden">
      {/* ── Left Branding Panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-red-950/30 to-orange-950/20" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-orb-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-orb-slow-reverse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-3xl animate-orb-pulse" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-4 mb-16"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-2xl shadow-orange-500/30">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl leading-tight">SOS Emergency</h1>
              <p className="text-orange-400/80 text-sm">Safety & Rapid Assistance</p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12"
          >
            <h2 className="text-5xl font-extrabold text-white leading-tight mb-4">
              Your safety,<br />
              <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                always on.
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-sm">
              AI-powered emergency detection that watches over you — so help is always one signal away.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-5"
          >
            {[
              { icon: "graphic_eq", label: "AI Fear & Emotion Detection", desc: "Real-time vocal distress analysis" },
              { icon: "location_on", label: "Live GPS Sharing", desc: "Instant location to emergency contacts" },
              { icon: "record_voice_over", label: "Keyword Voice Trigger", desc: "Say 'help' — SOS fires automatically" },
              { icon: "contacts", label: "Multi-Contact Alerts", desc: "Notify all your emergency contacts at once" },
            ].map((f, i) => (
              <motion.div 
                key={f.label} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                  <span className="material-icons text-orange-400 text-lg">{f.icon}</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.label}</p>
                  <p className="text-gray-500 text-xs">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative z-10 flex gap-8"
        >
          {[
            { value: "< 3s", label: "Alert Speed" },
            { value: "AI", label: "Detection" },
            { value: "24/7", label: "Active" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute inset-0 bg-gray-950 lg:bg-gray-900/60 backdrop-blur-xl" />
        {/* Subtle orbs on mobile/right side */}
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">SOS Emergency</span>
          </div>

          {/* Card */}
          <div className="relative">
            {/* Gradient border glow */}
            <div className="absolute -inset-[1px] bg-gradient-to-br from-orange-500/20 via-red-500/10 to-transparent rounded-3xl blur-sm" />
            
            <div className="relative bg-gray-900/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {isPasscodeMode ? "Emergency Access" : isLogin ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-gray-400 text-sm">
                  {isPasscodeMode
                    ? "Enter your emergency passcode for quick access"
                    : isLogin
                      ? "Sign in to your SOS Emergency account"
                      : "Join SOS Emergency and stay protected"}
                </p>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-red-400 text-sm">{errorMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {isPasscodeMode ? (
                <form onSubmit={handlePasscodeLogin} className="space-y-5">
                  <Input
                    label="Emergency Passcode"
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter emergency passcode"
                    maxLength={10}
                    leftIcon={<KeyRound className="w-[18px] h-[18px]" />}
                  />
                  <PremiumButton variant="danger" size="lg" isLoading={loading} className="w-full">
                    Emergency Access
                  </PremiumButton>
                  <button type="button" onClick={() => { setIsPasscodeMode(false); setErrorMsg(""); }}
                    className="w-full text-sm text-gray-400 hover:text-white transition-colors py-2 flex items-center justify-center gap-1">
                    ← Back to regular login
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <Input
                      label="Full Name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      leftIcon={<User className="w-[18px] h-[18px]" />}
                    />
                  )}

                  <Input
                    label="Email Address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    leftIcon={<Mail className="w-[18px] h-[18px]" />}
                  />

                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      leftIcon={<Lock className="w-[18px] h-[18px]" />}
                      rightIcon={
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-500 hover:text-gray-300 transition-colors">
                          {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                        </button>
                      }
                    />
                  </div>

                  <PremiumButton variant="primary" size="lg" isLoading={loading} className="w-full" glow>
                    {isLogin ? "Sign In" : "Create Account"}
                  </PremiumButton>
                </form>
              )}

              {!isPasscodeMode && (
                <>
                  {/* Divider */}
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <span className="text-gray-500 text-xs uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>

                  {/* Google */}
                  <PremiumButton 
                    variant="secondary" 
                    size="lg" 
                    disabled={loading} 
                    className="w-full"
                    leftIcon={
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    }
                    onClick={handleGoogleLogin}
                  >
                    Continue with Google
                  </PremiumButton>

                  {/* Emergency passcode */}
                  <PremiumButton 
                    variant="outline" 
                    size="lg" 
                    className="w-full mt-3 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
                    onClick={() => { setIsPasscodeMode(true); setErrorMsg(""); }}
                    leftIcon={<ShieldAlert className="w-4 h-4" />}
                  >
                    Emergency Passcode Access
                  </PremiumButton>
                </>
              )}

              {/* Toggle login/signup */}
              {!isPasscodeMode && (
                <p className="text-center text-gray-500 text-sm mt-6">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }}
                    className="text-orange-400 hover:text-orange-300 font-semibold transition-colors inline-flex items-center gap-1">
                    {isLogin ? "Sign Up" : "Sign In"}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
