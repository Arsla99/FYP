import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useTheme } from '../utils/ThemeContext';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border p-6 mb-5
        ${isDark ? 'bg-gray-900/60 border-white/8' : 'bg-white border-gray-200 shadow-sm'}`}
    >
      <h2 className={`text-lg font-semibold mb-3 flex items-center gap-2
        ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <span className="w-1.5 h-5 rounded-full bg-orange-500 inline-block" />
        {title}
      </h2>
      <div className={`text-sm leading-relaxed space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {children}
      </div>
    </motion.div>
  );
};

export default function PrivacyPolicy() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      <Head>
        <title>Privacy Policy — SOS Emergency</title>
      </Head>
      <div className={`min-h-screen font-sans ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 pt-28 pb-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 px-4 py-1.5 rounded-full text-xs font-semibold mb-4">
              <span className="material-icons text-sm">verified_user</span>
              Legal Document
            </div>
            <h1 className={`text-3xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Privacy Policy
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Last updated: June 2025 · Effective immediately
            </p>
          </motion.div>

          <Section title="Overview">
            <p>
              SOS Emergency ("we", "us", or "our") is a personal safety application developed as a Final Year Project.
              This Privacy Policy explains how we collect, use, store, and protect your personal information when
              you use our platform.
            </p>
            <p>By using SOS Emergency, you agree to the collection and use of information in accordance with this policy.</p>
          </Section>

          <Section title="Information We Collect">
            <p>We collect the following categories of information:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong className={isDark ? 'text-white' : 'text-gray-800'}>Account Details</strong> — Name, email address, and hashed password (or Google OAuth ID when you sign in with Google).</li>
              <li><strong className={isDark ? 'text-white' : 'text-gray-800'}>Profile Information</strong> — Age, blood type, medical conditions, and profile photo you voluntarily provide.</li>
              <li><strong className={isDark ? 'text-white' : 'text-gray-800'}>Emergency Contacts</strong> — Names and phone numbers you add as emergency contacts.</li>
              <li><strong className={isDark ? 'text-white' : 'text-gray-800'}>Location Data</strong> — GPS coordinates captured during active monitoring sessions to enable emergency response. Location is not stored persistently.</li>
              <li><strong className={isDark ? 'text-white' : 'text-gray-800'}>Device Audio</strong> — Short audio recordings used locally for fear/distress detection. Audio is processed on-device and is not uploaded to our servers.</li>
              <li><strong className={isDark ? 'text-white' : 'text-gray-800'}>Usage Data</strong> — Session timestamps and last active time for account security.</li>
            </ul>
          </Section>

          <Section title="How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Authenticate you and maintain your secure session.</li>
              <li>Send SOS alerts with your location to your emergency contacts via SMS (Twilio).</li>
              <li>Display your medical information to first responders when an SOS is triggered.</li>
              <li>Personalise your profile and application experience.</li>
              <li>Improve system reliability and debug issues in development mode.</li>
            </ul>
            <p className="mt-2">We do <strong className={isDark ? 'text-white' : 'text-gray-800'}>not</strong> sell your personal data to third parties.</p>
          </Section>

          <Section title="Google Sign-In">
            <p>
              If you choose to sign in with Google, we receive your name, email address, and profile picture
              from Google's OAuth 2.0 service. This data is stored in our database to create or update your
              account. We only request the minimum necessary scopes (profile and email).
            </p>
            <p>
              You can revoke SOS Emergency's access to your Google account at any time via
              your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer"
                className="text-orange-500 underline">Google Account permissions</a>.
            </p>
          </Section>

          <Section title="Data Storage & Security">
            <p>
              Your data is stored in a MongoDB database. Passwords are hashed using bcrypt and are never
              stored in plaintext. Sessions are managed via JSON Web Tokens (JWT) with a 7-day expiry.
            </p>
            <p>
              We implement industry-standard security measures including HTTPS transport, input validation,
              and rate limiting on authentication endpoints. No system is 100% secure; please protect
              your account credentials.
            </p>
          </Section>

          <Section title="Third-Party Services">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className={isDark ? 'text-white' : 'text-gray-800'}>Twilio</strong> — Used to send SMS alerts. Your phone number is transmitted to Twilio solely for this purpose.</li>
              <li><strong className={isDark ? 'text-white' : 'text-gray-800'}>Google OAuth</strong> — Used for optional sign-in. Subject to <a href="https://policies.google.com/privacy" className="text-orange-500 underline" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.</li>
            </ul>
          </Section>

          <Section title="Data Retention">
            <p>
              We retain your account data for as long as your account is active. You may request deletion
              of your account and associated data by contacting us. Location data captured during SOS sessions
              is used in real time and not retained after the session ends.
            </p>
          </Section>

          <Section title="Children's Privacy">
            <p>
              SOS Emergency is not directed to children under 13. We do not knowingly collect personal information
              from children. If you believe a child has provided us with personal information, please contact us
              and we will delete it promptly.
            </p>
          </Section>

          <Section title="Your Rights">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Access and download the data we hold about you.</li>
              <li>Request correction of inaccurate data via your Profile page.</li>
              <li>Request deletion of your account.</li>
              <li>Withdraw consent for location tracking by stopping the monitoring session.</li>
            </ul>
          </Section>

          <Section title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an
              updated effective date. Continued use of the application after changes constitutes acceptance of the
              revised policy.
            </p>
          </Section>

          <Section title="Contact Us">
            <p>If you have questions about this Privacy Policy, please reach out:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Email: <a href="mailto:support@sosfyp.com" className="text-orange-500 underline">support@sosfyp.com</a></li>
              <li>Support Page: <Link href="/support" className="text-orange-500 underline">sosfyp.com/support</Link></li>
            </ul>
          </Section>

          <div className={`text-center text-xs mt-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            SOS Emergency © 2025 · Final Year Project ·{' '}
            <Link href="/support" className="text-orange-500">Get Help</Link>
          </div>
        </main>
      </div>
    </>
  );
}
