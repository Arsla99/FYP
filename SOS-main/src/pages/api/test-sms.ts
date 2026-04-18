import { NextApiRequest, NextApiResponse } from 'next';

// DEV-ONLY endpoint — remove before final production submission
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID, TWILIO_PHONE_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return res.status(500).json({ error: 'Twilio credentials not configured' });
  }

  const to = req.body?.to || '+923704217413';

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const sender = TWILIO_MESSAGING_SERVICE_SID
      ? { messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID }
      : { from: TWILIO_PHONE_NUMBER! };

    const message = await client.messages.create({
      body:
        `🚨 TEST EMERGENCY ALERT 🚨\n` +
        `This is a test from SOS Emergency App.\n\n` +
        `📍 Location: Lat: 31.520370, Lon: 74.358749\n` +
        `🗺️ Map: https://maps.google.com/?q=31.520370,74.358749\n` +
        `⚡ Trigger: Manual (Test)\n` +
        `🕐 Time: ${new Date().toLocaleString()}\n\n` +
        `If you received this, Twilio is working! ✅`,
      to,
      ...sender,
    });

    console.log(`✅ Test SMS sent — SID: ${message.sid}`);
    return res.status(200).json({ success: true, sid: message.sid, to, status: message.status });
  } catch (error: any) {
    console.error('❌ Test SMS failed:', error);
    return res.status(500).json({ success: false, error: error.message, code: error.code });
  }
}
