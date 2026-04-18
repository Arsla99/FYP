// src/pages/sos/index.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Navbar from '../../components/Navbar';

import { Shield, Crown, MapPin, Crosshair, MapPinOff, ExternalLink, Copy, Flame, Heart, Car, LifeBuoy, Activity, Mic, Square, RotateCcw, FlaskConical, Share2, Contact2, Battery, BookOpen, HelpCircle, ChevronRight, Users, ShieldAlert } from 'lucide-react';

const AUDIO_CHUNK_DURATION = 15000; // 15 seconds — reduces Gemini API token usage 3×
const SOS_FEAR_THRESHOLD = 2; // Number of consecutive distress detections to trigger SOS

interface EmotionResult {
  emotion: string;
  confidence: number;
  all_scores: Record<string, number>;
  success: boolean;
  error?: string;
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // All state hooks must be declared at the top level
  const [isPressing, setIsPressing] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [message, setMessage] = useState("Press and hold for 3 seconds to send SOS.");
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | "warning">("info");
  const [userRole, setUserRole] = useState<string>('user');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [fearDetected, setFearDetected] = useState(false);
  const [showAlertTimer, setShowAlertTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(3);
  const [alertSent, setAlertSent] = useState(false);
  const [canceled, setCanceled] = useState(false);

  // Real-time Fear Detection States
  const [isListening, setIsListening] = useState(false);
  const [fearLevel, setFearLevel] = useState(0);
  const [lastEmotion, setLastEmotion] = useState<string | null>(null);
  const [consecutiveFearCount, setConsecutiveFearCount] = useState(0);
  const [isSOSTriggered, setIsSOSTriggered] = useState(false);
  const [fearHistory, setFearHistory] = useState<number[]>([]);

  // Audio Visualization States
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  const [currentVolume, setCurrentVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const geoWatchRef = useRef<number | null>(null);

  // SpeechRecognition for local keyword detection
  const recognitionRef = useRef<any>(null);
  const [speechToTextEnabled, setSpeechToTextEnabled] = useState(false);
  const [lastDetectedKeyword, setLastDetectedKeyword] = useState<string | null>(null);
  
  // Debug info state
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  const [keywords, setKeywords] = useState([
    "help", "emergency", "sos", "danger", "fire", "attack",
    "injured", "accident", "panic", "hurt", "stuck", "trapped",
    "robbery", "kidnapped", "violence", "threat"
  ]);
  
  const [contacts, setContacts] = useState<Array<{
    _id?: string;
    name: string;
    phone: string;
    relationship?: string;
  }>>([]);

  // Location states
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLon, setCurrentLon] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState("Fetching location...");

  const keywordsRef = useRef<string[]>(keywords);
  
  // Toast state
  const [toast, setToast] = useState<{ show: boolean, type: string, text: string } | null>(null);

  // Environment variable for API URL
  const API_URL = process.env.NEXT_PUBLIC_EMOTION_API_URL || 'https://7a91-34-186-20-228.ngrok-free.app';

  const showToast = (type: string, text: string) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast(null), 3000);
  };

  // Authentication check — NextAuth session + localStorage token fallback
  useEffect(() => {
    const checkAuth = async () => {
      if (status === 'loading') return;

      if (status === 'authenticated' && session?.user) {
        setUserRole(session.user.role || 'user');
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Fallback to legacy localStorage token
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/auth');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role || 'user');
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token');
          router.push('/auth');
        }
      } catch {
        localStorage.removeItem('token');
        router.push('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [session, status, router]);

  // Fetch user's custom keywords
  const fetchUserKeywords = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, using default keywords');
        return;
      }

      const response = await fetch('/api/user/keywords', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.keywords && data.keywords.length > 0) {
          setKeywords(data.keywords);
          console.log('✅ Loaded user keywords:', data.keywords);
          setDebugInfo(prev => ({ ...prev, keywordsLoaded: data.keywords }));
        } else {
          console.log('No custom keywords found, using defaults');
        }
      } else {
        console.log('Failed to fetch keywords, using defaults');
      }
    } catch (error) {
      console.error('Error fetching user keywords:', error);
      console.log('Using default keywords due to error');
    }
  };

  // Fetch user role to determine if they're admin
  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUserRole(userData.role || 'user');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  // Fetch user's emergency contacts
  const fetchUserContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, using default contact');
        setContacts([{ name: 'Emergency Contact', phone: '+923360617000' }]);
        return;
      }

      const response = await fetch('/api/user/contacts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.contacts && data.contacts.length > 0) {
          setContacts(data.contacts);
          console.log('✅ Loaded user contacts:', data.contacts);
        } else {
          console.log('No contacts found, using default');
          setContacts([{ name: 'Emergency Contact', phone: '+923360617000' }]);
        }
      } else {
        console.log('Failed to fetch contacts, using default');
        setContacts([{ name: 'Emergency Contact', phone: '+923360617000' }]);
      }
    } catch (error) {
      console.error('Error fetching user contacts:', error);
      console.log('Using default contact due to error');
      setContacts([{ name: 'Emergency Contact', phone: '+923360617000' }]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserKeywords();
      fetchUserContacts();
      fetchUserRole();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    keywordsRef.current = keywords;
  }, [keywords]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;

    if (showAlertTimer && !canceled && !alertSent) {
      timerInterval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval!);
            // Send alert to all contacts (API will fetch from user profile)
            if (!canceled && !alertSent) {
              sendSOSAlert();
            }
            setShowAlertTimer(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [showAlertTimer, canceled, alertSent, currentLat, currentLon, locationStatus]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation not supported by this browser.");
      return;
    }

    setLocationStatus("Acquiring GPS signal...");

    // watchPosition keeps updating even when screen is on — best effort on mobile
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLat(latitude);
        setCurrentLon(longitude);
        setLocationStatus(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      },
      (error) => {
        setCurrentLat(null);
        setCurrentLon(null);
        const msgs: Record<number, string> = {
          1: "Location access denied — enable GPS in browser settings.",
          2: "Location unavailable.",
          3: "Location request timed out.",
        };
        setLocationStatus(msgs[error.code] || "Location error.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    geoWatchRef.current = watchId;
    return () => {
      navigator.geolocation.clearWatch(watchId);
      geoWatchRef.current = null;
    };
  }, []);

  // Define useCallback hooks before any early returns
  const processEmotionResult = useCallback((result: EmotionResult) => {
    if (!result || !result.success) {
      console.log("❌ Emotion detection failed or not successful:", result?.error);
      return;
    }

    const { emotion, confidence, all_scores } = result;
    console.log(`🔍 Emotion Analysis: ${emotion} (${(confidence * 100).toFixed(1)}% confidence)`);
    console.log("📊 All scores:", all_scores);
    
    // Distress level = max of fear + angry scores combined
    const fearScore = all_scores?.fear || 0;
    const angryScore = all_scores?.angry || 0;
    const currentFearLevel = Math.min(100, Math.round(Math.max(fearScore, angryScore * 0.8) * 100));
    setFearLevel(currentFearLevel);
    setLastEmotion(emotion);
    setFearHistory(prev => [...prev.slice(-14), currentFearLevel]);

    // Screaming/distress triggers: fear OR angry both indicate danger
    const isDistress = (emotion === 'fear' || emotion === 'angry') && confidence > 0.1;
    if (isDistress) {
      console.log(`⚠️ DISTRESS DETECTED (${emotion})! Confidence: ${(confidence * 100).toFixed(1)}% (${consecutiveFearCount + 1}/${SOS_FEAR_THRESHOLD} detections)`);
      setConsecutiveFearCount(prev => {
        const newCount = prev + 1;
        if (newCount >= SOS_FEAR_THRESHOLD && !isSOSTriggered) {
          console.log('🚨 SOS TRIGGERED - Fear detected consistently!');
          setIsSOSTriggered(true);
          triggerSOS();
          showToast("warning", "SOS Triggered by AI! Countdown started.");
        }
        return newCount;
      });
    } else {
      setConsecutiveFearCount(0);
    }
  }, [isSOSTriggered, consecutiveFearCount]);

  const stopAudioVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setAudioLevels(new Array(20).fill(0));
    setCurrentVolume(0);
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Release wake lock when monitoring stops
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    // Stop audio visualization
    stopAudioVisualization();

    // Stop speech recognition
    stopSpeechRecognition();

    setIsListening(false);
    setConsecutiveFearCount(0);
    setMessage("AI voice detection stopped.");
    setMessageType("info");
  }, [stopAudioVisualization, stopSpeechRecognition]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl animate-orb-float pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-coral/5 rounded-full blur-3xl animate-orb-float-reverse pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 card p-12 flex flex-col items-center"
        >
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-border-default" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-t-4 border-accent-gold"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-2 rounded-full border-t-2 border-accent-coral/30"
            />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-accent-gold/15 to-accent-coral/15 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-accent-gold" />
            </div>
          </div>
          <p className="text-xl font-semibold text-text-primary">Loading SOS Dashboard</p>
          <p className="text-sm text-text-tertiary mt-2">Preparing your emergency safety system…</p>
        </motion.div>
      </div>
    );
  }

  // Don't render the component if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleMouseDown = () => {
    setIsPressing(true);
    setMessage("Initiating emergency sequence...");
    setMessageType("info");
    const timer = setTimeout(() => {
      triggerSOS();
      setIsPressing(false);
      setPressTimer(null);
    }, 3000);
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    setIsPressing(false);
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    if (message === "Initiating emergency sequence...") {
      setMessage("Press and hold for 3 seconds to send SOS.");
      setMessageType("info");
    }
  };

  // Fear Detection Logic
  const analyzeAudioChunk = async (audioBlob: Blob): Promise<EmotionResult | null> => {
    try {
      console.log('🔍 Starting audio analysis...');
      console.log('📊 Audio blob details:', { size: audioBlob.size, type: audioBlob.type });

      // Skip silent chunks client-side — saves Gemini API tokens
      if (currentVolume < 5) {
        console.log('🔇 Skipping silent chunk (volume too low)');
        return null;
      }

      // Use real MIME type and matching extension — sending wrong type causes model to crash
      const mimeType = audioBlob.type || 'audio/webm';
      const ext = mimeType.includes('mp4') ? 'mp4'
                : mimeType.includes('ogg') ? 'ogg'
                : mimeType.includes('wav') ? 'wav'
                : 'webm';

      const formData = new FormData();
      const audioFile = new File([audioBlob], `chunk.${ext}`, { type: mimeType });
      formData.append('audio', audioFile);

      const response = await fetch('/api/emotion/analyze', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Raw API response:', data);
      return data;
    } catch (error) {
      console.error('💥 Error analyzing audio chunk:', error);
      showToast("error", `API Error: ${(error as Error).message}`);
      return null;
    }
  };

  // Audio visualization setup — uses the AudioContext already created synchronously in the click handler
  const setupAudioVisualization = async (stream: MediaStream) => {
    try {
      // Reuse the context created synchronously in startListening (required for iOS Safari)
      const audioContext = audioContextRef.current;
      if (!audioContext) {
        console.error('No AudioContext available');
        return;
      }

      // Ensure it's running (may still be suspended after creation)
      if (audioContext.state !== 'running') {
        await audioContext.resume();
      }
      console.log('🔊 AudioContext state:', audioContext.state);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      const timeDomainArray = new Uint8Array(analyser.fftSize); // 256 samples

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyserRef.current = analyser;

      const BAR_COUNT = 20;

      // Expose stream track info for debug display
      const tracks = stream.getAudioTracks();
      console.log('🎙️ Audio tracks:', tracks.map(t => ({
        label: t.label, enabled: t.enabled, muted: t.muted, readyState: t.readyState
      })));

      let frameCount = 0;
      const tick = () => {
        if (!analyserRef.current || audioContext.state === 'closed') return;

        // Time-domain: values 0–255, silence = 128. Always shows voice activity.
        analyser.getByteTimeDomainData(timeDomainArray);
        let sumSq = 0;
        for (let i = 0; i < timeDomainArray.length; i++) {
          const v = (timeDomainArray[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / timeDomainArray.length);
        const vol = Math.min(100, Math.round(rms * 400));
        setCurrentVolume(vol);

        // Every 30 frames update debug info visible on screen
        if (frameCount++ % 30 === 0) {
          const track = tracks[0];
          setDebugInfo(prev => ({
            ...prev,
            ctxState: audioContext.state,
            trackEnabled: track?.enabled,
            trackMuted: track?.muted,
            trackState: track?.readyState,
            rawRms: rms.toFixed(4),
            sample0: timeDomainArray[0],
            vol,
          }));
        }

        // Bars from waveform peak per slice
        const sliceSize = Math.floor(timeDomainArray.length / BAR_COUNT);
        const levels: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let peak = 0;
          for (let j = i * sliceSize; j < (i + 1) * sliceSize; j++) {
            const v = Math.abs(timeDomainArray[j] - 128);
            if (v > peak) peak = v;
          }
          levels.push(Math.min(100, Math.round((peak / 128) * 400)));
        }
        setAudioLevels(levels);

        animationFrameRef.current = requestAnimationFrame(tick);
      };

      tick();
      console.log('✅ Audio visualization started');
    } catch (error) {
      console.error('Error setting up audio visualization:', error);
    }
  };

  const startListening = async () => {
    try {
      // ── MUST be synchronous (before any await) for iOS Safari ──────────
      // iOS requires AudioContext to be created inside a synchronous user-gesture.
      // Any await before new AudioContext() makes iOS treat it as "not a gesture".
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext: AudioContext = new AudioCtx();
      audioContext.resume(); // fire-and-forget here; we await it in setup
      audioContextRef.current = audioContext;
      // ───────────────────────────────────────────────────────────────────
      // Request wake lock to keep screen on during monitoring
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          // Re-acquire if visibility changes (e.g. user switches tab then returns)
          document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && wakeLockRef.current === null && isListening) {
              wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            }
          }, { once: false });
        } catch (e) {
          console.warn('Wake lock not granted:', e);
        }
      }

      // Simplest possible constraint — any custom constraint can cause
      // the browser to mark the track as muted on Chrome/Firefox/mobile.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        throw new Error(`Microphone access denied: ${(err as Error).message}`);
      }

      // If track arrives muted, wait up to 2 s for it to unmute
      const track = stream.getAudioTracks()[0];
      if (track && track.muted) {
        console.warn('⚠️ Track arrived muted — waiting for unmute...');
        await new Promise<void>((resolve) => {
          const onUnmute = () => { track.removeEventListener('unmute', onUnmute); resolve(); };
          track.addEventListener('unmute', onUnmute);
          setTimeout(resolve, 2000); // give up after 2 s and continue anyway
        });
      }
      console.log('🎤 Track muted after wait:', track?.muted, '| enabled:', track?.enabled);

      streamRef.current = stream;

      // Setup audio visualization (async — must await so AudioContext is resumed before recording starts)
      await setupAudioVisualization(stream);

      // Try different MIME types for better compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Use default
          }
        }
      }

      console.log('🎤 Using MIME type:', mimeType || 'default');

      const mediaRecorder = new MediaRecorder(stream, 
        mimeType ? { mimeType } : undefined
      );

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`🎤 Audio chunk captured: ${event.data.size} bytes`);
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          console.log(`📁 Audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
          
          // Check if audio blob has meaningful size (minimum 1KB)
          if (audioBlob.size < 1024) {
            console.warn('⚠️ Audio blob too small, skipping analysis:', audioBlob.size, 'bytes');
            chunksRef.current = [];
            return;
          }
          
          console.log('🔄 Sending audio for emotion analysis...');
          const result = await analyzeAudioChunk(audioBlob);
          if (result) {
            processEmotionResult(result);
          } else {
            console.warn('⚠️ No result from emotion analysis');
          }
        } else {
          console.warn('⚠️ No audio chunks available for analysis');
        }
        chunksRef.current = [];
      };

      mediaRecorder.start();
      
      intervalRef.current = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setTimeout(() => {
            if (streamRef.current && mediaRecorder.state === 'inactive') {
              mediaRecorder.start();
            }
          }, 100);
        }
      }, AUDIO_CHUNK_DURATION);

      setIsListening(true);
      setIsSOSTriggered(false);
      setConsecutiveFearCount(0);
      setMessage("AI listening for distress signals...");
      setMessageType("info");

    } catch (error) {
      console.error('Error starting audio monitoring:', error);
      alert('Error accessing microphone. Please allow microphone access.');
      setIsListening(false);
      setMessage("Failed to access microphone. Check permissions.");
      setMessageType("error");
    }
  };

  // Speech Recognition for keyword detection
  const startSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript.toLowerCase();
        }
        
        console.log('🎙️ Speech recognized:', transcript);
        
        // Check for emergency keywords
        const detectedKeywords = keywordsRef.current.filter(keyword => 
          transcript.includes(keyword.toLowerCase())
        );
        
        if (detectedKeywords.length > 0) {
          const keyword = detectedKeywords[0];
          console.log('🚨 EMERGENCY KEYWORD DETECTED:', keyword);
          setLastDetectedKeyword(keyword);
          
          if (!isSOSTriggered) {
            setIsSOSTriggered(true);
            triggerSOS();
            showToast("warning", `Emergency keyword "${keyword}" detected! SOS triggered.`);
          }
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
      
      recognition.onend = () => {
        // Restart if still enabled
        if (speechToTextEnabled && isListening) {
          setTimeout(() => recognition.start(), 1000);
        }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      
      console.log('🎙️ Speech recognition started for keywords:', keywordsRef.current);
    } else {
      console.log('Speech recognition not supported');
      showToast("warning", "Speech recognition not supported in this browser.");
    }
  };

  const resetSOS = () => {
    setIsSOSTriggered(false);
    setConsecutiveFearCount(0);
    setAlertSent(false);
    setCanceled(false);
    setShowAlertTimer(false);
    setTimerSeconds(3);
    setFearDetected(false);
    setLastDetectedKeyword(null);
    setMessage("SOS system reset. Ready for new detection.");
    setMessageType("info");
  };

  const toggleSpeechRecognition = () => {
    const newState = !speechToTextEnabled;
    setSpeechToTextEnabled(newState);

    if (newState) {
      startListening();
      startSpeechRecognition();
      setMessage("AI voice detection enabled.");
      setMessageType("info");
    } else {
      stopListening();
      setMessage("AI voice detection disabled.");
      setMessageType("info");
    }
  };

  const testAPI = async () => {
    try {
      setMessage("Testing API connection...");
      setMessageType("info");
      
      const response = await fetch('/api/emotion/health');
      
      if (response.ok) {
        const data = await response.json();
        setMessage(`API connected successfully! Status: ${data.status || 'OK'}`);
        setMessageType("success");
        showToast("success", "API connection successful!");
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('API test failed:', error);
      setMessage(`API test failed: ${(error as Error).message}`);
      setMessageType("error");
      showToast("error", "API connection failed. Check your Google Colab instance.");
    }
  };

  const triggerSOS = () => {
    console.log('🚨 SOS TRIGGERED!');
    setFearDetected(true);
    setShowAlertTimer(true);
    setTimerSeconds(3);
    setAlertSent(false);
    setCanceled(false);
    setMessage("🚨 SOS TRIGGERED! Alert will be sent in 3 seconds...");
    setMessageType("warning");
  };

  const sendSOSAlert = async () => {
    try {
      setMessage("Sending emergency alert to all contacts...");
      setMessageType("info");

      const alertData = {
        location: currentLat && currentLon
          ? `Lat: ${currentLat.toFixed(6)}, Lon: ${currentLon.toFixed(6)}`
          : locationStatus,
        lat: currentLat,
        lon: currentLon,
        emotion: lastEmotion || 'unknown',
        fearLevel: fearLevel,
        triggerMethod: isSOSTriggered ? 'AI Detection' : 'Manual',
        detectedKeyword: lastDetectedKeyword,
        timestamp: new Date().toISOString()
      };

      console.log('📞 Sending SOS alert with data:', alertData);

      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/emergency/send-alert', {
        method: 'POST',
        headers,
        body: JSON.stringify(alertData)
      });

      if (response.ok) {
        const result = await response.json();
        setAlertSent(true);
        setMessage(`✅ ${result.message}`);
        setMessageType("success");
        showToast("success", `Emergency alert sent to ${result.contactsNotified} contact(s)!`);
        console.log('📱 Alert sent to contacts:', result.sendResults);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send alert');
      }
    } catch (error) {
      console.error('Error sending SOS alert:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage(`❌ Failed to send emergency alert: ${errorMessage}`);
      setMessageType("error");
      showToast("error", errorMessage);
    }
  };

  const handleCancelAlert = () => {
    setShowAlertTimer(false);
    setTimerSeconds(3);
    setFearDetected(false);
    setCanceled(true);
    setAlertSent(false);
    setMessage("Emergency alert canceled.");
    showToast("info", "Emergency alert canceled.");
    setIsSOSTriggered(false);
    setConsecutiveFearCount(0);
  };

  const getFearLevelColor = (level: number) => {
    if (level < 30) return 'bg-accent-emerald';
    if (level < 60) return 'bg-accent-gold';
    if (level < 80) return 'bg-accent-gold';
    return 'bg-accent-coral';
  };

  const getFearLevelText = (level: number) => {
    if (level < 30) return 'Calm';
    if (level < 60) return 'Mild Concern';
    if (level < 80) return 'Elevated';
    return 'High Alert';
  };


  // Auth loading guard — prevent flash of protected content
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-bg-base relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-bg-surface via-bg-surface to-accent-gold/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl animate-orb-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-coral/10 rounded-full blur-3xl animate-orb-slow-reverse" />
        <div className="relative z-10 text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-border-default" />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-1.5 rounded-full border-[2px] border-accent-gold/20 border-b-accent-gold" />
            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-3 rounded-full bg-gradient-to-br from-accent-gold to-accent-coral flex items-center justify-center shadow-lg shadow-accent-gold/25">
              <span className="material-icons text-text-primary text-xl">crisis_alert</span>
            </motion.div>
          </div>
          <h1 className="text-text-primary text-lg font-bold tracking-tight">SOS Emergency</h1>
          <p className="text-text-tertiary text-sm mt-2">Securing your session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;


  return (
    <div className="flex flex-col min-h-screen bg-bg-base text-text-primary relative overflow-hidden">
      <Navbar />

      <div className="flex-1 pt-20 md:pt-24 pb-12 px-4 md:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">

          {/* ═══════ HEADER ═══════ */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
                Emergency Dashboard
              </h1>
              <p className="text-sm text-text-tertiary mt-1">
                AI-powered safety monitoring &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {userRole === 'admin' ? (
                <Link href="/admin">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-secondary text-sm"
                  >
                    <Users className="w-4 h-4" />
                    Admin
                  </motion.button>
                </Link>
              ) : (
                <Link href="/plans">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-secondary text-sm"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade
                  </motion.button>
                </Link>
              )}
            </div>
          </motion.div>

          {/* ═══════ MAIN GRID ═══════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* ── LEFT COLUMN (Location + Emergency Types) ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-4 space-y-5 order-3 lg:order-1"
            >
              {/* Location Card */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent-emerald/10 border border-accent-emerald/15 flex items-center justify-center">
                      <MapPin className="w-4.5 h-4.5 text-accent-emerald" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Live Location</p>
                      <p className="text-xs text-text-tertiary">GPS tracking active</p>
                    </div>
                  </div>
                  <span className={`badge ${currentLat && currentLon ? 'badge-green' : 'badge-coral'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentLat && currentLon ? 'bg-accent-emerald animate-pulse' : 'bg-accent-coral'}`} />
                    {currentLat && currentLon ? 'Acquired' : 'No Signal'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle mb-4">
                  <Crosshair className="w-4 h-4 text-text-muted" />
                  <span className="font-mono text-xs text-text-secondary truncate">{locationStatus}</span>
                </div>

                {currentLat && currentLon ? (
                  <div className="relative w-full h-52 rounded-xl overflow-hidden border border-border-subtle">
                    <iframe
                      width="100%" height="100%"
                      style={{ border: 0, filter: 'brightness(0.9) saturate(0.85)' }}
                      loading="lazy" allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${currentLat},${currentLon}&zoom=15&maptype=roadmap`}
                    />
                    <div className="absolute bottom-3 right-3 bg-bg-base/80 backdrop-blur-md text-text-secondary text-[11px] font-mono px-2.5 py-1 rounded-lg border border-border-default">
                      {currentLat.toFixed(4)}, {currentLon.toFixed(4)}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-52 rounded-xl bg-bg-elevated border border-border-subtle flex flex-col items-center justify-center gap-3">
                    <MapPinOff className="w-8 h-8 text-text-muted" />
                    <div className="text-center">
                      <p className="text-sm text-text-secondary font-medium">Location Unavailable</p>
                      <p className="text-xs text-text-muted mt-1">Enable GPS to see your position</p>
                    </div>
                    <button onClick={() => window.location.reload()}
                      className="text-xs text-text-tertiary hover:text-text-primary border border-border-default hover:border-border-hover px-4 py-2 rounded-xl transition-colors">
                      Retry
                    </button>
                  </div>
                )}

                {currentLat && currentLon && (
                  <div className="flex gap-2.5 mt-4">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLon}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-bg-hover border border-border-subtle hover:border-border-default py-2.5 rounded-xl transition-all">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in Maps
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(`${currentLat}, ${currentLon}`); showToast('success', 'Coordinates copied'); }}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-bg-hover border border-border-subtle hover:border-border-default py-2.5 rounded-xl transition-all">
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                  </div>
                )}
              </div>

              {/* Emergency Type Chips */}
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { icon: Flame, label: 'Fire', accent: 'text-accent-coral', bg: 'bg-accent-coral/10', border: 'border-accent-coral/15' },
                  { icon: Heart, label: 'Medical', accent: 'text-accent-emerald', bg: 'bg-accent-emerald/10', border: 'border-accent-emerald/15' },
                  { icon: Car, label: 'Accident', accent: 'text-accent-blue', bg: 'bg-accent-blue/10', border: 'border-accent-blue/15' },
                  { icon: LifeBuoy, label: 'Rescue', accent: 'text-accent-gold', bg: 'bg-accent-gold/10', border: 'border-accent-gold/15' },
                ].map(({ icon: Icon, label, accent, bg, border }) => (
                  <motion.div
                    key={label}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex flex-col items-center gap-2 py-3.5 rounded-xl border ${bg} ${border} cursor-pointer transition-all duration-200`}
                  >
                    <Icon className={`w-5 h-5 ${accent}`} />
                    <span className={`text-xs font-medium ${accent}`}>{label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ── CENTER COLUMN (SOS + Controls) ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-4 flex flex-col items-center gap-6 order-1 lg:order-2 py-4"
            >
              {/* SOS Button */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72">
                {/* Ripple rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute w-full h-full rounded-full border-2 border-accent-coral/10 animate-pulse" style={{ animationDuration: '4s' }} />
                  <div className="absolute w-[115%] h-[115%] rounded-full border border-accent-coral/5 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1.3s' }} />
                  <div className="absolute w-[130%] h-[130%] rounded-full border border-accent-coral/5 animate-pulse" style={{ animationDuration: '4s', animationDelay: '2.6s' }} />
                </div>

                <motion.button
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchEnd={handleMouseUp}
                  whileHover={{ scale: alertSent || canceled ? 1 : 1.03 }}
                  whileTap={{ scale: alertSent || canceled ? 1 : 0.95 }}
                  className={`relative w-full h-full rounded-full flex items-center justify-center font-bold text-4xl sm:text-5xl tracking-wider transition-all duration-500
                    bg-gradient-to-br from-accent-coral via-accent-coral to-accent-coral/80
                    ${isPressing
                      ? 'shadow-[0_0_100px_-10px_rgba(232,108,92,0.6)] ring-[12px] ring-accent-coral/20'
                      : 'shadow-[0_0_60px_-10px_rgba(232,108,92,0.35)] ring-[6px] ring-accent-coral/10 hover:shadow-[0_0_80px_-5px_rgba(232,108,92,0.5)]'
                    }
                    ${alertSent || canceled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                  `}
                  disabled={alertSent || canceled}
                >
                  <span className="relative z-10 drop-shadow-lg">SOS</span>
                  <div className="absolute inset-6 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
                  <AnimatePresence>
                    {isPressing && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.4, opacity: 0.4 }}
                        exit={{ scale: 1.7, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 rounded-full bg-accent-coral blur-xl"
                      />
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>

              {/* AI Voice Toggle */}
              <div className="w-full max-w-sm flex items-center justify-between px-5 py-3.5 rounded-2xl card">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${speechToTextEnabled ? 'bg-accent-gold/15' : 'bg-bg-elevated'}`}>
                    <Mic className={`w-4.5 h-4.5 transition-colors ${speechToTextEnabled ? 'text-accent-gold' : 'text-text-muted'}`} />
                  </div>
                  <span className={`text-sm font-medium transition-colors ${speechToTextEnabled ? 'text-accent-gold-light' : 'text-text-secondary'}`}>
                    AI Voice Detection
                  </span>
                </div>
                <label htmlFor="ai-voice-toggle" className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="ai-voice-toggle" className="sr-only peer" checked={speechToTextEnabled} onChange={toggleSpeechRecognition} />
                  <div className="w-12 h-7 bg-bg-elevated peer-checked:bg-accent-gold rounded-full transition-all peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-text-primary after:rounded-full after:h-[22px] after:w-[22px] after:transition-all after:shadow-md"></div>
                </label>
              </div>

              {/* Message bar */}
              <motion.div
                key={message}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`w-full max-w-sm text-center text-sm font-medium px-5 py-3 rounded-2xl border backdrop-blur-sm
                  ${messageType === "success" ? "bg-accent-emerald/8 text-accent-emerald border-accent-emerald/20" : ""}
                  ${messageType === "error" ? "bg-accent-coral/8 text-accent-coral border-accent-coral/20" : ""}
                  ${messageType === "info" ? "bg-accent-blue/8 text-accent-blue border-accent-blue/20" : ""}
                  ${messageType === "warning" ? "bg-accent-gold/8 text-accent-gold border-accent-gold/20" : ""}
                `}
              >
                {message}
              </motion.div>

              {/* Alert Timer */}
              <AnimatePresence>
                {showAlertTimer && !canceled && !alertSent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="w-full max-w-xs p-6 bg-gradient-to-br from-accent-gold/10 to-accent-coral/5 border border-accent-gold/20 text-accent-gold rounded-2xl text-center shadow-xl"
                  >
                    <div className="relative inline-flex items-center justify-center mb-3">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-border-default" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-accent-gold"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - timerSeconds / 3)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-3xl font-bold">{timerSeconds}</span>
                    </div>
                    <p className="text-xs text-text-tertiary mb-5">SOS alert sending shortly…</p>
                    <button onClick={handleCancelAlert}
                      className="text-xs font-semibold text-text-primary bg-bg-hover hover:bg-bg-pressed border border-border-default px-6 py-2.5 rounded-xl transition-all hover:scale-105">
                      Cancel Alert
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-xs text-text-muted text-center max-w-[260px] leading-relaxed">
                Press and hold for 3 seconds to send emergency SOS
              </p>
            </motion.div>

            {/* ── RIGHT COLUMN (Fear Detection) ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-4 order-2 lg:order-3"
            >
              <div className="card p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent-gold/10 border border-accent-gold/15 flex items-center justify-center">
                      <Activity className="w-4.5 h-4.5 text-accent-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Fear Detection</p>
                      <p className="text-xs text-text-tertiary">Real-time audio analysis</p>
                    </div>
                  </div>
                  {isSOSTriggered ? (
                    <span className="badge badge-coral animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-coral" />
                      SOS Active
                    </span>
                  ) : (
                    <span className={`badge ${isListening ? 'badge-green' : 'badge-gold'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-accent-emerald animate-pulse' : 'bg-text-muted'}`} />
                      {isListening ? 'Listening' : 'Idle'}
                    </span>
                  )}
                </div>

                {/* Threat Level Bar */}
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-text-tertiary">Threat Level</span>
                    <span className={`text-xs font-semibold ${
                      fearLevel > 70 ? 'text-accent-coral' : fearLevel > 40 ? 'text-accent-gold' : 'text-accent-emerald'
                    }`}>
                      {fearLevel}% — {getFearLevelText(fearLevel)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        fearLevel > 70 ? 'bg-accent-coral' : fearLevel > 40 ? 'bg-accent-gold' : 'bg-accent-emerald'
                      }`}
                      animate={{ width: `${Math.min(fearLevel, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Audio Waveform */}
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-accent-emerald' : 'text-text-muted'}`} />
                      <span className="text-xs text-text-tertiary">Microphone</span>
                      {isListening ? (
                        <span className="flex items-center gap-1">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-emerald" />
                          </span>
                          <span className="text-[11px] font-semibold text-accent-emerald uppercase tracking-wide">Live</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-text-muted uppercase tracking-wide">Off</span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted font-mono">{isListening ? `${Math.round(currentVolume)}% vol` : '—'}</span>
                  </div>
                  <div className={`flex items-end justify-between h-14 px-2 py-1.5 rounded-xl border overflow-hidden transition-colors duration-300 ${
                    isListening
                      ? currentVolume > 5 ? 'bg-accent-emerald/5 border-accent-emerald/10' : 'bg-bg-elevated border-border-subtle'
                      : 'bg-bg-surface border-border-subtle/50'
                  }`}>
                    {audioLevels.map((level, index) => (
                      <div
                        key={index}
                        className={`rounded-sm transition-all duration-75 ${
                          !isListening ? 'bg-text-muted/20' :
                          level > 70 ? 'bg-accent-coral/80' :
                          level > 40 ? 'bg-accent-gold/80' :
                          level > 8 ? 'bg-accent-emerald/80' : 'bg-text-muted/30'
                        }`}
                        style={{
                          height: isListening ? `${Math.max(4, (level / 100) * 48)}px` : '4px',
                          width: '4%',
                          transition: 'height 80ms ease, background-color 200ms ease',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Debug info */}
                {isListening && (
                  <div className="mb-4 px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle font-mono text-[11px] text-text-muted flex flex-wrap gap-x-3 gap-y-1">
                    <span>ctx:<span className={debugInfo.ctxState === 'running' ? 'text-accent-emerald' : 'text-accent-coral'}> {debugInfo.ctxState ?? '…'}</span></span>
                    <span>track:<span className={debugInfo.trackEnabled ? 'text-accent-emerald' : 'text-accent-coral'}> {debugInfo.trackState ?? '…'}</span></span>
                    <span>muted:<span className={debugInfo.trackMuted ? 'text-accent-coral' : 'text-accent-emerald'}> {String(debugInfo.trackMuted ?? '…')}</span></span>
                    <span>vol: <span className="text-text-secondary">{debugInfo.vol ?? '…'}</span></span>
                    {debugInfo.trackMuted && (
                      <span className="w-full text-accent-coral font-semibold">⚠ Mic muted by browser/OS — check system mic settings</span>
                    )}
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                  {[
                    { label: 'Emotion', value: lastEmotion || '—', highlight: lastEmotion === 'fear' },
                    { label: 'Keyword', value: lastDetectedKeyword || '—', highlight: !!lastDetectedKeyword },
                    { label: 'Streak', value: `${consecutiveFearCount}/${SOS_FEAR_THRESHOLD}`, highlight: consecutiveFearCount >= SOS_FEAR_THRESHOLD },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="rounded-xl bg-bg-elevated border border-border-subtle px-3 py-2.5">
                      <p className="text-[11px] text-text-muted mb-1">{label}</p>
                      <p className={`text-xs font-semibold truncate capitalize ${highlight ? 'text-accent-coral' : 'text-text-secondary'}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Keywords */}
                <div className="rounded-xl bg-bg-elevated border border-border-subtle p-3.5 mb-5">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs text-text-tertiary font-medium uppercase tracking-wide">Trigger Keywords</span>
                    <span className="text-xs text-text-muted">{keywords.length} active</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto scrollbar-none">
                    {keywords.length === 0 ? (
                      <p className="text-xs text-text-muted italic">No keywords configured</p>
                    ) : keywords.map((keyword, index) => (
                      <span key={index}
                        className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all duration-200 ${
                          lastDetectedKeyword === keyword
                            ? 'bg-accent-coral/10 text-accent-coral border border-accent-coral/15'
                            : 'bg-bg-hover text-text-tertiary border border-border-subtle'
                        }`}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Control buttons */}
                <div className="flex gap-2.5">
                  {!isListening ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startListening}
                      disabled={speechToTextEnabled}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-bg-base bg-gradient-to-r from-accent-gold to-accent-gold-light shadow-glow-gold py-3 rounded-xl transition-all disabled:opacity-40"
                    >
                      <Mic className="w-4 h-4" />
                      Start Monitoring
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={stopListening}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-text-primary bg-gradient-to-r from-accent-coral to-accent-coral/80 shadow-glow-coral py-3 rounded-xl transition-all"
                    >
                      <Square className="w-4 h-4" />
                      Stop Monitoring
                    </motion.button>
                  )}
                  {(isSOSTriggered || isListening) && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={resetSOS}
                      className="flex items-center justify-center gap-2 text-xs font-medium text-text-tertiary hover:text-text-primary bg-bg-hover hover:bg-bg-elevated border border-border-subtle px-4 py-3 rounded-xl transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </motion.button>
                  )}
                </div>

                <button onClick={testAPI}
                  className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-medium text-text-muted hover:text-text-tertiary border border-border-subtle hover:border-border-default hover:bg-bg-hover py-2.5 rounded-xl transition-all">
                  <FlaskConical className="w-3.5 h-3.5" />
                  Test API Connection
                </button>

                <p className="mt-4 text-[11px] text-text-muted/60 text-center leading-relaxed">
                  Analyzes 5-second chunks · SOS after {SOS_FEAR_THRESHOLD} consecutive fear detections
                </p>
              </div>
            </motion.div>
          </div>

          {/* ═══════ SAFETY TIPS ═══════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-default to-transparent" />
              <span className="section-label">Safety Tips</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-default to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Share2, color: 'from-accent-blue/10 to-accent-blue/5 border-accent-blue/10', hover: 'hover:border-accent-blue/25', title: 'Share Your Route', tip: 'Always let someone know your planned route before travelling alone at night.' },
                { icon: Contact2, color: 'from-accent-emerald/10 to-accent-emerald/5 border-accent-emerald/10', hover: 'hover:border-accent-emerald/25', title: 'Keep Contacts Updated', tip: 'Make sure your emergency contacts have the correct phone numbers in Settings.' },
                { icon: Battery, color: 'from-accent-gold/10 to-accent-gold/5 border-accent-gold/10', hover: 'hover:border-accent-gold/25', title: 'Keep Phone Charged', tip: 'Maintain at least 20% battery when going out. A dead phone can\u2019t call for help.' },
                { icon: Mic, color: 'from-accent-coral/10 to-accent-coral/5 border-accent-coral/10', hover: 'hover:border-accent-coral/25', title: 'Use Voice Keywords', tip: 'Enable keyword monitoring and say a trigger word to silently send an SOS alert.' },
              ].map(({ icon: Icon, color, hover, title, tip }) => (
                <motion.div
                  key={title}
                  whileHover={{ y: -4 }}
                  className={`rounded-2xl border bg-gradient-to-br ${color} ${hover} p-6 flex flex-col gap-3 transition-all duration-300 cursor-default`}
                >
                  <Icon className="w-6 h-6 text-text-secondary" />
                  <p className="text-sm font-semibold text-text-primary">{title}</p>
                  <p className="text-xs text-text-tertiary leading-relaxed">{tip}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ═══════ QUICK STATS ═══════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 grid grid-cols-3 gap-4"
          >
            {[
              { icon: Contact2, label: 'Emergency Contacts', value: contacts.length, suffix: 'saved', color: 'text-accent-emerald', bg: 'from-accent-emerald/8 to-accent-emerald/4 border-accent-emerald/10' },
              { icon: Mic, label: 'Trigger Keywords', value: keywords.length, suffix: 'active', color: 'text-accent-blue', bg: 'from-accent-blue/8 to-accent-blue/4 border-accent-blue/10' },
              { icon: Activity, label: 'Monitoring', value: isListening ? 'ON' : 'OFF', suffix: '', color: isListening ? 'text-accent-gold' : 'text-text-muted', bg: isListening ? 'from-accent-gold/8 to-accent-gold/4 border-accent-gold/10' : 'from-white/[0.03] to-white/[0.01] border-border-subtle' },
            ].map(({ icon: Icon, label, value, suffix, color, bg }) => (
              <motion.div
                key={label}
                whileHover={{ y: -3 }}
                className={`rounded-2xl border bg-gradient-to-br ${bg} p-6 text-center transition-all duration-300`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-3 ${color}`} />
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-text-tertiary leading-tight mt-2">{label}</p>
                {suffix && <p className="text-xs text-text-muted mt-1">{suffix}</p>}
              </motion.div>
            ))}
          </motion.div>

          {/* ═══════ EMERGENCY CONTACTS STRIP ═══════ */}
          {contacts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-px w-8 bg-gradient-to-r from-accent-emerald to-transparent" />
                  <span className="section-label">Emergency Contacts</span>
                </div>
                <Link href="/settings" className="text-xs text-accent-gold hover:text-accent-gold-light transition-colors flex items-center gap-1 font-medium">
                  Manage <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {contacts.slice(0, 5).map((c, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="flex-shrink-0 flex items-center gap-3 bg-bg-elevated hover:bg-bg-hover border border-border-default rounded-xl px-4 py-3 min-w-[190px] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-emerald/80 to-accent-emerald flex items-center justify-center text-sm font-bold text-text-primary shrink-0 shadow-lg shadow-accent-emerald/10">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-text-primary truncate">{c.name}</p>
                      <p className="text-xs text-text-tertiary truncate">{c.relationship || c.phone}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════ FOOTER STRIP ═══════ */}
          <div className="mt-16 mb-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-text-muted">
            <Link href="/support" className="hover:text-text-tertiary transition-colors flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Help & Support
            </Link>
            <span className="hidden sm:inline text-border-default">·</span>
            <Link href="/privacy-policy" className="hover:text-text-tertiary transition-colors flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Privacy Policy
            </Link>
            <span className="hidden sm:inline text-border-default">·</span>
            <Link href="/blogs" className="hover:text-text-tertiary transition-colors flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Safety Blogs
            </Link>
            <span className="hidden sm:inline text-border-default">·</span>
            <span className="text-text-muted/50">SOS Emergency © 2025</span>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-medium text-text-primary z-50 border backdrop-blur-xl
              ${toast.type === "success" ? "bg-accent-emerald/90 border-accent-emerald/20 shadow-accent-emerald/10" : ""}
              ${toast.type === "error" ? "bg-accent-coral/90 border-accent-coral/20 shadow-accent-coral/10" : ""}
              ${toast.type === "info" ? "bg-accent-blue/90 border-accent-blue/20 shadow-accent-blue/10" : ""}
              ${toast.type === "warning" ? "bg-accent-gold/90 border-accent-gold/20 shadow-accent-gold/10" : ""}
            `}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
