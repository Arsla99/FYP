import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const API_URL = process.env.NEXT_PUBLIC_EMOTION_API_URL;
    
    if (!API_URL) {
      return res.status(500).json({ 
        success: false,
        message: 'Emotion API URL not configured' 
      });
    }

    console.log('🧪 Testing emotion API connection...');
    
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      res.status(200).json({
        success: true,
        message: 'Emotion API connection successful!',
        apiUrl: API_URL,
        health: data,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Emotion API test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Emotion API connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      apiUrl: process.env.NEXT_PUBLIC_EMOTION_API_URL,
      timestamp: new Date().toISOString()
    });
  }
}
