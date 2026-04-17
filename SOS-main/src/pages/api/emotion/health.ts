import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const emotionApiUrl = process.env.NEXT_PUBLIC_EMOTION_API_URL || process.env.EMOTION_API_URL;

  if (!emotionApiUrl) {
    return res.status(503).json({ error: 'EMOTION_API_URL not configured' });
  }

  try {
    const response = await fetch(`${emotionApiUrl}/health`, {
      method: 'GET',
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(503).json({ error: `Cannot reach emotion API: ${(err as Error).message}` });
  }
}
