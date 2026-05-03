import { NextApiRequest, NextApiResponse } from 'next';

const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_BACKUP,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter((k) => k && k.startsWith('AIzaSy')) as string[];

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are the Emergency Response Assistant for the SOS Emergency App — a safety application built for users in Pakistan.

YOUR ROLE:
1. Guide users through emergencies with clear, numbered step-by-step instructions
2. Help users understand SOS app features:
   - SOS Button: Sends automatic SMS alerts with GPS location to emergency contacts
   - Emergency Contacts: Trusted people who receive alerts when SOS is triggered
   - Emotion Detection: Microphone-based distress analysis that auto-triggers SOS
   - Keywords: Custom words that trigger automatic SOS when detected in speech
   - Settings: Manage profile, blood type, medical conditions, contacts
3. Provide first-aid and emergency procedure guidance
4. Always mention relevant Pakistan emergency numbers

PAKISTAN EMERGENCY NUMBERS (mention when relevant):
- 🚑 115 — Ambulance / Medical Emergency
- 🚒 16 — Fire Brigade
- 🚔 15 — Police
- 🦺 1122 — Rescue (Punjab)
- 🌊 1700 — NDMA National Disaster Helpline
- 🏥 021-111-11-EDHI — Edhi Foundation

RULES:
- For life-threatening emergencies: ALWAYS say "Call 115/15/16/1122 IMMEDIATELY" before anything else
- Be concise, calm, and empathetic — this user may be in distress
- Use **bold** for critical info, numbered steps for procedures
- Keep responses under 250 words unless detailed steps are essential
- You are NOT a substitute for real emergency services — always reinforce calling them
- If asked something unrelated to emergencies or the app, gently redirect`;

interface HistoryEntry {
  role: string;
  text: string;
}

const FALLBACK = "I'm having trouble right now. For emergencies call: 🚑 **115** · 🚔 **15** · 🚒 **16** · 🦺 **1122**";

async function tryGroq(message: string, history: HistoryEntry[]): Promise<string | null> {
  if (!GROQ_KEY) return null;
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-20).map((h) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text,
      })),
      { role: 'user', content: message },
    ];

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: 512, temperature: 0.65 }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function tryGemini(message: string, history: HistoryEntry[]): Promise<string | null> {
  const contents = [
    ...history.slice(-20).map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  for (const key of GEMINI_KEYS) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.65, maxOutputTokens: 512 },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        const isQuota = res.status === 429 || err?.error?.status === 'RESOURCE_EXHAUSTED';
        if (isQuota) continue;
        return null;
      }

      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch {
      continue;
    }
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { message, history = [] } = req.body as { message: string; history: HistoryEntry[] };
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  const reply =
    (await tryGroq(message, history)) ??
    (await tryGemini(message, history)) ??
    FALLBACK;

  return res.status(200).json({ reply });
}
