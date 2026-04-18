import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Settings, User, Siren, Activity, Heart, Flame, Car, AlertTriangle } from 'lucide-react';

export default function SimpleSOS() {
  const [isPressing, setIsPressing] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const handleMouseDown = () => {
    setIsPressing(true);
    setMessage("");
    setMessageType("info");
    const timer = setTimeout(() => {
      sendSosCall();
      setIsPressing(false);
    }, 3000);
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    setIsPressing(false);
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    if (!message) {
      setMessage("Press and hold for 3 seconds to send SOS.");
      setMessageType("info");
    }
  };

  const sendSosCall = async () => {
    setMessage("Sending SOS...");
    setMessageType("info");
    try {
      let currentLocation = "Unknown location";
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          currentLocation = `Lat: ${position.coords.latitude}, Lon: ${position.coords.longitude}`;
        } catch {
          setMessage("Could not get location. Sending SOS from Unknown location.");
        }
      }
      const response = await fetch("/api/app-twillo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: currentLocation }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`SOS sent successfully! SID: ${data.sid}`);
        setMessageType("success");
      } else {
        setMessage(`Failed to send SOS: ${data.error || "Unknown error"}`);
        setMessageType("error");
      }
    } catch {
      setMessage("Network error: Could not reach SOS service.");
      setMessageType("error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-base text-text-primary">
      <header className="p-4 flex flex-col items-center">
        <span className="text-xs text-text-muted">Current location</span>
        <span className="font-semibold text-text-primary">San Francisco, California</span>
      </header>

      <main className="flex flex-col items-center flex-1 justify-center px-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={`w-56 h-56 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-8 transition-all duration-300
            bg-gradient-to-br from-accent-coral to-[#b83d2f]
            ${isPressing ? 'shadow-[0_0_80px_-10px_rgba(232,108,92,0.6)] scale-95' : 'shadow-glow-coral'}
          `}
        >
          SOS
        </motion.button>
        <span className="text-text-tertiary mb-6 text-sm">Press for 3s for SOS</span>

        {message && (
          <p className={`mt-4 text-center px-5 py-2.5 rounded-xl text-sm font-medium border ${
            messageType === "success" ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20" :
            messageType === "error" ? "bg-accent-coral/10 text-accent-coral border-accent-coral/20" :
            "bg-accent-blue/10 text-accent-blue border-accent-blue/20"
          }`}>
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-3 justify-center mt-8 max-w-sm">
          {[
            { label: "Medical", icon: Heart },
            { label: "Fire", icon: Flame },
            { label: "Accident", icon: Car },
            { label: "Rescue", icon: Siren },
            { label: "Violence", icon: AlertTriangle },
          ].map(({ label, icon: Icon }) => (
            <button key={label}
              className="px-4 py-2 rounded-full bg-bg-elevated border border-border-default text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-all flex items-center gap-1.5"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </main>

      <footer className="bg-bg-elevated border-t border-border-default py-3 px-6 flex justify-between fixed bottom-0 left-0 right-0">
        <Link href="/sos" className="flex flex-col items-center text-accent-gold">
          <Home className="w-5 h-5" />
          <span className="text-xs mt-0.5">Home</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center text-text-tertiary hover:text-text-secondary transition-colors">
          <Settings className="w-5 h-5" />
          <span className="text-xs mt-0.5">Settings</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center text-text-tertiary hover:text-text-secondary transition-colors">
          <User className="w-5 h-5" />
          <span className="text-xs mt-0.5">Profile</span>
        </Link>
      </footer>
    </div>
  );
}
