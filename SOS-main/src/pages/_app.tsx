import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '../utils/ThemeContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import EmergencyChat from '../components/EmergencyChat';
import AmbientBackground from '../components/AmbientBackground';
import CursorGlow from '../components/CursorGlow';
import Footer from '../components/Footer';

const HIDE_CHAT_ON = ['/auth'];
const HIDE_AMBIENT_ON = ['/auth'];
const HIDE_CURSOR_ON = ['/auth'];
const HIDE_FOOTER_ON = ['/', '/auth', '/sos', '/chat', '/admin'];

export default function App({
  Component,
  pageProps: { session, ...pageProps }
}: AppProps) {
  const router = useRouter();
  const showChat = !HIDE_CHAT_ON.some(p => router.pathname.startsWith(p));
  const showAmbient = !HIDE_AMBIENT_ON.some(p => router.pathname.startsWith(p));
  const showFooter = !HIDE_FOOTER_ON.some(p => router.pathname.startsWith(p));

  useEffect(() => {
    const isAuthRoute = router.pathname.startsWith('/auth');
    document.body.classList.toggle('auth-page', isAuthRoute);
    return () => { document.body.classList.remove('auth-page'); };
  }, [router.pathname]);

  return (
    <ThemeProvider>
      <SessionProvider session={session}>
        <Head>
          <title>SOS Emergency — AI-Powered Safety</title>
          <meta name="description" content="Emergency SOS application with AI-powered fear detection and real-time location sharing" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        {showAmbient && <AmbientBackground />}
        {!HIDE_CURSOR_ON.some(p => router.pathname.startsWith(p)) && <CursorGlow />}
        <Component {...pageProps} />
        {showChat && <EmergencyChat />}
        {showFooter && <Footer />}
      </SessionProvider>
    </ThemeProvider>
  );
}
