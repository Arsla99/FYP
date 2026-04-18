import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';
import { requireAuth } from '../../../utils/serverAuth';
import connectDB from '../../../utils/db';
import User from '../../../models/User';

function buildMessage(userName: string, location: string, triggerMethod: string, emotion: string, fearLevel: number, lat?: number, lon?: number): string {
  const mapsLink = lat && lon ? `https://maps.google.com/?q=${lat},${lon}` : null;

  return (
    `🚨 EMERGENCY ALERT 🚨\n` +
    `${userName} needs help!\n\n` +
    `📍 Location: ${location}\n` +
    (mapsLink ? `🗺️ Map: ${mapsLink}\n` : '') +
    `⚡ Trigger: ${triggerMethod}\n` +
    (emotion && emotion !== 'unknown' ? `😰 Emotion: ${emotion} (${fearLevel}%)\n` : '') +
    `🕐 Time: ${new Date().toLocaleString()}\n\n` +
    `Please check on them immediately!`
  );
}

type ContactResult = { name: string; phone: string; channel: string; status: string; sid?: string; error?: string };

async function sendAlerts(
  contacts: Array<{ name: string; phone: string }>,
  message: string
): Promise<ContactResult[]> {
  const twilio = (await import('twilio')).default;
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const smsFrom = process.env.TWILIO_PHONE_NUMBER;

  const results: ContactResult[] = [];

  for (const contact of contacts) {
    const phone = contact.phone.trim();

    // ── 1. Try WhatsApp first ──────────────────────────────────────────────
    if (whatsappFrom) {
      try {
        const msg = await client.messages.create({
          body: message,
          from: whatsappFrom,
          to: `whatsapp:${phone}`,
        });
        console.log(`✅ WhatsApp sent to ${contact.name} (${phone}) — SID: ${msg.sid}`);
        results.push({ name: contact.name, phone, channel: 'whatsapp', status: 'sent', sid: msg.sid });
        continue; // WhatsApp succeeded — skip SMS for this contact
      } catch (err: any) {
        console.warn(`⚠️ WhatsApp failed for ${contact.name} (code ${err.code}) — falling back to SMS`);
      }
    }

    // ── 2. SMS fallback ────────────────────────────────────────────────────
    try {
      const sender = messagingServiceSid ? { messagingServiceSid } : { from: smsFrom! };
      const msg = await client.messages.create({ body: message, to: phone, ...sender });
      console.log(`✅ SMS sent to ${contact.name} (${phone}) — SID: ${msg.sid}`);
      results.push({ name: contact.name, phone, channel: 'sms', status: 'sent', sid: msg.sid });
    } catch (err: any) {
      console.error(`❌ SMS also failed for ${contact.name}: ${err.message}`);
      results.push({ name: contact.name, phone, channel: 'sms', status: 'failed', error: err.message });
    }
  }

  return results;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { db } = await connectToDatabase();
    await connectDB();

    const userDoc = await (User as any).findById(user.id).select('contacts');
    if (!userDoc?.contacts?.length) {
      return res.status(400).json({
        success: false,
        message: 'No emergency contacts configured. Please add contacts in your profile.',
      });
    }

    const { location, emotion, fearLevel, triggerMethod, detectedKeyword, timestamp, lat, lon } = req.body;

    const alertData = {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      contacts: userDoc.contacts.map((c: any) => ({ name: c.name, phone: c.phone, relationship: c.relationship })),
      location: location || 'Location unavailable',
      emotion: emotion || 'unknown',
      fearLevel: fearLevel || 0,
      triggerMethod: triggerMethod || 'Manual',
      detectedKeyword: detectedKeyword || null,
      createdAt: new Date(timestamp || Date.now()),
      status: 'pending',
    };

    const result = await db.collection('emergency_alerts').insertOne(alertData);
    console.log(`🚨 Emergency alert for ${user.email} → ${userDoc.contacts.length} contact(s)`);

    const message = buildMessage(
      user.name, alertData.location, alertData.triggerMethod,
      alertData.emotion, alertData.fearLevel, lat, lon
    );

    const twilioConfigured =
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_PHONE_NUMBER);

    let sendResults: ContactResult[] | { name: string; phone: string; status: string }[];

    if (twilioConfigured) {
      sendResults = await sendAlerts(userDoc.contacts, message);
    } else {
      console.log('⚠️ Twilio not configured — simulating');
      sendResults = userDoc.contacts.map((c: any) => ({ name: c.name, phone: c.phone, status: 'simulated' }));
    }

    await db.collection('emergency_alerts').updateOne(
      { _id: result.insertedId },
      { $set: { status: 'sent', sendResults, sentAt: new Date() } }
    );

    const sentCount = (sendResults as any[]).filter(r => r.status === 'sent').length;
    const whatsappCount = (sendResults as ContactResult[]).filter(r => r.status === 'sent' && r.channel === 'whatsapp').length;
    const smsCount = (sendResults as ContactResult[]).filter(r => r.status === 'sent' && r.channel === 'sms').length;

    return res.status(200).json({
      success: true,
      message: `Alert sent to ${sentCount}/${userDoc.contacts.length} contact(s) — WhatsApp: ${whatsappCount}, SMS: ${smsCount}`,
      alertId: result.insertedId,
      contactsNotified: userDoc.contacts.length,
      sendResults,
    });
  } catch (error) {
    console.error('❌ Error sending emergency alert:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
