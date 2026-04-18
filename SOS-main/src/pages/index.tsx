import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Shield, Activity, Mic, MapPin, Users, Bell, Zap,
  ArrowRight, ChevronRight, Phone, Heart, Clock, Lock,
  Smartphone, Radio, FileText, Star
} from 'lucide-react';
import Footer from "../components/Footer";

/* ─── Animated Counter ─── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

/* ─── Section Wrapper ─── */
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`py-20 md:py-28 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon: Icon, title, description, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="card p-7 group cursor-default"
    >
      <div className="w-11 h-11 rounded-xl bg-accent-gold/10 border border-accent-gold/15 flex items-center justify-center mb-5 group-hover:bg-accent-gold/15 transition-colors">
        <Icon className="w-5 h-5 text-accent-gold" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </motion.div>
  );
}

/* ─── Step Card ─── */
function StepCard({ number, title, description, image }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="card-elevated overflow-hidden">
        <div className="relative h-48 overflow-hidden">
          <Image src={image} alt={title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/60 to-transparent" />
          <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-accent-gold/20 backdrop-blur-md border border-accent-gold/30 flex items-center justify-center">
            <span className="text-accent-gold font-bold text-sm">{number}</span>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Testimonial Card ─── */
function TestimonialCard({ quote, name, role, avatar }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="card p-6"
    >
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-accent-gold fill-accent-gold" />
        ))}
      </div>
      <p className="text-sm text-text-secondary leading-relaxed mb-5">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-gold/30 to-accent-purple/30 flex items-center justify-center text-xs font-bold text-text-primary">
          {avatar}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{name}</p>
          <p className="text-xs text-text-tertiary">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Emergency Number Card ─── */
function EmergencyCard({ number, label, icon: Icon, color }: any) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      className="card p-5 flex items-center gap-4 cursor-default"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-text-primary" />
      </div>
      <div>
        <p className="text-xl font-bold text-text-primary">{number}</p>
        <p className="text-xs text-text-tertiary">{label}</p>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, 100]);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push("/sos");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary overflow-x-hidden">
      {/* ═══════ HERO ═══════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=1920&q=80"
            alt="Emergency response"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-base/70 via-bg-base/85 to-bg-base" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-base/60 via-transparent to-bg-base/60" />
        </div>

        {/* Ambient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent-gold/5 rounded-full blur-[120px] animate-orb-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-purple/5 rounded-full blur-[100px] animate-orb-float-reverse" />

        {/* Content */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-gold/20 bg-accent-gold/5 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
            <span className="text-xs font-medium text-accent-gold tracking-wide">AI-Powered Emergency Response</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-6"
          >
            Your Safety,
            <br />
            <span className="text-gradient">Always On.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Real-time fear detection, live location sharing, and instant alerts to your emergency contacts. One tap away from help.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary text-base px-8 py-4"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="/blogs">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-secondary text-base px-8 py-4"
              >
                Explore Safety Guide
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-text-muted/30 flex items-start justify-center p-1.5"
          >
            <div className="w-1.5 h-2.5 rounded-full bg-text-muted/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <Section className="border-y border-border-default bg-bg-elevated/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {[
            { value: 50000, suffix: '+', label: 'Users Protected' },
            { value: 3, suffix: 's', label: 'Avg. Alert Speed' },
            { value: 99, suffix: '%', label: 'Detection Accuracy' },
            { value: 24, suffix: '/7', label: 'Always Active' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl md:text-5xl font-bold text-gradient mb-2">
                <Counter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-text-tertiary">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ═══════ FEATURES ═══════ */}
      <Section>
        <div className="text-center mb-16">
          <span className="section-label mb-4 block">Features</span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Everything You Need to <span className="text-gradient">Stay Safe</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg">
            A complete safety ecosystem designed to protect you and your loved ones, powered by cutting-edge AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={Shield}
            title="One-Tap SOS"
            description="Press and hold the SOS button for 3 seconds to instantly alert all your emergency contacts with your exact location."
            delay={0}
          />
          <FeatureCard
            icon={Mic}
            title="AI Fear Detection"
            description="Our AI analyzes your voice in real-time. If distress is detected, SOS triggers automatically — even if you can't press a button."
            delay={0.1}
          />
          <FeatureCard
            icon={MapPin}
            title="Live Location Sharing"
            description="Your GPS coordinates are sent with every alert. Emergency contacts can track your exact position in real-time on an interactive map."
            delay={0.2}
          />
          <FeatureCard
            icon={Bell}
            title="Keyword Voice Trigger"
            description="Say emergency keywords like 'help' or 'danger' and the app listens, triggering alerts without any physical interaction."
            delay={0.3}
          />
          <FeatureCard
            icon={Users}
            title="Emergency Contacts"
            description="Add unlimited emergency contacts who receive SMS alerts instantly. Organize by priority and relationship for faster response."
            delay={0.4}
          />
          <FeatureCard
            icon={Activity}
            title="Health & Medical Info"
            description="Store critical medical information — blood type, allergies, conditions — so first responders have everything they need."
            delay={0.5}
          />
          <FeatureCard
            icon={Smartphone}
            title="Cross-Platform Alerts"
            description="Alerts sent via SMS, in-app notifications, and push alerts to ensure your contacts see them on any device."
            delay={0.6}
          />
          <FeatureCard
            icon={Lock}
            title="End-to-End Privacy"
            description="Your location and health data are encrypted. We never sell your data. Your safety is our only priority."
            delay={0.7}
          />
          <FeatureCard
            icon={Radio}
            title="Offline Capability"
            description="Core SOS features work even with limited connectivity. Your alerts queue and send the moment signal is restored."
            delay={0.8}
          />
        </div>
      </Section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <Section className="bg-bg-elevated/30 border-y border-border-default">
        <div className="text-center mb-16">
          <span className="section-label mb-4 block">How It Works</span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Three Steps to <span className="text-gradient">Total Protection</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg">
            Getting started takes less than 2 minutes. Set it up once, stay protected forever.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard
            number="1"
            title="Create Your Profile"
            description="Sign up in seconds. Add your emergency contacts, set trigger keywords, and store your medical information securely."
            image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80"
          />
          <StepCard
            number="2"
            title="Enable AI Monitoring"
            description="Turn on voice detection and let our AI listen for distress signals. Customize sensitivity and keyword triggers to your preference."
            image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"
          />
          <StepCard
            number="3"
            title="Stay Protected 24/7"
            description="Go about your day with confidence. One tap, one voice command, or automatic AI detection — help is always one signal away."
            image="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80"
          />
        </div>
      </Section>

      {/* ═══════ EMERGENCY NUMBERS ═══════ */}
      <Section>
        <div className="text-center mb-12">
          <span className="section-label mb-4 block">Emergency Contacts</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Pakistan Emergency <span className="text-gradient">Helplines</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Save these numbers. For life-threatening emergencies, always call the official helpline first.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <EmergencyCard number="115" label="Ambulance / Medical" icon={Heart} color="bg-emerald-500/20" />
          <EmergencyCard number="16" label="Fire Department" icon={Zap} color="bg-amber-500/20" />
          <EmergencyCard number="15" label="Police" icon={Shield} color="bg-blue-500/20" />
          <EmergencyCard number="1122" label="Rescue 1122" icon={Phone} color="bg-accent-coral/20" />
        </div>
      </Section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <Section className="bg-bg-elevated/30 border-y border-border-default">
        <div className="text-center mb-16">
          <span className="section-label mb-4 block">Testimonials</span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Trusted by <span className="text-gradient">Thousands</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg">
            Real stories from people who found safety when it mattered most.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <TestimonialCard
            quote="I was walking home late at night when I felt unsafe. I pressed the SOS button and my brother reached me within minutes. This app literally saved me."
            name="Ayesha K."
            role="University Student, Lahore"
            avatar="AK"
          />
          <TestimonialCard
            quote="As a parent, knowing my daughter has this on her phone gives me peace of mind. The AI voice detection is incredibly responsive."
            name="Imran R."
            role="Father of Two, Karachi"
            avatar="IR"
          />
          <TestimonialCard
            quote="During a medical emergency at home, I couldn't reach my phone. The keyword trigger detected my voice and sent alerts to my family instantly."
            name="Fatima S."
            role="Healthcare Worker, Islamabad"
            avatar="FS"
          />
        </div>
      </Section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent-gold/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent-purple/5 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Don&apos;t Wait for an Emergency.
              <br />
              <span className="text-gradient">Be Prepared Today.</span>
            </h2>
            <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
              Join 50,000+ people who trust SOS Emergency to keep them and their families safe. It takes 60 seconds to set up.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary text-base px-10 py-4"
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <Clock className="w-4 h-4" />
                <span>Takes 60 seconds</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
