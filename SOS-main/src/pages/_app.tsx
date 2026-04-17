import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '../utils/ThemeContext';
import { useRouter } from 'next/router';
import EmergencyChat from '../components/EmergencyChat';
import AmbientBackground from '../components/AmbientBackground';
import CursorGlow from '../components/CursorGlow';

// Pages where the floating chat should NOT appear
const HIDE_CHAT_ON = ['/auth', '/auth/index'];
// Pages that already have their own background design
const HIDE_AMBIENT_ON = ['/auth'];
// Pages where the cursor glow should not render (e.g. auth has its own dark bg)
const HIDE_CURSOR_ON = ['/auth'];

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps } 
}: AppProps) {
  const router = useRouter();
  const showChat = !HIDE_CHAT_ON.some(p => router.pathname.startsWith(p));
  const showAmbient = !HIDE_AMBIENT_ON.some(p => router.pathname.startsWith(p));

  return (
    <ThemeProvider>
      <SessionProvider session={session}>
        <Head>
          <title>SOS Emergency App</title>
          <meta name="description" content="Emergency SOS application with AI-powered fear detection" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        {showAmbient && <AmbientBackground />}
        {!HIDE_CURSOR_ON.some(p => router.pathname.startsWith(p)) && <CursorGlow />}
        <Component {...pageProps} />
        {showChat && <EmergencyChat />}
      </SessionProvider>
    </ThemeProvider>
  );
}
