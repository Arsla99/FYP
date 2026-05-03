import { NextApiRequest, NextApiResponse } from 'next';

// DEV-ONLY — remove before final submission
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Diagnostic endpoint
    const env = {
      hasSID: !!process.env.TWILIO_ACCOUNT_SID,
      hasToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasWhatsappFrom: !!process.env.TWILIO_WHATSAPP_FROM,
      hasMessagingServiceSid: !!process.env.TWILIO_MESSAGING_SERVICE_SID,
      hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
    };
    
    return res.status(200).json({
      status: 'OK',
      message: 'POST to test WhatsApp/SMS • GET for diagnostics',
      environment: env,
      fullyConfigured: Object.values(env).every(v => v),
      instructions: {
        whatsapp_required: ['hasSID', 'hasToken', 'hasWhatsappFrom'],
        sms_required: ['hasSID', 'hasToken', 'hasMessagingServiceSid or hasPhoneNumber'],
      }
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, TWILIO_MESSAGING_SERVICE_SID, TWILIO_PHONE_NUMBER } = process.env;

  // Validation
  const missing = [];
  if (!TWILIO_ACCOUNT_SID) missing.push('TWILIO_ACCOUNT_SID');
  if (!TWILIO_AUTH_TOKEN) missing.push('TWILIO_AUTH_TOKEN');
  
  const channel = req.body?.channel || 'whatsapp';
  if (channel === 'whatsapp' && !TWILIO_WHATSAPP_FROM) missing.push('TWILIO_WHATSAPP_FROM');
  if (channel === 'sms' && !TWILIO_MESSAGING_SERVICE_SID && !TWILIO_PHONE_NUMBER) missing.push('TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER');

  if (missing.length > 0) {
    return res.status(500).json({ 
      error: 'Missing Twilio configuration',
      missing,
      help: 'Add these to your .env.local file'
    });
  }

  const to = req.body?.to || '+923704217413';
  
  // Sanitize phone number: remove spaces, dashes, parentheses, etc.
  // Keep only + and digits
  const cleanPhone = to.trim()
    .replace(/[\s\-().]/g, '')
    .split('+').reverse()[0]; // Remove any leading text, keep last +number

  const finalPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

  const body =
    `*TEST: Emergency Alert System* ✅\n\n` +
    `This is a test message from the SOS Emergency App.\n` +
    `Twilio configuration is working correctly!\n\n` +
    `📍 Location: Lat: 31.520370, Lon: 74.358749\n` +
    `🗺️ Map: https://maps.google.com/?q=31.520370,74.358749\n` +
    `⌚ Time: ${new Date().toLocaleString()}\n\n` +
    `_Message sent at: ${new Date().toISOString()}_`;

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    console.log(`📤 Sending ${channel} test to: ${to} (sanitized: ${finalPhone})`);
    let message;

    if (channel === 'whatsapp') {
      console.log(`📞 Using WhatsApp From: ${TWILIO_WHATSAPP_FROM}`);
      message = await client.messages.create({
        body,
        from: TWILIO_WHATSAPP_FROM!,
        to: `whatsapp:${finalPhone}`,
      });
      console.log(`✅ WhatsApp test sent — SID: ${message.sid} — Status: ${message.status}`);
    } else if (channel === 'sms') {
      const sender = TWILIO_MESSAGING_SERVICE_SID
        ? { messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID }
        : { from: TWILIO_PHONE_NUMBER! };
      console.log(`📞 Using SMS From: ${TWILIO_PHONE_NUMBER || TWILIO_MESSAGING_SERVICE_SID}`);
      message = await client.messages.create({ body, to: finalPhone, ...sender });
      console.log(`✅ SMS test sent — SID: ${message.sid} — Status: ${message.status}`);
    }

    return res.status(200).json({ 
      success: true, 
      channel, 
      recipientOriginal: to,
      recipientSanitized: finalPhone,
      sid: message.sid, 
      status: message.status,
      message: `${channel.toUpperCase()} test sent successfully!`
    });
  } catch (error: any) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(`Code: ${error.code}`);
    return res.status(500).json({ 
      success: false, 
      error: error.message, 
      code: error.code,
      details: error.details?.errors?.[0]?.message || 'See logs for details'
    });
  }
}
