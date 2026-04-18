import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Phone, AlertTriangle, RotateCcw } from 'lucide-react';

interface Message {
  id: number;
  from: 'user' | 'bot';
  text: string;
  options?: string[];
  isAI?: boolean;
  time: string;
}

// ─── Knowledge base ───────────────────────────────────────────────────────────
const QUICK_TOPICS = [
  { label: '🩺 Medical Emergency', icon: '🩺' },
  { label: '🔥 Fire Emergency',    icon: '🔥' },
  { label: '🚗 Road Accident',     icon: '🚗' },
  { label: '🦺 Crime / Attack',    icon: '🦺' },
  { label: '🌊 Natural Disaster',  icon: '🌊' },
  { label: '📞 Emergency Numbers', icon: '📞' },
];

const BOT_FLOWS: Record<string, { reply: string; options?: string[] }> = {
  start: {
    reply: "Hi! I'm your Emergency Response Assistant, powered by Gemini AI.\n\nSelect a topic below for instant guidance, or type your question and I'll answer with AI.",
    options: QUICK_TOPICS.map(t => t.label),
  },
  '🩺 Medical Emergency': {
    reply: 'Which best describes the situation?',
    options: ['💓 Cardiac Arrest / No pulse', '🩸 Severe Bleeding', '🫁 Not Breathing', '🤕 Unconscious Person', '🐍 Poisoning / Overdose', '🦴 Broken Bone'],
  },
  '💓 Cardiac Arrest / No pulse': {
    reply: `**CALL 115 NOW**\n\n1. Lay the person flat on a firm surface.\n2. Place both hands center of chest — push hard and fast (100-120/min, 5-6 cm deep).\n3. After 30 compressions give 2 rescue breaths.\n4. Continue until ambulance arrives.\n\n⚠️ Do NOT stop unless told by emergency services.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🩸 Severe Bleeding': {
    reply: `1. Apply firm direct pressure with a clean cloth.\n2. Do NOT remove cloth — add more on top if soaked.\n3. Raise the injured limb above heart level.\n4. Tourniquet only if bleeding is life-threatening.\n5. **Call 115 immediately.**`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🫁 Not Breathing': {
    reply: `1. Check surroundings are safe.\n2. Tap shoulders — shout "Are you OK?".\n3. No response: **call 115 immediately**.\n4. Tilt head back, lift chin to open airway.\n5. Give 2 rescue breaths then start CPR — 30 compressions : 2 breaths.\n6. Use AED if available.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🤕 Unconscious Person': {
    reply: `1. Check breathing — look, listen, feel.\n2. Breathing: place in **recovery position** (on their side).\n3. Not breathing: start CPR immediately.\n4. **Call 115** — stay with them.\n5. Do NOT give food or water.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🐍 Poisoning / Overdose': {
    reply: `1. **Call 115 immediately** — tell them WHAT was taken.\n2. Do NOT induce vomiting unless instructed.\n3. Unconscious and breathing: recovery position.\n4. Not breathing: start CPR.\n5. Keep containers to show medical staff.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🦴 Broken Bone': {
    reply: `1. Do NOT try to realign the bone.\n2. Immobilize with a splint + bandage.\n3. Apply ice wrapped in cloth — 20 min on/off.\n4. Elevate if possible.\n5. **Call 115** for spine/neck/pelvis — do not move patient.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '↩ Back to Medical': {
    reply: 'Which medical emergency?',
    options: ['💓 Cardiac Arrest / No pulse', '🩸 Severe Bleeding', '🫁 Not Breathing', '🤕 Unconscious Person', '🐍 Poisoning / Overdose', '🦴 Broken Bone'],
  },
  '🔥 Fire Emergency': {
    reply: 'What is the situation?',
    options: ['🏠 House / Building Fire', '🍳 Kitchen Fire', '🔌 Electrical Fire', '👕 Clothes on Fire', '🚗 Vehicle Fire'],
  },
  '🏠 House / Building Fire': {
    reply: `**EVACUATE — call 16 (Fire Dept)**\n\n1. Alert everyone — shout "FIRE!"\n2. Crawl low under smoke.\n3. Close doors behind you to slow fire spread.\n4. Touch door before opening — if hot, use another exit.\n5. Use stairs, NEVER the elevator.\n6. Once out — **NEVER go back in**.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '🍳 Kitchen Fire': {
    reply: `1. **Small pan fire**: Slide lid over pan, turn off heat — **never use water on oil fire**.\n2. **Oven fire**: Turn off oven, keep door closed.\n3. Spreads beyond appliance → evacuate and call **16**.\n4. Use dry-powder extinguisher if trained.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '🔌 Electrical Fire': {
    reply: `1. **Do NOT use water** — electrocution risk.\n2. Cut power at the mains breaker if safe.\n3. Use CO₂ or dry-powder extinguisher only.\n4. Smoke fills room → evacuate and call **16**.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '👕 Clothes on Fire': {
    reply: `**STOP — DROP — ROLL**\n\n1. STOP — do not run.\n2. DROP — fall to ground, cover your face.\n3. ROLL — back and forth to smother flames.\n4. Run cold water over burns for 10+ minutes.\n5. **Call 115** for severe burns.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '🚗 Vehicle Fire': {
    reply: `1. Pull over, turn off engine immediately.\n2. All occupants exit fast — leave belongings.\n3. Move 100m+ away from vehicle.\n4. **Call 16 / 115**.\n5. Do NOT open bonnet if smoke comes from engine.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '↩ Back to Fire': {
    reply: 'Which fire situation?',
    options: ['🏠 House / Building Fire', '🍳 Kitchen Fire', '🔌 Electrical Fire', '👕 Clothes on Fire', '🚗 Vehicle Fire'],
  },
  '🚗 Road Accident': {
    reply: 'What do you need help with?',
    options: ['🚑 Injured person at scene', '🔥 Vehicle is smoking/fire', '🚦 Securing the scene'],
  },
  '🚑 Injured person at scene': {
    reply: `1. **Call 115 / 1122 immediately**.\n2. Do NOT move injured person unless in immediate danger.\n3. Not breathing → start CPR.\n4. Control bleeding with direct pressure.\n5. Keep patient warm and calm.`,
    options: ['↩ Back to Accident', '📞 Show emergency numbers'],
  },
  '🔥 Vehicle is smoking/fire': {
    reply: `1. Move all people 100m+ away immediately.\n2. Call **16** (fire) and **115** (medical).\n3. Do NOT attempt to control a car fire yourself.\n4. Warn other drivers with hazard lights.`,
    options: ['↩ Back to Accident', '📞 Show emergency numbers'],
  },
  '🚦 Securing the scene': {
    reply: `1. Turn on hazard lights of all vehicles.\n2. Place warning triangles 50m behind accident.\n3. Keep bystanders back — no smoking.\n4. Call **1122** Rescue.`,
    options: ['↩ Back to Accident', '📞 Show emergency numbers'],
  },
  '↩ Back to Accident': {
    reply: 'What do you need for the road accident?',
    options: ['🚑 Injured person at scene', '🔥 Vehicle is smoking/fire', '🚦 Securing the scene'],
  },
  '🦺 Crime / Attack': {
    reply: 'Select the situation:',
    options: ['🔪 Active Threat / Robbery', '👊 Physical Assault', '📵 Stalking / Being Followed', '🏠 Home Intruder'],
  },
  '🔪 Active Threat / Robbery': {
    reply: `**RUN — HIDE — FIGHT (in that order)**\n\n1. **RUN**: Escape if safe — leave belongings.\n2. **HIDE**: Get out of sight, silence phone.\n3. **FIGHT**: Only as absolute last resort.\n4. **Call 15** (Police) as soon as safe.\n5. Do NOT resist if they only want valuables.`,
    options: ['↩ Back to Crime', '📞 Show emergency numbers'],
  },
  '👊 Physical Assault': {
    reply: `1. Get to a safe location first.\n2. **Call 15** (Police) immediately.\n3. Do NOT wash or change clothes — preserve evidence.\n4. Photograph injuries and document everything.\n5. File a formal FIR at the nearest police station.`,
    options: ['↩ Back to Crime', '📞 Show emergency numbers'],
  },
  '📵 Stalking / Being Followed': {
    reply: `1. Go to a crowded public place or police station.\n2. Do NOT go home if you think you're being followed.\n3. Call someone you trust — stay on the phone.\n4. Note person's description, clothing, vehicle.\n5. **Call 15** — report it formally.`,
    options: ['↩ Back to Crime', '📞 Show emergency numbers'],
  },
  '🏠 Home Intruder': {
    reply: `1. Get all household members into one locked room.\n2. **Call 15** quietly — stay on the line.\n3. Do NOT confront the intruder.\n4. Exit through a window if possible.\n5. Make noise only if escape/help is impossible.`,
    options: ['↩ Back to Crime', '📞 Show emergency numbers'],
  },
  '↩ Back to Crime': {
    reply: 'Which situation?',
    options: ['🔪 Active Threat / Robbery', '👊 Physical Assault', '📵 Stalking / Being Followed', '🏠 Home Intruder'],
  },
  '🌊 Natural Disaster': {
    reply: 'Which natural disaster?',
    options: ['🏔️ Earthquake', '🌊 Flood', '🌀 Storm / High Winds', '🔥 Wildfire nearby'],
  },
  '🏔️ Earthquake': {
    reply: `**DROP — COVER — HOLD ON**\n\nDuring shaking:\n1. DROP to hands and knees.\n2. COVER head/neck under a sturdy table or interior wall.\n3. HOLD ON — NEVER run outside during shaking.\n\nAfter shaking:\n1. Check for injuries — don't move seriously injured people.\n2. Smell gas? Evacuate immediately.\n3. **Call 1122** if trapped.`,
    options: ['↩ Back to Disaster', '📞 Show emergency numbers'],
  },
  '🌊 Flood': {
    reply: `1. Move to higher ground **immediately** — do NOT wait.\n2. Do NOT walk in moving water — 6 inches can knock you down.\n3. Do NOT drive through flooded roads.\n4. Turn off electricity at breaker if water enters home.\n5. **Call 1122 / NDMA 1700**.`,
    options: ['↩ Back to Disaster', '📞 Show emergency numbers'],
  },
  '🌀 Storm / High Winds': {
    reply: `1. Stay indoors — away from windows.\n2. Go to the lowest interior room.\n3. Unplug electronics.\n4. Fill bathtubs with water in case supply is cut.\n5. Monitor NDMA / PMD alerts.`,
    options: ['↩ Back to Disaster', '📞 Show emergency numbers'],
  },
  '🔥 Wildfire nearby': {
    reply: `1. **Evacuate when ordered** — don't wait to see the fire.\n2. Close all windows, doors, vents — leave them unlocked.\n3. Take go-bag: documents, medication, water, charger.\n4. Drive away with headlights ON.\n5. **Call 16 / 1122**.`,
    options: ['↩ Back to Disaster', '📞 Show emergency numbers'],
  },
  '↩ Back to Disaster': {
    reply: 'Which natural disaster?',
    options: ['🏔️ Earthquake', '🌊 Flood', '🌀 Storm / High Winds', '🔥 Wildfire nearby'],
  },
  '📞 Emergency Numbers': {
    reply: `**Pakistan Emergency Numbers**\n\n🚑 **115** — Ambulance / Medical\n🚒 **16** — Fire Brigade\n🚔 **15** — Police\n🦺 **1122** — Rescue Punjab\n🌊 **1700** — NDMA Disaster\n🏥 **021-111-11-EDHI** — Edhi Foundation`,
    options: ['↩ Back to start'],
  },
  '📞 Show emergency numbers': {
    reply: `**Pakistan Emergency Numbers**\n\n🚑 **115** — Ambulance / Medical\n🚒 **16** — Fire Brigade\n🚔 **15** — Police\n🦺 **1122** — Rescue Punjab\n🌊 **1700** — NDMA Disaster\n🏥 **021-111-11-EDHI** — Edhi Foundation`,
    options: ['↩ Back to start'],
  },
  '↩ Back to start': {
    reply: 'How else can I help you?',
    options: QUICK_TOPICS.map(t => t.label),
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatText(text: string) {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} className="font-semibold text-white">{part}</strong>
            : part
        )}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', border: '1px solid rgba(255,255,255,0.15)' }}>
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{ background: '#1e3a5f', border: '1px solid rgba(59,130,246,0.2)' }}>
        {[0, 1, 2].map(i => (
          <motion.span key={i} className="block w-1.5 h-1.5 rounded-full bg-blue-300"
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function EmergencyChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [idCounter, setIdCounter] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      const flow = BOT_FLOWS['start'];
      setMessages([{ id: 0, from: 'bot', text: flow.reply, options: flow.options, time: getTime() }]);
      setIdCounter(1);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function reset() {
    setMessages([]);
    setInput('');
    setLoading(false);
    setIdCounter(0);
    const flow = BOT_FLOWS['start'];
    setTimeout(() => {
      setMessages([{ id: 0, from: 'bot', text: flow.reply, options: flow.options, time: getTime() }]);
      setIdCounter(1);
    }, 50);
  }

  function handleOption(option: string) {
    if (loading) return;
    const nextId = idCounter;
    const userMsg: Message = { id: nextId, from: 'user', text: option, time: getTime() };
    const flow = BOT_FLOWS[option];
    const botMsg: Message = flow
      ? { id: nextId + 1, from: 'bot', text: flow.reply, options: flow.options, time: getTime() }
      : {
          id: nextId + 1, from: 'bot',
          text: "I don't have specific guidance for that. Please call emergency services:\n🚑 **115** · 🚒 **16** · 🚔 **15** · 🦺 **1122**",
          options: ['↩ Back to start'], time: getTime(),
        };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setIdCounter(nextId + 2);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const nextId = idCounter;
    const userMsg: Message = { id: nextId, from: 'user', text, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setIdCounter(nextId + 2);
    setLoading(true);

    const history = messages.map(m => ({ role: m.from === 'user' ? 'user' : 'model', text: m.text }));

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: nextId + 1, from: 'bot', isAI: true,
        text: data.reply ?? "Sorry, I couldn't respond. For emergencies call 115.",
        time: getTime(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: nextId + 1, from: 'bot',
        text: "Connection error. For emergencies:\n🚑 **115** · 🚔 **15** · 🚒 **16** · 🦺 **1122**",
        time: getTime(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* ── Floating trigger ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 20px rgba(37,99,235,0.45), 0 0 0 1px rgba(255,255,255,0.1)' }}
            title="Emergency AI Assistant"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-blue-700 animate-pulse" />
            </div>
            <span className="text-sm font-semibold text-white tracking-wide">Emergency AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat window ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
            style={{
              width: 'min(420px, calc(100vw - 16px))',
              height: 'min(620px, calc(100vh - 80px))',
              background: '#0f1e35',
              border: '1px solid rgba(59,130,246,0.2)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.08)',
            }}
          >
            {/* Header — blue gradient */}
            <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <Bot style={{ width: 18, height: 18, color: 'white' }} />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-blue-700 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Emergency Assistant</span>
                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-blue-100"
                      style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}>
                      <Sparkles style={{ width: 8, height: 8 }} />AI
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5 text-blue-100/70">Gemini · Always available</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={reset} title="Restart"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
                  <RotateCcw style={{ width: 13, height: 13 }} />
                </button>
                <button onClick={() => setOpen(false)} title="Close"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            {/* Message area */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4"
              style={{ background: '#0f1e35', scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.15) transparent' }}>

              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.from === 'user' ? 'justify-end' : 'items-start gap-2'}`}
                >
                  {/* Bot avatar */}
                  {msg.from === 'bot' && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <Bot style={{ width: 13, height: 13, color: 'white' }} />
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 ${msg.from === 'user' ? 'items-end max-w-[80%]' : 'items-start max-w-[86%]'}`}>
                    {/* Bubble */}
                    <div className="px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                      style={msg.from === 'user' ? {
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: 'white',
                        borderBottomRightRadius: 4,
                        boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                      } : {
                        background: '#162d4a',
                        border: '1px solid rgba(59,130,246,0.18)',
                        color: '#cbd5e1',
                        borderTopLeftRadius: 4,
                      }}
                    >
                      {msg.from === 'bot' && msg.isAI && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1.5 mr-1 text-blue-200"
                          style={{ background: 'rgba(37,99,235,0.3)', border: '1px solid rgba(59,130,246,0.4)' }}>
                          <Sparkles style={{ width: 8, height: 8 }} />AI
                        </span>
                      )}
                      {formatText(msg.text)}
                    </div>

                    <span className="text-[10px] px-1 text-blue-300/30">{msg.time}</span>

                    {/* Option chips */}
                    {msg.from === 'bot' && msg.options && msg.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {msg.options.map(opt => (
                          <button key={opt} onClick={() => handleOption(opt)} disabled={loading}
                            className="text-[11px] font-medium px-3 py-1.5 rounded-xl transition-all duration-150 disabled:opacity-40 text-blue-200 hover:text-white"
                            style={{ background: '#162d4a', border: '1px solid rgba(59,130,246,0.2)' }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#1d4ed8';
                              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#162d4a';
                              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
                            }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && <TypingDots />}
              <div ref={bottomRef} />
            </div>

            {/* Emergency numbers strip */}
            <div className="flex items-center justify-center gap-3 px-3 py-1.5 flex-shrink-0"
              style={{ background: '#0a1628', borderTop: '1px solid rgba(59,130,246,0.12)' }}>
              <AlertTriangle style={{ width: 10, height: 10, color: '#ef4444' }} />
              {[{ n: '115', label: 'Medical' }, { n: '16', label: 'Fire' }, { n: '15', label: 'Police' }, { n: '1122', label: 'Rescue' }].map(e => (
                <span key={e.n} className="text-[10px] font-medium text-blue-300/40">
                  <span className="text-red-400">{e.n}</span> {e.label}
                </span>
              ))}
            </div>

            {/* Input bar */}
            <div className="flex items-end gap-2 px-3 pb-3 pt-2.5 flex-shrink-0"
              style={{ background: '#0a1628', borderTop: '1px solid rgba(59,130,246,0.15)' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question or describe the emergency…"
                disabled={loading}
                rows={1}
                className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-[13px] outline-none transition-all leading-relaxed disabled:opacity-50 text-white placeholder-blue-300/30"
                style={{
                  background: '#162d4a',
                  border: '1px solid rgba(59,130,246,0.2)',
                  maxHeight: 96,
                  scrollbarWidth: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.6)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(59,130,246,0.2)'; }}
              />
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: input.trim() && !loading ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#162d4a',
                  opacity: !input.trim() || loading ? 0.4 : 1,
                  cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                  boxShadow: input.trim() && !loading ? '0 2px 8px rgba(37,99,235,0.4)' : 'none',
                }}
              >
                <Send style={{ width: 15, height: 15, color: 'white' }} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
