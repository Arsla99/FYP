import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: number;
  from: 'user' | 'bot';
  text: string;
  options?: string[];
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
  // ── entry ──────────────────────────────────────────────────────────────────
  start: {
    reply: "Hello! I'm your Emergency Response Assistant. I can guide you through any crisis. What kind of emergency are you facing?",
    options: QUICK_TOPICS.map(t => t.label),
  },

  // ── medical ────────────────────────────────────────────────────────────────
  '🩺 Medical Emergency': {
    reply: 'I can help. Which best describes the situation?',
    options: ['💓 Cardiac Arrest / No pulse', '🩸 Severe Bleeding', '🫁 Not Breathing', '🤕 Unconscious Person', '🐍 Poisoning / Overdose', '🦴 Broken Bone'],
  },
  '💓 Cardiac Arrest / No pulse': {
    reply: `**CALL EMERGENCY (115 / 1122) NOW**\n\n1. Lay the person flat on a firm surface.\n2. Place hands center of chest — give hard, fast compressions (100-120/min, 5-6 cm deep).\n3. After every 30 compressions give 2 rescue breaths (tilt head, lift chin, seal mouth).\n4. Continue until ambulance arrives or person starts breathing.\n\n⚠️ Do NOT stop unless told by emergency responder.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🩸 Severe Bleeding': {
    reply: `1. Apply firm, direct pressure with a clean cloth or bandage.\n2. Do NOT remove the cloth — add more on top if soaked.\n3. Raise the injured limb above heart level if possible.\n4. Apply tourniquet only if bleeding is life-threatening and won't stop.\n5. Keep patient warm and calm — call 115 immediately.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🫁 Not Breathing': {
    reply: `1. Check surroundings are safe.\n2. Tap shoulders firmly — shout "Are you OK?".\n3. If no response: call 115 immediately.\n4. Tilt head back, lift chin to open airway.\n5. Give 2 rescue breaths (1 second each).\n6. Start CPR — 30 compressions : 2 breaths cycle.\n7. Use AED if available.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🤕 Unconscious Person': {
    reply: `1. Check breathing — look, listen, feel.\n2. If breathing: place in **recovery position** (on their side) to prevent choking.\n3. If not breathing: start CPR immediately.\n4. Call 115 — stay with them.\n5. Do NOT give food or water to an unconscious person.\n6. Monitor breathing continuously until help arrives.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🐍 Poisoning / Overdose': {
    reply: `1. Call Poison Control / 115 immediately — tell them WHAT was taken.\n2. Do NOT induce vomiting unless instructed.\n3. If unconscious and breathing — recovery position.\n4. If not breathing — CPR.\n5. Keep any containers/packaging to show medical staff.\n6. Stay calm and stay on the line with emergency services.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '🦴 Broken Bone': {
    reply: `1. Do NOT try to realign the bone.\n2. Immobilize the limb using a splint (rolled magazine, sticks) and bandage.\n3. Apply ice wrapped in cloth to reduce swelling — 20 min on, 20 min off.\n4. Elevate the limb if possible.\n5. Call 115 for suspected spine/neck/pelvis fractures — do not move the patient.\n6. For open fractures, cover wound with clean cloth.`,
    options: ['↩ Back to Medical', '📞 Show emergency numbers'],
  },
  '↩ Back to Medical': {
    reply: 'Which medical emergency?',
    options: ['💓 Cardiac Arrest / No pulse', '🩸 Severe Bleeding', '🫁 Not Breathing', '🤕 Unconscious Person', '🐍 Poisoning / Overdose', '🦴 Broken Bone'],
  },

  // ── fire ───────────────────────────────────────────────────────────────────
  '🔥 Fire Emergency': {
    reply: 'What is the situation?',
    options: ['🏠 House / Building Fire', '🍳 Kitchen Fire', '🔌 Electrical Fire', '👕 Clothes on Fire', '🚗 Vehicle Fire'],
  },
  '🏠 House / Building Fire': {
    reply: `**EVACUATE IMMEDIATELY — call 16 (Fire Dept)**\n\n1. Alert everyone — shout "FIRE!"\n2. Crawl low under smoke — fresh air is near the floor.\n3. Close doors behind you to slow fire spread.\n4. Touch doors before opening — if hot, find another exit.\n5. Use stairs NEVER the elevator.\n6. Meet at your designated assembly point.\n7. Once out — NEVER go back in.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '🍳 Kitchen Fire': {
    reply: `1. **Small pan fire**: Slide a lid over the pan and turn off heat — do NOT use water on oil fire.\n2. **Oven fire**: Turn off oven, keep door closed.\n3. If fire spreads beyond the appliance — evacuate and call 16.\n4. Use a dry-powder fire extinguisher if trained.\n5. Never throw water on a grease fire — it explodes.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '🔌 Electrical Fire': {
    reply: `1. Do NOT use water — risk of electrocution.\n2. Cut power at the mains breaker if safe to do so.\n3. Use CO₂ or dry-powder extinguisher only.\n4. If smoke fills the room — evacuate immediately and call 16.\n5. Never touch electrical equipment with wet hands.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '👕 Clothes on Fire': {
    reply: `**STOP — DROP — ROLL**\n\n1. STOP — do not run (spreads flames).\n2. DROP — fall to the ground and cover your face.\n3. ROLL — roll back and forth to smother flames.\n4. Once out, run cold water over burns for 10+ minutes.\n5. Do NOT remove burnt clothing — it may be stuck to skin.\n6. Call 115 for severe burns.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '🚗 Vehicle Fire': {
    reply: `1. Pull over immediately and turn off the engine.\n2. All occupants exit fast — leave belongings.\n3. Move at least 100m away from the vehicle.\n4. Call 16 / 115 immediately.\n5. Do NOT open the bonnet if smoke comes from the engine — oxygen feeds the fire.\n6. Never return to a burning vehicle.`,
    options: ['↩ Back to Fire', '📞 Show emergency numbers'],
  },
  '↩ Back to Fire': {
    reply: 'Which fire situation?',
    options: ['🏠 House / Building Fire', '🍳 Kitchen Fire', '🔌 Electrical Fire', '👕 Clothes on Fire', '🚗 Vehicle Fire'],
  },

  // ── accident ───────────────────────────────────────────────────────────────
  '🚗 Road Accident': {
    reply: 'What do you need help with?',
    options: ['🚑 Injured person at scene', '🔥 Vehicle is smoking/fire', '🚦 Securing the scene'],
  },
  '🚑 Injured person at scene': {
    reply: `1. Call 115 / 1122 immediately.\n2. Do NOT move the injured person unless there is immediate danger (fire/flood).\n3. Check breathing — if not breathing, start CPR.\n4. Control bleeding with direct pressure.\n5. Keep patient warm and calm — reassure them.\n6. Note patient details for emergency services.`,
    options: ['↩ Back to Accident', '📞 Show emergency numbers'],
  },
  '🔥 Vehicle is smoking/fire': {
    reply: `1. Move all people 100m+ away immediately.\n2. Call 16 (fire) and 115 (medical).\n3. Do NOT attempt to control a car fire yourself.\n4. Warn other drivers — use hazard lights / cones.`,
    options: ['↩ Back to Accident', '📞 Show emergency numbers'],
  },
  '🚦 Securing the scene': {
    reply: `1. Turn on hazard lights of all vehicles.\n2. Place warning triangles 50m behind the accident.\n3. Keep bystanders back.\n4. Do not allow smoking near the scene.\n5. Call 1122 Rescue for Pakistan emergencies.`,
    options: ['↩ Back to Accident', '📞 Show emergency numbers'],
  },
  '↩ Back to Accident': {
    reply: 'What do you need for the road accident?',
    options: ['🚑 Injured person at scene', '🔥 Vehicle is smoking/fire', '🚦 Securing the scene'],
  },

  // ── crime ──────────────────────────────────────────────────────────────────
  '🦺 Crime / Attack': {
    reply: 'Select the situation:',
    options: ['🔪 Active Threat / Robbery', '👊 Physical Assault', '📵 Stalking / Being Followed', '🏠 Home Intruder'],
  },
  '🔪 Active Threat / Robbery': {
    reply: `**RUN — HIDE — FIGHT (in that order)**\n\n1. **RUN**: Escape if you safely can — leave belongings behind.\n2. **HIDE**: If escape is impossible — get out of sight, silence your phone.\n3. **FIGHT**: Only as absolute last resort — use environment to your advantage.\n4. Call 15 (Police) as soon as safe.\n5. Do NOT resist if they want only valuables.`,
    options: ['↩ Back to Crime', '📞 Show emergency numbers'],
  },
  '👊 Physical Assault': {
    reply: `1. Get to a safe location first.\n2. Call 15 (Police) immediately.\n3. Do NOT wash or change clothes — preserve evidence.\n4. Photograph injuries and document everything.\n5. Seek medical attention even if injuries seem minor.\n6. File a formal FIR at the nearest police station.`,
    options: ['↩ Back to Crime', '📞 Show emergency numbers'],
  },
  '📵 Stalking / Being Followed': {
    reply: `1. Go to a crowded public place — shop, restaurant, police station.\n2. Do NOT go home if you think you are being followed.\n3. Call someone you trust and stay on the phone.\n4. Note the person's description, clothing, vehicle.\n5. Call 15 — report it formally even if "nothing happened yet".\n6. Trust your instincts — your safety matters.`,
    options: ['↩ Back to Crime', '📞 Show emergency numbers'],
  },
  '🏠 Home Intruder': {
    reply: `1. Get all household members into one locked room.\n2. Call 15 quietly — stay on the line.\n3. Do NOT confront the intruder.\n4. If possible, exit through a window or another exit.\n5. Make noise only if escape/help is impossible.\n6. Have an agreed family code word for danger.`,
    options: ['↩ Back to Crime', '📞 Show emergency numbers'],
  },
  '↩ Back to Crime': {
    reply: 'Which situation?',
    options: ['🔪 Active Threat / Robbery', '👊 Physical Assault', '📵 Stalking / Being Followed', '🏠 Home Intruder'],
  },

  // ── natural disaster ───────────────────────────────────────────────────────
  '🌊 Natural Disaster': {
    reply: 'Which natural disaster?',
    options: ['🏔️ Earthquake', '🌊 Flood', '🌀 Storm / High Winds', '🔥 Wildfire nearby'],
  },
  '🏔️ Earthquake': {
    reply: `**DROP — COVER — HOLD ON**\n\n**During shaking:**\n1. DROP to hands and knees.\n2. COVER head/neck under a sturdy table or against an interior wall.\n3. HOLD ON until shaking stops.\n4. NEVER run outside during shaking.\n\n**After shaking:**\n1. Check for injuries — do not move seriously injured people.\n2. Watch for broken gas lines — smell gas? Evacuate.\n3. Expect aftershocks.\n4. Call 1122 if trapped or injured.`,
    options: ['↩ Back to Disaster', '📞 Show emergency numbers'],
  },
  '🌊 Flood': {
    reply: `1. Move immediately to higher ground — do NOT wait.\n2. Do NOT walk in moving water — 6 inches can knock you down.\n3. Do NOT drive through flooded roads — turn around.\n4. Turn off electricity at breaker if water is entering home.\n5. Avoid contact with floodwater — it may be contaminated.\n6. Call 1122 / NDMA helpline 1700.`,
    options: ['↩ Back to Disaster', '📞 Show emergency numbers'],
  },
  '🌀 Storm / High Winds': {
    reply: `1. Stay indoors — away from windows and glass.\n2. Go to the lowest interior room (basement if available).\n3. Unplug electronics — protect from power surges.\n4. Fill bathtubs with water in case supply is cut.\n5. If outdoors, lie flat in a ditch away from trees and cars.\n6. Monitor NDMA / PMD alerts.`,
    options: ['↩ Back to Disaster', '📞 Show emergency numbers'],
  },
  '🔥 Wildfire nearby': {
    reply: `1. Evacuate immediately when ordered — don't wait to see the fire.\n2. Close all windows, doors, vents — leave them unlocked.\n3. Take go-bag: documents, medication, water, charger.\n4. Drive away with headlights ON — visibility may be low.\n5. Stay low if caught in smoke — breathe through wet cloth.\n6. Call 16 / 1122.`,
    options: ['↩ Back to Disaster', '📞 Show emergency numbers'],
  },
  '↩ Back to Disaster': {
    reply: 'Which natural disaster?',
    options: ['🏔️ Earthquake', '🌊 Flood', '🌀 Storm / High Winds', '🔥 Wildfire nearby'],
  },

  // ── numbers ────────────────────────────────────────────────────────────────
  '📞 Emergency Numbers': {
    reply: `**Pakistan Emergency Numbers:**\n\n🚑 Ambulance / Medical: **115**\n🚒 Fire Brigade: **16**\n🚔 Police: **15**\n🦺 Rescue (Punjab): **1122**\n🌊 NDMA Disaster: **1700**\n🏥 Edhi Foundation: **021-111-11-EDHI**\n\n**International SOS:** Country code + local emergency number.`,
    options: ['↩ Back to start'],
  },
  '📞 Show emergency numbers': {
    reply: `**Pakistan Emergency Numbers:**\n\n🚑 **115** — Ambulance / Medical\n🚒 **16** — Fire Brigade\n🚔 **15** — Police\n🦺 **1122** — Rescue Punjab\n🌊 **1700** — NDMA National Disaster\n🏥 **021-111-11-EDHI** — Edhi Foundation`,
    options: ['↩ Back to start'],
  },
  '↩ Back to start': {
    reply: 'How else can I help you?',
    options: QUICK_TOPICS.map(t => t.label),
  },
};

// ─── Format message text (bold + newlines) ────────────────────────────────────
function formatText(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    );
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function EmergencyChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [idCounter, setIdCounter] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Init with bot greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const flow = BOT_FLOWS['start'];
      setMessages([{ id: 0, from: 'bot', text: flow.reply, options: flow.options }]);
      setIdCounter(1);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleOption(option: string) {
    const nextId = idCounter;
    const userMsg: Message = { id: nextId, from: 'user', text: option };

    const flow = BOT_FLOWS[option];
    const botMsg: Message = flow
      ? { id: nextId + 1, from: 'bot', text: flow.reply, options: flow.options }
      : { id: nextId + 1, from: 'bot', text: "I don't have specific guidance for that. Please call emergency services immediately:\n🚑 115  🚒 16  🚔 15  🦺 1122", options: ['↩ Back to start'] };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setIdCounter(nextId + 2);
  }

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30 flex items-center justify-center border border-orange-400/30"
        title="Emergency Response Assistant"
        style={{ display: open ? 'none' : 'flex' }}
      >
        <span className="material-icons text-white text-2xl">support_agent</span>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-gray-950 animate-pulse" />
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] h-[540px] max-h-[calc(100vh-80px)] flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/60 bg-gray-950"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-600/80 to-red-700/80 backdrop-blur-md border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="material-icons text-white text-base">support_agent</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-none">Emergency Assistant</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[10px] text-white/60">AI · Always available</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-icons text-white text-base">close</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[88%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.from === 'user'
                      ? 'bg-orange-600/80 text-white rounded-br-sm'
                      : 'bg-white/[0.06] text-white/85 border border-white/[0.05] rounded-bl-sm'
                  }`}>
                    {formatText(msg.text)}
                  </div>

                  {/* Option buttons */}
                  {msg.from === 'bot' && msg.options && msg.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[92%]">
                      {msg.options.map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleOption(opt)}
                          className="text-[11px] font-medium text-white/70 hover:text-white bg-white/[0.05] hover:bg-orange-600/40 border border-white/[0.08] hover:border-orange-500/40 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-white/[0.05] bg-white/[0.02]">
              <p className="text-[10px] text-white/25 text-center">
                For life-threatening emergencies always call <span className="text-orange-400">115 · 16 · 15 · 1122</span> directly
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
