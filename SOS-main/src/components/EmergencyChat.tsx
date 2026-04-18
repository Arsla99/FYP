import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Phone } from 'lucide-react';

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
  { label: '🩺 Medical Emergency', key: 'medical' },
  { label: '🔥 Fire Emergency',    key: 'fire'    },
  { label: '🚗 Road Accident',     key: 'accident' },
  { label: '🦺 Crime / Attack',    key: 'crime'   },
  { label: '🌊 Natural Disaster',  key: 'disaster' },
  { label: '📞 Emergency Numbers', key: 'numbers' },
];

const BOT_FLOWS: Record<string, { reply: string; options?: string[] }> = {
  start: {
    reply: "Hello! I'm your Emergency Response Assistant — powered by AI.\n\nI can guide you through any crisis, explain how to use the SOS app, or answer first-aid questions. Choose a topic below or type your question.",
    options: QUICK_TOPICS.map(t => t.label),
  },
  '🩺 Medical Emergency': {
    reply: 'I can help. Which best describes the situation?',
    options: ['💓 Cardiac Arrest / No pulse', '🩸 Severe Bleeding', '🫁 Not Breathing', '🤕 Unconscious Person', '🐍 Poisoning / Overdose', '🦴 Broken Bone'],
  },
  '💓 Cardiac Arrest / No pulse': {
    reply: `**CALL 115 NOW**\n\n1. Lay person flat on a firm surface.\n2. Place hands center of chest — give hard, fast compressions (100-120/min, 5-6 cm deep).\n3. After 30 compressions give 2 rescue breaths.\n4. Continue until ambulance arrives.\n\n⚠️ Do NOT stop unless told by emergency responder.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🩸 Severe Bleeding': {
    reply: `1. Apply firm direct pressure with a clean cloth.\n2. Do NOT remove cloth — add more on top if soaked.\n3. Raise the injured limb above heart level.\n4. Apply tourniquet only if bleeding is life-threatening.\n5. Call **115** immediately.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🫁 Not Breathing': {
    reply: `1. Check surroundings are safe.\n2. Tap shoulders — shout "Are you OK?".\n3. If no response: **call 115 immediately**.\n4. Tilt head back, lift chin to open airway.\n5. Give 2 rescue breaths then start CPR — 30 compressions : 2 breaths.\n6. Use AED if available.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🤕 Unconscious Person': {
    reply: `1. Check breathing — look, listen, feel.\n2. If breathing: place in **recovery position** (on side) to prevent choking.\n3. If not breathing: start CPR immediately.\n4. Call **115** — stay with them.\n5. Do NOT give food or water.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🐍 Poisoning / Overdose': {
    reply: `1. **Call 115 immediately** — tell them WHAT was taken.\n2. Do NOT induce vomiting unless instructed.\n3. If unconscious and breathing — recovery position.\n4. If not breathing — start CPR.\n5. Keep containers/packaging to show medical staff.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🦴 Broken Bone': {
    reply: `1. Do NOT try to realign the bone.\n2. Immobilize with a splint and bandage.\n3. Apply ice (wrapped in cloth) — 20 min on, 20 min off.\n4. Elevate if possible.\n5. **Call 115** for spine/neck/pelvis fractures — do not move patient.`,
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
    reply: `**EVACUATE — call 16 (Fire Dept)**\n\n1. Alert everyone — shout "FIRE!"\n2. Crawl low under smoke.\n3. Close doors behind you to slow fire spread.\n4. Touch doors before opening — if hot, find another exit.\n5. Use stairs NEVER the elevator.\n6. Once out — **NEVER go back in**.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '🍳 Kitchen Fire': {
    reply: `1. **Small pan fire**: Slide lid over pan, turn off heat — **never use water on oil fire**.\n2. **Oven fire**: Turn off oven, keep door closed.\n3. If fire spreads beyond appliance — evacuate and call **16**.\n4. Use dry-powder extinguisher if trained.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '🔌 Electrical Fire': {
    reply: `1. **Do NOT use water** — electrocution risk.\n2. Cut power at the mains breaker if safe.\n3. Use CO₂ or dry-powder extinguisher only.\n4. If smoke fills room — evacuate and call **16**.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '👕 Clothes on Fire': {
    reply: `**STOP — DROP — ROLL**\n\n1. STOP — do not run (spreads flames).\n2. DROP — fall to ground, cover your face.\n3. ROLL — back and forth to smother flames.\n4. Run cold water over burns for 10+ minutes.\n5. Call **115** for severe burns.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '🚗 Vehicle Fire': {
    reply: `1. Pull over and turn off engine immediately.\n2. All occupants exit fast — leave belongings.\n3. Move 100m+ away from vehicle.\n4. Call **16 / 115**.\n5. **Do NOT open bonnet** if smoke from engine.`,
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
    reply: `1. **Call 115 / 1122 immediately**.\n2. Do NOT move injured person unless in immediate danger.\n3. Check breathing — if not breathing, start CPR.\n4. Control bleeding with direct pressure.\n5. Keep patient warm and calm.`,
    options: ['↩ Back to Accident', '📞 Show emergency numbers'],
  },
  '🔥 Vehicle is smoking/fire': {
    reply: `1. Move all people 100m+ away immediately.\n2. Call **16** (fire) and **115** (medical).\n3. Do NOT attempt to control a car fire yourself.\n4. Warn other drivers with hazard lights.`,
    options: ['↩ Back to Accident', '📞 Show emergency numbers'],
  },
  '🚦 Securing the scene': {
    reply: `1. Turn on hazard lights of all vehicles.\n2. Place warning triangles 50m behind accident.\n3. Keep bystanders back.\n4. No smoking near scene.\n5. Call **1122** Rescue.`,
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
    reply: `**RUN — HIDE — FIGHT (in that order)**\n\n1. **RUN**: Escape if safe — leave belongings.\n2. **HIDE**: Get out of sight, silence your phone.\n3. **FIGHT**: Only as absolute last resort.\n4. Call **15** (Police) as soon as safe.\n5. Do NOT resist if they want only valuables.`,
    options: ['↩ Back to Crime', '📞 Show emergency numbers'],
  },
  '👊 Physical Assault': {
    reply: `1. Get to a safe location first.\n2. Call **15** (Police) immediately.\n3. Do NOT wash or change clothes — preserve evidence.\n4. Photograph injuries and document everything.\n5. File a formal FIR at the nearest police station.`,
    options: ['↩ Back to Crime', '📞 Show emergency numbers'],
  },
  '📵 Stalking / Being Followed': {
    reply: `1. Go to a crowded public place or police station.\n2. Do NOT go home if you think you're being followed.\n3. Call someone you trust — stay on the phone.\n4. Note the person's description and vehicle.\n5. Call **15** — report it formally.`,
    options: ['↩ Back to Crime', '📞 Show emergency numbers'],
  },
  '🏠 Home Intruder': {
    reply: `1. Get all household members into one locked room.\n2. Call **15** quietly — stay on the line.\n3. Do NOT confront the intruder.\n4. Exit through a window if possible.\n5. Make noise only if escape/help is impossible.`,
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
    reply: `**DROP — COVER — HOLD ON**\n\n**During shaking:**\n1. DROP to hands and knees.\n2. COVER head/neck under a sturdy table or against an interior wall.\n3. HOLD ON until shaking stops — NEVER run outside.\n\n**After shaking:**\n1. Check for injuries.\n2. Watch for gas leaks — smell gas? Evacuate.\n3. Call **1122** if trapped.`,
    options: ['↩ Back to Disaster', '📞 Show emergency numbers'],
  },
  '🌊 Flood': {
    reply: `1. Move to higher ground **immediately** — do NOT wait.\n2. Do NOT walk in moving water — 6 inches can knock you down.\n3. Do NOT drive through flooded roads.\n4. Turn off electricity at breaker if water enters home.\n5. Call **1122 / NDMA 1700**.`,
    options: ['↩ Back to Disaster', '📞 Show emergency numbers'],
  },
  '🌀 Storm / High Winds': {
    reply: `1. Stay indoors — away from windows and glass.\n2. Go to the lowest interior room.\n3. Unplug electronics.\n4. Fill bathtubs with water in case supply is cut.\n5. Monitor NDMA / PMD alerts.`,
    options: ['↩ Back to Disaster', '📞 Show emergency numbers'],
  },
  '🔥 Wildfire nearby': {
    reply: `1. Evacuate when ordered — **don't wait to see the fire**.\n2. Close all windows, doors, vents — leave them unlocked.\n3. Take go-bag: documents, medication, water, charger.\n4. Drive away with headlights ON.\n5. Call **16 / 1122**.`,
    options: ['↩ Back to Disaster', '📞 Show emergency numbers'],
  },
  '↩ Back to Disaster': {
    reply: 'Which natural disaster?',
    options: ['🏔️ Earthquake', '🌊 Flood', '🌀 Storm / High Winds', '🔥 Wildfire nearby'],
  },
  '📞 Emergency Numbers': {
    reply: `**Pakistan Emergency Numbers:**\n\n🚑 **115** — Ambulance / Medical\n🚒 **16** — Fire Brigade\n🚔 **15** — Police\n🦺 **1122** — Rescue Punjab\n🌊 **1700** — NDMA Disaster\n🏥 **021-111-11-EDHI** — Edhi Foundation`,
    options: ['↩ Back to start'],
  },
  '📞 Show emergency numbers': {
    reply: `**Pakistan Emergency Numbers:**\n\n🚑 **115** — Ambulance / Medical\n🚒 **16** — Fire Brigade\n🚔 **15** — Police\n🦺 **1122** — Rescue Punjab\n🌊 **1700** — NDMA Disaster\n🏥 **021-111-11-EDHI** — Edhi Foundation`,
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
            ? <strong key={j} className="text-white font-semibold">{part}</strong>
            : part
        )}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-gold/30 to-accent-coral/30 border border-white/10 flex items-center justify-center flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-accent-gold" />
      </div>
      <div className="bg-bg-elevated border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/40"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
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
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function addMessages(userMsg: Message, botMsg: Message, nextId: number) {
    setMessages(prev => [...prev, userMsg, botMsg]);
    setIdCounter(nextId + 2);
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
    addMessages(userMsg, botMsg, nextId);
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

    // Build history from current messages for context
    const history = messages.map(m => ({ role: m.from === 'user' ? 'user' : 'model', text: m.text }));

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: nextId + 1, from: 'bot',
        text: data.reply ?? "Sorry, I couldn't respond. For emergencies call 115.",
        isAI: true, time: getTime(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: nextId + 1, from: 'bot',
        text: "Connection error. For emergencies:\n🚑 **115** · 🚔 **15** · 🚒 **16** · 🦺 **1122**",
        time: getTime(),
      }]);
    } finally {
      setLoading(false);
      setIdCounter(nextId + 2);
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
      {/* ── Floating trigger button ─────────────────────────────────────────── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 pl-3 pr-4 py-3 rounded-full bg-gradient-to-r from-accent-gold to-accent-coral shadow-lg shadow-glow-gold border border-white/10"
            title="Emergency AI Assistant"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-accent-gold animate-pulse" />
            </div>
            <span className="text-sm font-semibold text-white">Emergency AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat window ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="window"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-16px)] flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/70"
            style={{ height: 'min(620px, calc(100vh - 80px))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-accent-gold/80 to-accent-coral/80 flex items-center justify-center shadow-md">
                  <Bot className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-gray-900 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white leading-none">Emergency Assistant</p>
                    <span className="flex items-center gap-0.5 bg-accent-gold/15 border border-accent-gold/30 text-accent-gold text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                      <Sparkles className="w-2.5 h-2.5" style={{ width: 9, height: 9 }} /> AI
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-0.5">Gemini · Always available</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white/60" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-[#0c0c0f] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'items-start gap-2.5'}`}>

                  {/* Bot avatar */}
                  {msg.from === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-gold/30 to-accent-coral/30 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-accent-gold" />
                    </div>
                  )}

                  <div className={`flex flex-col gap-1.5 ${msg.from === 'user' ? 'items-end max-w-[82%]' : 'items-start max-w-[88%]'}`}>
                    {/* Bubble */}
                    <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                      msg.from === 'user'
                        ? 'bg-gradient-to-br from-accent-gold/25 to-accent-coral/20 text-white border border-accent-gold/20 rounded-br-sm'
                        : 'bg-[#1a1a22] text-white/85 border border-white/[0.06] rounded-tl-sm'
                    }`}>
                      {/* AI badge */}
                      {msg.from === 'bot' && msg.isAI && (
                        <span className="inline-flex items-center gap-1 bg-purple-500/15 border border-purple-400/20 text-purple-300 text-[9px] font-semibold px-1.5 py-0.5 rounded-full mb-1.5 mr-1">
                          <Sparkles style={{ width: 8, height: 8 }} /> AI
                        </span>
                      )}
                      {formatText(msg.text)}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-white/20 px-1">{msg.time}</span>

                    {/* Quick-option chips */}
                    {msg.from === 'bot' && msg.options && msg.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {msg.options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleOption(opt)}
                            disabled={loading}
                            className="text-[11px] font-medium text-white/65 hover:text-white bg-[#1a1a22] hover:bg-[#22222e] disabled:opacity-40 border border-white/[0.08] hover:border-white/[0.15] px-3 py-1.5 rounded-xl transition-all duration-150"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && <TypingIndicator />}

              <div ref={bottomRef} />
            </div>

            {/* Emergency numbers strip */}
            <div className="flex items-center justify-center gap-3 px-3 py-1.5 bg-[#0c0c0f] border-t border-white/[0.04]">
              <Phone className="w-3 h-3 text-white/20 flex-shrink-0" />
              {['🚑 115', '🚒 16', '🚔 15', '🦺 1122'].map(n => (
                <span key={n} className="text-[10px] text-white/25 font-medium">{n}</span>
              ))}
            </div>

            {/* Input bar */}
            <div className="flex items-end gap-2 px-3 pb-3 pt-2 bg-[#0c0c0f] border-t border-white/[0.06]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything or describe your emergency…"
                disabled={loading}
                rows={1}
                className="flex-1 resize-none bg-[#1a1a22] border border-white/[0.08] focus:border-accent-gold/30 text-white text-[13px] placeholder-white/25 rounded-xl px-3.5 py-2.5 outline-none transition-colors leading-relaxed disabled:opacity-50 max-h-24 overflow-y-auto scrollbar-none"
                style={{ scrollbarWidth: 'none' }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-gold to-accent-coral flex items-center justify-center flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity shadow-md"
              >
                <Send className="w-4 h-4 text-white" style={{ width: 15, height: 15 }} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
