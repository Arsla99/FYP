import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/Navbar';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  color: string;
  popular?: boolean;
  icon: string;
}

interface CardForm {
  name: string;
  number: string;
  expiry: string;
  cvv: string;
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export default function PlansPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('user');

  // Payment modal state
  const [payingPlan, setPayingPlan] = useState<Plan | null>(null);
  const [card, setCard] = useState<CardForm>({ name: '', number: '', expiry: '', cvv: '' });
  const [payStep, setPayStep] = useState<'form' | 'processing' | 'success'>('form');
  const [cardError, setCardError] = useState<string | null>(null);

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 4.99,
      duration: 'per month',
      color: 'from-blue-500 to-blue-600',
      icon: 'security',
      features: [
        'Basic SOS Button',
        'Location Sharing',
        '1 Emergency Contact',
        'Voice Commands (5 keywords)',
        'Basic Fear Detection',
        'Email Support'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 9.99,
      duration: 'per month',
      color: 'from-purple-500 to-purple-600',
      icon: 'shield',
      popular: true,
      features: [
        'Everything in Starter',
        'Advanced AI Fear Detection',
        'Up to 5 Emergency Contacts',
        'Custom Keywords (20 keywords)',
        'Real-time Audio Monitoring',
        'SMS + Call Alerts',
        '24/7 Priority Support',
        'Emergency Blog Access'
      ]
    },
    {
      id: 'lifesaving',
      name: 'Life Saving',
      price: 19.99,
      duration: 'per month',
      color: 'from-red-500 to-red-600',
      icon: 'emergency',
      features: [
        'Everything in Premium',
        'Unlimited Emergency Contacts',
        'Professional Emergency Response',
        'Medical Information Storage',
        'Family Safety Network',
        'Geofencing Alerts',
        'Emergency Services Integration',
        'White-glove Support',
        'Custom Emergency Plans',
        'Advanced Analytics'
      ]
    }
  ];

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/user/me', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.status === 401) { router.push('/auth'); return; }
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
          if (userData.subscription?.planId) setActivePlan(userData.subscription.planId);
        }
      } catch { router.push('/auth'); }
    };
    checkUser();
  }, [router]);

  // Open payment modal
  const handleSelectPlan = (planId: string) => {
    if (userRole === 'admin') return;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    setPayingPlan(plan);
    setCard({ name: '', number: '', expiry: '', cvv: '' });
    setPayStep('form');
    setCardError(null);
  };

  // Submit payment → call API
  const handlePaySubmit = async () => {
    if (!payingPlan) return;

    // Basic validation
    const rawNum = card.number.replace(/\s/g, '');
    if (!card.name.trim()) return setCardError('Please enter the cardholder name.');
    if (rawNum.length < 16) return setCardError('Enter a valid 16-digit card number.');
    if (!card.expiry.match(/^\d{2}\/\d{2}$/)) return setCardError('Enter expiry as MM/YY.');
    if (card.cvv.length < 3) return setCardError('Enter a valid CVV.');
    setCardError(null);
    setPayStep('processing');

    // Simulate 2s payment processing
    await new Promise(r => setTimeout(r, 2000));

    try {
      const res = await fetch('/api/user/select-plan', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: payingPlan.id, planName: payingPlan.name }),
      });
      if (res.ok) {
        setActivePlan(payingPlan.id);
        setSelectedPlan(payingPlan.id);
        setPayStep('success');
      } else {
        const err = await res.json();
        setCardError(err.error || 'Payment failed. Try again.');
        setPayStep('form');
      }
    } catch {
      setCardError('Network error. Please try again.');
      setPayStep('form');
    }
  };

  const closeModal = () => { setPayingPlan(null); setPayStep('form'); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-950 text-white"
    >
      <Navbar />

      <div className="container mx-auto px-4 py-12 pb-28 max-w-6xl">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="material-icons text-sm">workspace_premium</span>
            Safety Plans
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Safety Plan
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Protect yourself and your loved ones with AI-powered emergency response. Pick the plan that fits your needs.
          </p>
          {userRole === 'admin' && (
            <motion.button onClick={() => router.push('/admin')}
              className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-red-500/20"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <span className="material-icons text-sm">admin_panel_settings</span>
              Admin Dashboard
            </motion.button>
          )}
        </motion.div>

        {/* ── Plans Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, index) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`group relative flex flex-col rounded-3xl p-[1px] hover-lift ${
                plan.popular
                  ? 'bg-gradient-to-b from-purple-500 to-purple-700 shadow-[0_0_60px_rgba(168,85,247,0.35)]'
                  : 'bg-gradient-to-b from-white/15 to-white/5 hover:from-white/25 hover:to-white/10'
              }`}
            >
              <div className={`relative z-10 flex flex-col h-full rounded-3xl bg-gray-900/60 backdrop-blur-2xl border border-white/[0.06] p-6 md:p-8 ${
                plan.popular ? 'shadow-inner shadow-purple-500/10' : ''
              }`}>
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-purple-500/30 uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon + name */}
                <div className="mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-5 shadow-lg`}>
                    <span className="material-icons text-2xl text-white">{plan.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                    <span className="text-gray-500 text-sm mb-1.5">/{plan.duration.replace('per ', '')}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/8 mb-6" />

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-icons text-green-400 text-base mt-0.5 shrink-0">check_circle</span>
                      <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={userRole === 'admin' || activePlan === plan.id}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed ${
                    activePlan === plan.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 opacity-90'
                      : `bg-gradient-to-r ${plan.color} hover:opacity-90 text-white shadow-lg shadow-black/20 dark:shadow-black/20`
                  }`}
                >
                  {activePlan === plan.id
                    ? <span className="flex items-center justify-center gap-2"><span className="material-icons text-sm">verified</span>Active Plan</span>
                    : userRole === 'admin' ? 'Admin Account' : 'Get Started'
                  }
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Trust bar ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-3xl border border-white/[0.08] bg-gray-900/60 backdrop-blur-2xl shadow-2xl shadow-black/20 dark:shadow-black/20 p-6 md:p-8">
          <p className="text-center text-xs text-gray-500 uppercase tracking-wider font-semibold mb-6">Why professionals choose SOS</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "speed",          label: "< 3s Alert Speed",        color: "text-orange-400" },
              { icon: "verified_user",  label: "Certified Protocols",     color: "text-blue-400" },
              { icon: "support_agent",  label: "24/7 Support",            color: "text-purple-400" },
              { icon: "lock",           label: "End-to-End Secure",       color: "text-green-400" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2 text-center">
                <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center ${item.color}`}>
                  <span className="material-icons text-lg">{item.icon}</span>
                </div>
                <span className="text-gray-400 text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-center text-gray-600 text-xs mt-6">
          All plans include a 7-day free trial · Cancel anytime · No hidden fees
        </p>
      </div>

      {/* ── Payment Modal ── */}
      <AnimatePresence>
        {payingPlan && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && payStep !== 'processing') closeModal(); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-md bg-gray-900/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl dark:shadow-black/20"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div>
                  <p className="text-sm font-semibold text-white">Complete Your Purchase</p>
                  <p className="text-xs text-white/40 mt-0.5">{payingPlan.name} Plan · ${payingPlan.price}/mo</p>
                </div>
                {payStep !== 'processing' && (
                  <button onClick={closeModal} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10 hover:border-white/20">
                    <span className="material-icons text-white text-base">close</span>
                  </button>
                )}
              </div>

              <div className="px-6 py-6">

                {/* ── Processing ── */}
                {payStep === 'processing' && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 rounded-full border-[3px] border-orange-500 border-t-transparent" />
                    <p className="text-sm text-white/70">Processing payment…</p>
                    <p className="text-xs text-white/30">Please do not close this window</p>
                  </div>
                )}

                {/* ── Success ── */}
                {payStep === 'success' && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <span className="material-icons text-emerald-400 text-3xl">check_circle</span>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-white">Payment Successful!</p>
                      <p className="text-xs text-white/50 mt-1">{payingPlan.name} plan is now active on your account</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { closeModal(); router.push('/sos'); }}
                      className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Go to Dashboard
                    </motion.button>
                  </div>
                )}

                {/* ── Card Form ── */}
                {payStep === 'form' && (
                  <>
                    {/* Order summary */}
                    <div className="flex items-center justify-between rounded-2xl bg-gray-900/40 backdrop-blur-md border border-white/[0.08] px-4 py-3 mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${payingPlan.color} flex items-center justify-center`}>
                          <span className="material-icons text-white text-sm">{payingPlan.icon}</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{payingPlan.name} Plan</p>
                          <p className="text-[10px] text-white/40">Monthly subscription</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-white">${payingPlan.price}<span className="text-xs text-white/40 font-normal">/mo</span></p>
                    </div>

                    {/* Card fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-white/50 mb-1.5 font-medium">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="John Smith"
                          value={card.name}
                          onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
                          className="auth-input"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-white/50 mb-1.5 font-medium">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={card.number}
                            onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
                            maxLength={19}
                            className="auth-input pr-10 font-mono"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 material-icons text-white/20 text-lg">credit_card</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-white/50 mb-1.5 font-medium">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            placeholder="08/27"
                            value={card.expiry}
                            onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                            maxLength={5}
                            className="auth-input font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-white/50 mb-1.5 font-medium">CVV</label>
                          <input
                            type="password"
                            placeholder="•••"
                            value={card.cvv}
                            onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                            maxLength={4}
                            className="auth-input font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {cardError && (
                      <p className="mt-3 text-xs text-red-400 flex items-center gap-1.5">
                        <span className="material-icons text-sm">error_outline</span>
                        {cardError}
                      </p>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handlePaySubmit}
                      className={`mt-5 w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r ${payingPlan.color} hover:opacity-90 transition-all shadow-lg`}
                    >
                      Pay ${payingPlan.price} / month
                    </motion.button>

                    <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-white/25">
                      <span className="material-icons text-xs">lock</span>
                      Payments are securely encrypted · Cancel anytime
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
