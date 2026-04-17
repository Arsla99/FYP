// pages/api/send-sos.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface SOSRequest {
  location: {
    lat: number | null;
    lon: number | null;
    text: string;
  };
  phoneNumber: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { location, phoneNumber }: SOSRequest = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // For now, just simulate sending SMS
    // In a real implementation, you would integrate with an SMS service like Twilio
    console.log('SOS Alert Details:');
    console.log('Phone Number:', phoneNumber);
    console.log('Location:', location);

    const message = location.lat && location.lon
      ? `🚨 EMERGENCY ALERT 🚨\n\nSOS triggered!\nLocation: ${location.text}\nGoogle Maps: https://maps.google.com/?q=${location.lat},${location.lon}\n\nPlease contact emergency services immediately!`
      : `🚨 EMERGENCY ALERT 🚨\n\nSOS triggered!\nLocation: ${location.text}\n\nPlease contact emergency services immediately!`;

    console.log('Message that would be sent:', message);

    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'SOS alert sent successfully',
      details: {
        phoneNumber,
        location: location.text,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error sending SOS:', error);
    return res.status(500).json({
      error: 'Failed to send SOS alert',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
