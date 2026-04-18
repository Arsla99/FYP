import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  HeartPulse,
  Check,
  Zap,
  BadgeCheck,
  Headphones,
  Lock,
  CreditCard,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
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

const planAccent = (id: string) => {
  switch (id) {
    case 'starter':
      return {
        bg: 'bg-accent-blue/10',
        text: 'text-accent-blue',
        border: 'border-accent-blue/20',
        glow: 'shadow-glow-blue',
      };
    case 'premium':
      return {
        bg: 'bg-accent-gold/10',
        text: 'text-accent-gold',
        border: 'border-accent-gold/20',
        glow: 'shadow-glow-gold',
      };
    case 'lifesaving':
      return {
        bg: 'bg-accent-coral/10',
        text: 'text-accent-coral',
        border: 'border-accent-coral/20',
        glow: 'shadow-glow-coral',
      };
    default:
      return {
        bg: 'bg-accent-blue/10',
        text: 'text-accent-blue',
        border: 'border-accent-blue/20',
        glow: 'shadow-glow-blue',
      };
  }
};

const PlanIcon = ({ id, className }: { id: string; className?: string }) => {
  switch (id) {
    case 'starter':
      return <Shield className={className} />;
    case 'premium':
      return <ShieldCheck className={className} />;
    case 'lifesaving':
      return <HeartPulse className={className} />;
    default:
      return <Shield className={className} />;
  }
};

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
        'Email Support',
      ],
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
        'Emergency Blog Access',
      ],
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
        'Advanced Analytics',
      ],
    },
  ];

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/user/me', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.status === 401) {
          router.push('/auth');
          return;
        }
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
          if (userData.subscription?.planId) setActivePlan(userData.subscription.planId);
        }
      } catch {
        router.push('/auth');
      }
    };
    checkUser();
  }, [router]);

  // Open payment modal
  const handleSelectPlan = (planId: string) => {
    if (userRole === 'admin') return;
    const plan = plans.find((p) => p.id === planId);
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
    await new Promise((r) => setTimeout(r, 2000));

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

  const closeModal = () => {
    setPayingPlan(null);
    setPayStep('form');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-bg-base text-text-primary"
    >
      <Navbar />

      {/* Subtle background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-[20%] left-[10%] h-[500px] w-[500px] rounded-full opacity-[0.07] blur-[100px]"
          style={{ background: 'var(--accent-blue)' }}
        />
        <div
          className="absolute top-[40%] -right-[10%] h-[400px] w-[400px] rounded-full opacity-[0.05] blur-[100px]"
          style={{ background: 'var(--accent-purple)' }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16 pb-28 md:py-24">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-20 text-center"
        >
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="badge badge-gold">
              <Sparkles className="h-3 w-3" />
              Safety Plans
            </span>
          </div>
          <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Choose Your{' '}
            <span className="text-gradient">Safety Plan</span>
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-text-secondary md:text-lg">
            Protect yourself and your loved ones with AI-powered emergency response. Pick the plan
            that fits your needs.
          </p>
          {userRole === 'admin' && (
            <motion.button
              onClick={() => router.push('/admin')}
              className="btn-danger mt-8"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Dashboard
            </motion.button>
          )}
        </motion.div>

        {/* ── Plans Grid ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan, index) => {
            const accent = planAccent(plan.id);
            const isActive = activePlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`relative flex flex-col rounded-2xl p-px ${
                  plan.popular
                    ? 'shadow-glow-gold'
                    : ''
                }`}
                style={
                  plan.popular
                    ? {
                        background:
                          'linear-gradient(180deg, var(--accent-blue) 0%, rgba(59,130,246,0.3) 30%, rgba(59,130,246,0.05) 60%, transparent 100%)',
                      }
                    : {
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 40%, transparent 70%)',
                      }
                }
              >
                <div
                  className={`relative flex h-full flex-col rounded-2xl border p-6 md:p-8 ${
                    plan.popular
                      ? 'border-accent-blue/30 bg-bg-surface'
                      : 'border-border-default bg-bg-elevated'
                  }`}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                      <span className="badge badge-gold shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Icon + name */}
                  <div className="mb-8">
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${accent.bg} ${accent.border} ${accent.text}`}
                    >
                      <PlanIcon id={plan.id} className="h-6 w-6" />
                    </div>
                    <h3 className="mb-1 text-xl font-bold text-text-primary">{plan.name}</h3>
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-extrabold tracking-tight text-text-primary">
                        ${plan.price}
                      </span>
                      <span className="mb-1.5 text-sm text-text-tertiary">
                        /{plan.duration.replace('per ', '')}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div
                    className="mb-6 h-px"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, var(--border-default), transparent)',
                    }}
                  />

                  {/* Features */}
                  <ul className="mb-8 flex-1 space-y-3.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-emerald/10">
                          <Check className="h-3 w-3 text-accent-emerald" />
                        </div>
                        <span className="text-sm leading-relaxed text-text-secondary">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={userRole === 'admin' || isActive}
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed ${
                      isActive
                        ? 'bg-accent-emerald text-bg-base shadow-glow-emerald'
                        : plan.popular
                        ? 'btn-primary'
                        : 'bg-bg-hover border border-border-default text-text-primary hover:bg-bg-pressed hover:border-border-hover'
                    }`}
                  >
                    {isActive ? (
                      <span className="flex items-center justify-center gap-2">
                        <Check className="h-4 w-4" />
                        Active Plan
                      </span>
                    ) : userRole === 'admin' ? (
                      'Admin Account'
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Get Started
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Trust bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="card mt-16 p-6 md:p-8"
        >
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.15em] text-text-tertiary">
            Why professionals choose SOS
          </p>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { icon: Zap, label: '< 3s Alert Speed', color: 'text-accent-gold' },
              { icon: BadgeCheck, label: 'Certified Protocols', color: 'text-accent-blue' },
              { icon: Headphones, label: '24/7 Support', color: 'text-accent-purple' },
              { icon: Lock, label: 'End-to-End Secure', color: 'text-accent-emerald' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-default bg-bg-hover">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <span className="text-xs font-medium text-text-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="mt-8 text-center text-xs text-text-tertiary">
          All plans include a 7-day free trial · Cancel anytime · No hidden fees
        </p>
      </div>

      {/* ── Payment Modal ── */}
      <AnimatePresence>
        {payingPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/60 p-4 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget && payStep !== 'processing') closeModal();
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="card-elevated w-full max-w-md overflow-hidden rounded-2xl border border-border-default shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Complete Your Purchase</p>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {payingPlan.name} Plan · ${payingPlan.price}/mo
                  </p>
                </div>
                {payStep !== 'processing' && (
                  <button
                    onClick={closeModal}
                    className="icon-btn"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="px-6 py-6">
                {/* ── Processing ── */}
                {payStep === 'processing' && (
                  <div className="flex flex-col items-center gap-4 py-10">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="h-10 w-10 text-accent-gold" />
                    </motion.div>
                    <p className="text-sm text-text-secondary">Processing payment…</p>
                    <p className="text-xs text-text-tertiary">Please do not close this window</p>
                  </div>
                )}

                {/* ── Success ── */}
                {payStep === 'success' && (
                  <div className="flex flex-col items-center gap-4 py-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent-emerald/20 bg-accent-emerald/10">
                      <Check className="h-7 w-7 text-accent-emerald" />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-text-primary">Payment Successful!</p>
                      <p className="mt-1 text-xs text-text-tertiary">
                        {payingPlan.name} plan is now active on your account
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        closeModal();
                        router.push('/sos');
                      }}
                      className="btn-primary mt-2"
                    >
                      Go to Dashboard
                    </motion.button>
                  </div>
                )}

                {/* ── Card Form ── */}
                {payStep === 'form' && (
                  <>
                    {/* Order summary */}
                    <div className="mb-6 flex items-center justify-between rounded-xl border border-border-default bg-bg-elevated px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-hover">
                          <PlanIcon
                            id={payingPlan.id}
                            className={`h-4 w-4 ${planAccent(payingPlan.id).text}`}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-primary">
                            {payingPlan.name} Plan
                          </p>
                          <p className="text-xs text-text-tertiary">Monthly subscription</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-text-primary">
                        ${payingPlan.price}
                        <span className="ml-0.5 text-xs font-normal text-text-tertiary">/mo</span>
                      </p>
                    </div>

                    {/* Card fields */}
                    <div className="space-y-3.5">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-text-tertiary">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          placeholder="John Smith"
                          value={card.name}
                          onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                          className="input"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-medium text-text-tertiary">
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={card.number}
                            onChange={(e) =>
                              setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))
                            }
                            maxLength={19}
                            className="input pr-10 font-mono"
                          />
                          <CreditCard className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block text-xs font-medium text-text-tertiary">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            placeholder="08/27"
                            value={card.expiry}
                            onChange={(e) =>
                              setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))
                            }
                            maxLength={5}
                            className="input font-mono"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-medium text-text-tertiary">
                            CVV
                          </label>
                          <input
                            type="password"
                            placeholder="•••"
                            value={card.cvv}
                            onChange={(e) =>
                              setCard((c) => ({
                                ...c,
                                cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                              }))
                            }
                            maxLength={4}
                            className="input font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {cardError && (
                      <p className="mt-4 flex items-center gap-1.5 text-xs text-accent-coral">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {cardError}
                      </p>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePaySubmit}
                      className="btn-primary mt-6 w-full"
                    >
                      Pay ${payingPlan.price} / month
                    </motion.button>

                    <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-muted">
                      <Lock className="h-3 w-3" />
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
