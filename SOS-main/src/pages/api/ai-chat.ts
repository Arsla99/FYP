import { NextApiRequest, NextApiResponse } from 'next';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not set');
    return res.status(500).json({
      reply: 'AI service not configured. For emergencies call: 🚑 115 · 🚔 15 · 🚒 16 · 🦺 1122',
    });
  }

  const { message, history = [] } = req.body as { message: string; history: HistoryEntry[] };

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Keep last 10 exchanges to stay within token limits
  const recentHistory = (history as HistoryEntry[]).slice(-20);

  const contents = [
    ...recentHistory.map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Gemini API error:', err);
      return res.status(500).json({
        reply: "I'm having trouble right now. For emergencies call: 🚑 **115** · 🚔 **15** · 🚒 **16** · 🦺 **1122**",
      });
    }

    const data = await response.json();
    const reply: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I couldn't generate a response. Please call emergency services if needed.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({
      reply: 'Connection error. For emergencies: 🚑 **115** · 🚔 **15** · 🚒 **16** · 🦺 **1122**',
    });
  }
}
