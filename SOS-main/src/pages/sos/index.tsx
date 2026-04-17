// src/pages/sos/index.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Navbar from '../../components/Navbar';

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

  // Authentication check using NextAuth
  useEffect(() => {
    if (status === 'loading') {
      // Still loading session
      return;
    }

    if (status === 'unauthenticated' || !session) {
      // Not authenticated, redirect to login
      router.push('/auth');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      // Authenticated via NextAuth
      setUserRole(session.user.role || 'user');
      setIsAuthenticated(true);
      setIsLoading(false);
    }
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute inset-0 bg-gray-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-orb-slow pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-orb-slow-reverse pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 bg-gray-900/60 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/20 p-12 flex flex-col items-center"
        >
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-white/10" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-t-4 border-orange-500"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-2 rounded-full border-t-2 border-red-500/40"
            />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-orange-500/20 to-red-600/20 flex items-center justify-center">
              <span className="material-icons text-orange-400 text-xl">crisis_alert</span>
            </div>
          </div>
          <p className="text-xl font-semibold text-white">Loading SOS Dashboard</p>
          <p className="text-sm text-white/40 mt-2">Preparing your emergency safety system…</p>
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
        emotion: lastEmotion || 'unknown',
        fearLevel: fearLevel,
        triggerMethod: isSOSTriggered ? 'AI Detection' : 'Manual',
        detectedKeyword: lastDetectedKeyword,
        timestamp: new Date().toISOString()
      };

      console.log('📞 Sending SOS alert with data:', alertData);

      const response = await fetch('/api/emergency/send-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
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
    if (level < 30) return 'bg-green-500';
    if (level < 60) return 'bg-yellow-500';
    if (level < 80) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getFearLevelText = (level: number) => {
    if (level < 30) return 'Calm';
    if (level < 60) return 'Mild Concern';
    if (level < 80) return 'Elevated';
    return 'High Alert';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col min-h-screen text-white font-sans relative overflow-hidden"
    >
      <Navbar />

      {/* Page body */}
      <div className="flex-1 pt-20 md:pt-24 pb-10 px-4 md:px-6 lg:px-8 z-10">

        {/* Status bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-screen-xl mx-auto flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Emergency Dashboard</h1>
            <p className="text-xs text-white/40 mt-1">AI-powered safety & rapid response</p>
          </div>
          <div className="flex items-center gap-3">
            {userRole === 'admin' ? (
              <Link href="/admin">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/20 transition-all">
                  <span className="material-icons text-sm">admin_panel_settings</span>
                  Admin
                </motion.button>
              </Link>
            ) : (
              <Link href="/plans">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all">
                  <span className="material-icons text-sm">workspace_premium</span>
                  Upgrade
                </motion.button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* 3-column grid: left=location, center=SOS, right=detection */}
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr_380px] gap-6 items-start">

          {/* ══ LEFT COLUMN ══ */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4 order-3 lg:order-1"
          >

        {/* Location Card — professional */}
        <div className="w-full bg-gray-900/60 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/20 p-5 hover-lift">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <span className="material-icons text-emerald-400 text-base">location_on</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">Live Location</p>
                <p className="text-[11px] text-white/40 mt-0.5">GPS tracking active</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${
              currentLat && currentLon
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                currentLat && currentLon ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`} />
              {currentLat && currentLon ? 'Acquired' : 'No Signal'}
            </span>
          </div>

          {/* Coordinates row */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] mb-3">
            <span className="material-icons text-white/30 text-sm">gps_fixed</span>
            <span className="font-mono text-xs text-white/70 truncate">{locationStatus}</span>
          </div>

          {/* Map */}
          {currentLat && currentLon ? (
            <div className="relative w-full h-52 rounded-xl overflow-hidden border border-white/[0.07]">
              <iframe
                width="100%" height="100%"
                style={{ border: 0, filter: 'brightness(0.92) saturate(0.9)' }}
                loading="lazy" allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${currentLat},${currentLon}&zoom=15&maptype=roadmap`}
              />
              {/* Subtle coordinate badge bottom-right */}
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-mono px-2 py-1 rounded">
                {currentLat.toFixed(4)}, {currentLon.toFixed(4)}
              </div>
            </div>
          ) : (
            <div className="w-full h-52 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center justify-center gap-3">
              <span className="material-icons text-white/20 text-4xl">location_off</span>
              <div className="text-center">
                <p className="text-sm text-white/50 font-medium">Location Unavailable</p>
                <p className="text-xs text-white/30 mt-0.5">Enable GPS to see your position</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Action buttons */}
          {currentLat && currentLon && (
            <div className="flex gap-2 mt-4">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLon}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] py-2.5 rounded-xl transition-all hover:scale-[1.02]"
              >
                <span className="material-icons text-sm">open_in_new</span>
                Open in Maps
              </a>
              <button
                onClick={() => { navigator.clipboard.writeText(`${currentLat}, ${currentLon}`); showToast('success', 'Coordinates copied'); }}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] py-2.5 rounded-xl transition-all hover:scale-[1.02]"
              >
                <span className="material-icons text-sm">content_copy</span>
                Copy Coords
              </button>
            </div>
          )}
        </div>

          {/* Emergency type chips */}
          <div className="grid grid-cols-4 gap-3">
          {[
            { icon: 'local_fire_department', label: 'Fire',    accent: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20', hover: 'hover:bg-red-500/20 hover:border-red-500/30'    },
            { icon: 'medical_services',      label: 'Medical', accent: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hover: 'hover:bg-emerald-500/20 hover:border-emerald-500/30' },
            { icon: 'directions_car',        label: 'Accident',accent: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20', hover: 'hover:bg-blue-500/20 hover:border-blue-500/30'   },
            { icon: 'support_agent',         label: 'Rescue',  accent: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hover: 'hover:bg-orange-500/20 hover:border-orange-500/30' },
          ].map(({ icon, label, accent, bg, border, hover }) => (
            <motion.div 
              key={label} 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border ${bg} ${border} ${hover} cursor-pointer transition-all duration-200`}
            >
              <span className={`material-icons text-xl ${accent}`}>{icon}</span>
              <span className={`text-[11px] font-medium ${accent}`}>{label}</span>
            </motion.div>
          ))}
          </div>
          </motion.div>{/* end left column */}

          {/* ══ CENTER COLUMN ══ */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-5 order-1 lg:order-2 py-8"
          >
            <div className="relative w-56 h-56 sm:w-68 sm:h-68 lg:w-80 lg:h-80">
              {/* Ripple rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-full h-full rounded-full border-2 border-red-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-[120%] h-[120%] rounded-full border border-red-500/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                <div className="absolute w-[140%] h-[140%] rounded-full border border-red-500/5 animate-ping" style={{ animationDuration: '3s', animationDelay: '2s' }} />
              </div>
              
              <motion.button
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                whileHover={{ scale: alertSent || canceled ? 1 : 1.03 }}
                whileTap={{ scale: alertSent || canceled ? 1 : 0.95 }}
                className={`
                  relative w-full h-full rounded-full flex items-center justify-center
                  font-bold text-3xl sm:text-4xl tracking-wider
                  transition-all duration-300 shadow-2xl
                  bg-gradient-to-br from-red-500 to-red-700
                  ${isPressing
                    ? 'shadow-[0_0_80px_-10px_rgba(239,68,68,0.8)] ring-8 ring-red-500/40'
                    : 'shadow-[0_0_60px_-10px_rgba(239,68,68,0.5)] ring-4 ring-red-400/30 hover:shadow-[0_0_80px_-5px_rgba(239,68,68,0.7)]'
                  }
                  ${alertSent || canceled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                `}
                disabled={alertSent || canceled}
              >
                <span className="relative z-10 drop-shadow-lg">SOS</span>
                
                {/* Inner glow */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-red-400/30 to-transparent" />
                
                <AnimatePresence>
                  {isPressing && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 0.6 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 rounded-full bg-red-400 blur-md"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

        <div className="mb-4 flex items-center justify-between w-full max-w-md px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${speechToTextEnabled ? 'bg-orange-500/20' : 'bg-white/5'}`}>
              <span className={`material-icons text-base transition-colors ${speechToTextEnabled ? 'text-orange-400' : 'text-white/40'}`}>record_voice_over</span>
            </div>
            <span className={`text-sm font-medium transition-colors ${speechToTextEnabled ? 'text-orange-300' : 'text-white/60'}`}>AI Voice Detection</span>
          </div>
          <label htmlFor="ai-voice-toggle" className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="ai-voice-toggle" className="sr-only peer" checked={speechToTextEnabled} onChange={toggleSpeechRecognition} />
            <div className="w-11 h-6 bg-white/10 peer-checked:bg-orange-500 rounded-full transition-all peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md"></div>
          </label>
        </div>

        <motion.div
          key={message}
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`w-full max-w-sm text-center text-sm font-medium px-5 py-3 rounded-2xl border backdrop-blur-sm shadow-lg
            ${messageType === "success" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10" : ""}
            ${messageType === "error" ? "bg-red-500/15 text-red-400 border-red-500/30 shadow-red-500/10" : ""}
            ${messageType === "info" ? "bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-blue-500/10" : ""}
            ${messageType === "warning" ? "bg-orange-500/15 text-orange-400 border-orange-500/30 shadow-orange-500/10" : ""}
          `}
        >
          {message}
        </motion.div>

        <AnimatePresence>
          {showAlertTimer && !canceled && !alertSent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="w-full max-w-xs p-5 bg-gradient-to-br from-amber-500/20 to-red-500/10 border border-amber-500/30 text-amber-400 rounded-2xl text-center shadow-2xl shadow-amber-500/10"
            >
              <div className="relative inline-flex items-center justify-center mb-2">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="3" fill="none" className="text-white/10" />
                  <circle 
                    cx="28" 
                    cy="28" 
                    r="24" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    fill="none" 
                    className="text-amber-400"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - timerSeconds / 3)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-2xl font-bold">{timerSeconds}</span>
              </div>
              <p className="text-xs text-amber-400/70 mb-4">SOS alert sending shortly…</p>
              <button
                onClick={handleCancelAlert}
                className="text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2 rounded-xl transition-all hover:scale-105"
              >
                Cancel Alert
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-white/30 text-center max-w-[220px]">
          Press and hold 3 seconds to send emergency SOS
        </p>
          </motion.div>{/* end center column */}

          {/* ══ RIGHT COLUMN ══ */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 lg:order-3"
          >
            <div className="bg-gray-900/60 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/20 p-5 hover-lift">
          {/* Card header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <span className="material-icons text-orange-400 text-base">sensors</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">Fear Detection</p>
                <p className="text-[11px] text-white/40 mt-0.5">Real-time audio analysis</p>
              </div>
            </div>
            {isSOSTriggered ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                SOS Active
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                isListening
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isListening ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'
                }`} />
                {isListening ? 'Listening' : 'Idle'}
              </span>
            )}
          </div>

          {/* Fear level bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-white/50">Threat Level</span>
              <span className={`text-xs font-semibold ${
                fearLevel > 70 ? 'text-red-400' : fearLevel > 40 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {fearLevel}% — {getFearLevelText(fearLevel)}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-colors duration-300 ${
                  fearLevel > 70 ? 'bg-red-500' : fearLevel > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                animate={{ width: `${Math.min(fearLevel, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Mic Status + Audio waveform */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                {/* mic icon */}
                <svg className={`w-3.5 h-3.5 ${isListening ? 'text-emerald-400' : 'text-white/30'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V20H9v2h6v-2h-2v-2.07A7 7 0 0 0 19 11h-2z"/>
                </svg>
                <span className="text-xs text-white/50">Microphone</span>
                {isListening ? (
                  <span className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Live</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-white/25 uppercase tracking-wide">Off</span>
                )}
              </div>
              <span className="text-xs text-white/40 font-mono">{isListening ? `${Math.round(currentVolume)}% vol` : '—'}</span>
            </div>
            <div className={`flex items-end justify-between h-12 px-1.5 py-1 rounded-lg border overflow-hidden transition-colors duration-300 ${
              isListening
                ? currentVolume > 5
                  ? 'bg-emerald-950/30 border-emerald-500/20'
                  : 'bg-white/[0.02] border-white/[0.06]'
                : 'bg-white/[0.01] border-white/[0.03]'
            }`}>
              {audioLevels.map((level, index) => (
                <div
                  key={index}
                  className={`rounded-sm transition-all duration-75 ${
                    !isListening ? 'bg-white/10' :
                    level > 70 ? 'bg-red-400/90' :
                    level > 40 ? 'bg-amber-400/90' :
                    level > 8  ? 'bg-emerald-400/90' : 'bg-white/15'
                  }`}
                  style={{
                    height: isListening ? `${Math.max(4, (level / 100) * 44)}px` : '4px',
                    width: '4%',
                    transition: 'height 80ms ease, background-color 200ms ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Live mic diagnostics — visible when listening */}
          {isListening && (
            <div className="mb-3 px-2 py-1.5 rounded-lg bg-black/30 border border-white/[0.06] font-mono text-[10px] text-white/50 flex flex-wrap gap-x-3 gap-y-0.5">
              <span>ctx:<span className={debugInfo.ctxState === 'running' ? 'text-emerald-400' : 'text-red-400'}> {debugInfo.ctxState ?? '…'}</span></span>
              <span>track:<span className={debugInfo.trackEnabled ? 'text-emerald-400' : 'text-red-400'}> {debugInfo.trackState ?? '…'}</span></span>
              <span>muted:<span className={debugInfo.trackMuted ? 'text-red-400' : 'text-emerald-400'}> {String(debugInfo.trackMuted ?? '…')}</span></span>
              <span>rms: <span className="text-white/80">{debugInfo.rawRms ?? '…'}</span></span>
              <span>s[0]: <span className="text-white/80">{debugInfo.sample0 ?? '…'}</span></span>
              <span>vol: <span className="text-white/80">{debugInfo.vol ?? '…'}</span></span>
              {debugInfo.trackMuted && (
                <span className="w-full text-red-400 font-semibold">⚠ Mic muted by browser/OS — check system mic settings</span>
              )}
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Emotion', value: lastEmotion || '—', highlight: lastEmotion === 'fear' },
              { label: 'Keyword', value: lastDetectedKeyword || '—', highlight: !!lastDetectedKeyword },
              { label: 'Streak', value: `${consecutiveFearCount}/${SOS_FEAR_THRESHOLD}`, highlight: consecutiveFearCount >= SOS_FEAR_THRESHOLD },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                <p className="text-[10px] text-white/40 mb-0.5">{label}</p>
                <p className={`text-xs font-semibold truncate capitalize ${
                  highlight ? 'text-red-400' : 'text-white/80'
                }`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Active keywords */}
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-white/50 font-medium uppercase tracking-wide">Trigger Keywords</span>
              <span className="text-[11px] text-white/30">{keywords.length} active</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
              {keywords.length === 0 ? (
                <p className="text-xs text-white/25 italic">No keywords configured</p>
              ) : keywords.map((keyword, index) => (
                <span
                  key={index}
                  className={`px-2 py-0.5 text-[11px] rounded font-medium transition-all duration-200 ${
                    lastDetectedKeyword === keyword
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-white/[0.04] text-white/40 border border-white/[0.06]'
                  }`}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex gap-2 mt-5">
            {!isListening ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startListening}
                disabled={speechToTextEnabled}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-lg shadow-orange-500/20 py-3 rounded-xl transition-all disabled:opacity-40"
              >
                <span className="material-icons text-sm">mic</span>
                Start Monitoring
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={stopListening}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/20 py-3 rounded-xl transition-all"
              >
                <span className="material-icons text-sm">stop</span>
                Stop Monitoring
              </motion.button>
            )}
            {(isSOSTriggered || isListening) && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetSOS}
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-4 py-3 rounded-xl transition-all"
              >
                <span className="material-icons text-sm">refresh</span>
                Reset
              </motion.button>
            )}
          </div>

          <button
            onClick={testAPI}
            className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/70 border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] py-2.5 rounded-xl transition-all"
          >
            <span className="material-icons text-sm">science</span>
            Test API Connection
          </button>

          <p className="mt-4 text-[10px] text-white/25 text-center leading-relaxed">
            Analyzes 5-second chunks · SOS after {SOS_FEAR_THRESHOLD} consecutive fear detections
          </p>
            </div>{/* end fear detection card */}
          </motion.div>{/* end right column */}
        </div>{/* end grid */}

        {/* ── Safety Tips ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
            <span className="material-icons text-base text-orange-500">tips_and_updates</span>
            Safety Tips
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: 'share_location', color: 'from-blue-600/20 to-blue-800/20 border-blue-500/20', hover: 'hover:border-blue-500/40', title: 'Share Your Route', tip: 'Always let someone know your planned route before travelling alone at night.' },
              { icon: 'contacts', color: 'from-green-600/20 to-green-800/20 border-green-500/20', hover: 'hover:border-green-500/40', title: 'Keep Contacts Updated', tip: 'Make sure your emergency contacts have the correct phone numbers in Settings.' },
              { icon: 'battery_charging_full', color: 'from-yellow-600/20 to-yellow-800/20 border-yellow-500/20', hover: 'hover:border-yellow-500/40', title: 'Keep Phone Charged', tip: 'Maintain at least 20% battery when going out. A dead phone can\u2019t call for help.' },
              { icon: 'record_voice_over', color: 'from-red-600/20 to-red-800/20 border-red-500/20', hover: 'hover:border-red-500/40', title: 'Use Voice Keywords', tip: 'Enable keyword monitoring and say a trigger word to silently send an SOS alert.' },
            ].map(({ icon, color, hover, title, tip }) => (
              <motion.div 
                key={title}
                whileHover={{ y: -4, scale: 1.01 }}
                className={`rounded-2xl border bg-gradient-to-br ${color} ${hover} p-5 flex flex-col gap-3 transition-all duration-300 cursor-default`}
              >
                <span className="material-icons text-2xl text-white/70">{icon}</span>
                <p className="text-sm font-semibold text-white/90">{title}</p>
                <p className="text-xs text-white/50 leading-relaxed">{tip}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Quick Stats ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          {[
            { icon: 'contacts', label: 'Emergency Contacts', value: contacts.length, suffix: 'saved', color: 'text-green-400', bg: 'from-green-500/10 to-green-600/5 border-green-500/20' },
            { icon: 'record_voice_over', label: 'Trigger Keywords', value: keywords.length, suffix: 'active', color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-600/5 border-blue-500/20' },
            { icon: 'security', label: 'Monitoring', value: isListening ? 'ON' : 'OFF', suffix: '', color: isListening ? 'text-orange-400' : 'text-white/40', bg: isListening ? 'from-orange-500/10 to-orange-600/5 border-orange-500/20' : 'from-white/5 to-white/[0.02] border-white/10' },
          ].map(({ icon, label, value, suffix, color, bg }) => (
            <motion.div 
              key={label}
              whileHover={{ y: -3 }}
              className={`rounded-2xl border bg-gradient-to-br ${bg} p-5 text-center transition-all duration-300`}
            >
              <span className={`material-icons text-2xl mb-2 ${color}`}>{icon}</span>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-white/40 leading-tight mt-1">{label}</p>
              {suffix && <p className="text-[11px] text-white/25 mt-0.5">{suffix}</p>}
            </motion.div>
          ))}
        </motion.div>

        {/* ── Emergency Contacts strip ─────────────────────────────────── */}
        {contacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <span className="material-icons text-base text-green-500">people</span>
                Emergency Contacts
              </h2>
              <Link href="/settings" className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 font-medium">
                Manage <span className="material-icons text-sm">chevron_right</span>
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {contacts.slice(0, 5).map((c, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  className="flex-shrink-0 flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 min-w-[180px] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg shadow-green-500/20">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white/90 truncate">{c.name}</p>
                    <p className="text-[11px] text-white/40 truncate">{c.relationship || c.phone}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Footer strip ─────────────────────────────────────────────── */}
        <div className="mt-12 mb-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-white/30">
          <Link href="/support" className="hover:text-white/60 transition-colors flex items-center gap-1.5">
            <span className="material-icons text-sm">support_agent</span>Help & Support
          </Link>
          <span className="hidden sm:inline text-white/10">·</span>
          <Link href="/privacy-policy" className="hover:text-white/60 transition-colors flex items-center gap-1.5">
            <span className="material-icons text-sm">verified_user</span>Privacy Policy
          </Link>
          <span className="hidden sm:inline text-white/10">·</span>
          <Link href="/blogs" className="hover:text-white/60 transition-colors flex items-center gap-1.5">
            <span className="material-icons text-sm">article</span>Safety Blogs
          </Link>
          <span className="hidden sm:inline text-white/10">·</span>
          <span className="text-white/20">SOS Emergency © 2025</span>
        </div>

      </div>{/* end page body */}

      <AnimatePresence>
        {toast && toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium text-white z-50 border backdrop-blur-md
              ${toast.type === "success" ? "bg-emerald-600/90 border-emerald-500/30 shadow-emerald-500/20" : ""}
              ${toast.type === "error" ? "bg-red-600/90 border-red-500/30 shadow-red-500/20" : ""}
              ${toast.type === "info" ? "bg-blue-600/90 border-blue-500/30 shadow-blue-500/20" : ""}
              ${toast.type === "warning" ? "bg-orange-600/90 border-orange-500/30 shadow-orange-500/20" : ""}
            `}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}