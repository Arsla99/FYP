import type { NextApiRequest, NextApiResponse } from 'next';

// Increase body limit to 20 MB for audio uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const emotionApiUrl = process.env.NEXT_PUBLIC_EMOTION_API_URL || process.env.EMOTION_API_URL;

  if (!emotionApiUrl) {
    return res.status(503).json({ error: 'EMOTION_API_URL not configured' });
  }

  try {
    // Stream the raw multipart body straight through to Colab — no parsing needed
    const contentType = req.headers['content-type'] || 'multipart/form-data';

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const bodyBuffer = Buffer.concat(chunks);

    const isNgrok = emotionApiUrl.includes('ngrok');

    const response = await fetch(`${emotionApiUrl}/emotion_recognition`, {
      method: 'POST',
      headers: {
        'content-type': contentType,
        ...(isNgrok ? { 'ngrok-skip-browser-warning': 'true' } : {}),
      },
      body: bodyBuffer,
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.error('[emotion/analyze] upstream error:', response.status, rawText);
      return res.status(response.status).json({ error: rawText || `HTTP ${response.status}` });
    }

    // Parse JSON — Colab might return plain text on error even with 200
    let raw: any;
    try {
      raw = JSON.parse(rawText);
    } catch {
      return res.status(502).json({ error: `Non-JSON response from model: ${rawText.slice(0, 200)}` });
    }

    // Normalize modelscope output → { emotion, confidence, all_scores, success }
    // Raw format: [ { scores: [...], labels: [...] } ]  or already normalized
    console.log('[emotion/analyze] raw from model:', JSON.stringify(raw));

    if (Array.isArray(raw) && raw[0]?.labels && raw[0]?.scores) {
      const { labels, scores } = raw[0];
      const all_scores: Record<string, number> = {};
      labels.forEach((label: string, i: number) => {
        // Labels are bilingual e.g. "恐惧/fearful", "生气/angry" — extract English part after "/"
        const english = label.includes('/') ? label.split('/').pop()! : label;
        const key = english
          .toLowerCase()
          .replace('fearful', 'fear')
          .replace('disgusted', 'disgust');
        all_scores[key] = scores[i];
      });

      console.log('[emotion/analyze] all_scores:', JSON.stringify(all_scores));

      // Pick highest-scoring emotion
      const topLabel = Object.entries(all_scores).sort((a, b) => b[1] - a[1])[0];
      console.log(`[emotion/analyze] → ${topLabel[0]} (${(topLabel[1]*100).toFixed(1)}%)`);
      return res.status(200).json({
        success: true,
        emotion: topLabel[0],
        confidence: topLabel[1],
        all_scores,
      });
    }

    // Already in expected shape — pass through
    return res.status(200).json({ success: true, ...raw });
  } catch (err) {
    console.error('[emotion/analyze] proxy error:', err);
    return res.status(500).json({ error: `Proxy error: ${(err as Error).message}` });
  }
}
