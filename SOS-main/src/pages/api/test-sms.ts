import { NextApiRequest, NextApiResponse } from 'next';

// DEV-ONLY — remove before final submission
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, TWILIO_MESSAGING_SERVICE_SID, TWILIO_PHONE_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return res.status(500).json({ error: 'Twilio credentials not configured' });
  }

  const to = req.body?.to || '+923704217413';
  const channel = req.body?.channel || 'whatsapp'; // 'whatsapp' or 'sms'

  const body =
    `🚨 TEST EMERGENCY ALERT 🚨\n` +
    `This is a test from SOS Emergency App.\n\n` +
    `📍 Location: Lat: 31.520370, Lon: 74.358749\n` +
    `🗺️ Map: https://maps.google.com/?q=31.520370,74.358749\n` +
    `⚡ Trigger: Manual (Test)\n` +
    `🕐 Time: ${new Date().toLocaleString()}\n\n` +
    `Twilio is working! ✅`;

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    let message;

    if (channel === 'whatsapp' && TWILIO_WHATSAPP_FROM) {
      message = await client.messages.create({
        body,
        from: TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${to}`,
      });
      console.log(`✅ WhatsApp test sent — SID: ${message.sid}`);
    } else {
      const sender = TWILIO_MESSAGING_SERVICE_SID
        ? { messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID }
        : { from: TWILIO_PHONE_NUMBER! };
      message = await client.messages.create({ body, to, ...sender });
      console.log(`✅ SMS test sent — SID: ${message.sid}`);
    }

    return res.status(200).json({ success: true, channel, sid: message.sid, to, status: message.status });
  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return res.status(500).json({ success: false, error: error.message, code: error.code });
  }
}
