import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';
import { requireAuth } from '../../../utils/serverAuth';
import connectDB from '../../../utils/db';
import User from '../../../models/User';

function buildSMSMessage(userName: string, location: string, triggerMethod: string, emotion: string, fearLevel: number, lat?: number, lon?: number): string {
  const mapsLink = lat && lon
    ? `https://maps.google.com/?q=${lat},${lon}`
    : null;

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

async function sendViaTwilio(
  contacts: Array<{ name: string; phone: string }>,
  message: string
): Promise<Array<{ name: string; phone: string; status: string; sid?: string; error?: string }>> {
  const twilio = (await import('twilio')).default;
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

  // Support both Messaging Service SID and direct phone number
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const sender = messagingServiceSid
    ? { messagingServiceSid }
    : { from: from! };

  const results = await Promise.allSettled(
    contacts.map(contact =>
      client.messages.create({ body: message, to: contact.phone, ...sender })
    )
  );

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`✅ SMS sent to ${contacts[i].name} (${contacts[i].phone}) — SID: ${result.value.sid}`);
      return { name: contacts[i].name, phone: contacts[i].phone, status: 'sent', sid: result.value.sid };
    } else {
      console.error(`❌ SMS failed for ${contacts[i].name}: ${result.reason}`);
      return { name: contacts[i].name, phone: contacts[i].phone, status: 'failed', error: String(result.reason) };
    }
  });
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
    console.log(`🚨 Emergency alert created for ${user.email} → ${userDoc.contacts.length} contact(s)`);

    const message = buildSMSMessage(user.name, alertData.location, alertData.triggerMethod, alertData.emotion, alertData.fearLevel, lat, lon);

    const twilioConfigured =
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_PHONE_NUMBER);

    let sendResults: any[];

    if (twilioConfigured) {
      sendResults = await sendViaTwilio(userDoc.contacts, message);
    } else {
      // Simulation mode — no Twilio credentials yet
      console.log('⚠️  Twilio not configured — simulating SMS sends');
      sendResults = userDoc.contacts.map((c: any) => {
        console.log(`📱 [SIMULATED] SMS to ${c.name} (${c.phone}):\n${message}`);
        return { name: c.name, phone: c.phone, status: 'simulated' };
      });
    }

    await db.collection('emergency_alerts').updateOne(
      { _id: result.insertedId },
      { $set: { status: 'sent', sendResults, sentAt: new Date() } }
    );

    const sentCount = sendResults.filter(r => r.status === 'sent').length;
    const simCount = sendResults.filter(r => r.status === 'simulated').length;

    res.status(200).json({
      success: true,
      message: twilioConfigured
        ? `Emergency alert sent to ${sentCount}/${userDoc.contacts.length} contact(s)`
        : `Emergency alert simulated for ${simCount} contact(s) (Twilio not configured)`,
      alertId: result.insertedId,
      contactsNotified: userDoc.contacts.length,
      sendResults,
    });
  } catch (error) {
    console.error('❌ Error sending emergency alert:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
