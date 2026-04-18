// // src/pages/api/audio-translate.ts
// import { NextApiRequest, NextApiResponse } from 'next';
// import formidable from 'formidable'; // Import formidable
// import FormData from 'form-data';
// import fs from 'fs'; // For temporary file handling if formidable saves to disk
// import path from 'path'; // For path operations

// // IMPORTANT: Ensure your Groq API key is in your .env.local file
// const GROQ_API_KEY = process.env.GROQ_API_KEY;

// export const config = {
//   api: {
//     bodyParser: false, // Disable Next.js body parser, formidable handles it
//   },
// };

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method Not Allowed' });
//   }

//   if (!GROQ_API_KEY) {
//     console.error("GROQ_API_KEY is not set in environment variables.");
//     return res.status(500).json({ message: 'Server configuration error: GROQ_API_KEY missing.' });
//   }

//   const form = formidable({
//     multiples: false, // Expecting a single file
//     keepExtensions: true, // Keep original file extensions
//     // uploadDir: path.join(process.cwd(), 'temp'), // Optional: if you want to store files temporarily
//     // You might need to create this 'temp' directory in your project root
//   });

//   try {
//     const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
//       form.parse(req, (err: any, fields: any, files: any) => {
//         if (err) return reject(err);
//         resolve({ fields, files });
//       });
//     });

//     const audioFile = files.audio as unknown as formidable.File; // 'audio' is the name of the input field from the frontend
//     if (!audioFile || Array.isArray(audioFile)) { // Ensure it's a single file object
//       return res.status(400).json({ message: 'No single audio file found in the request.' });
//     }

//     const filePath = audioFile.filepath; // formidable stores the file temporarily

//     if (!filePath) {
//       return res.status(400).json({ message: 'Audio file path not found.' });
//     }

//     // Read the temporary file into a buffer
//     const audioBuffer = fs.readFileSync(filePath);

//     // Create FormData for Groq API
//     const formData = new FormData();
//     formData.append('file', audioBuffer, {
//       filename: audioFile.originalFilename || 'audio.webm', // Use original filename or default
//       contentType: audioFile.mimetype || 'audio/webm', // Use original mimetype or default
//     });
//     formData.append('model', 'whisper-large-v3'); // Groq's transcription model

//     // Send audio to Groq API
//     const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/translations', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${GROQ_API_KEY}`,
//         ...formData.getHeaders(), // Important for Content-Type with boundary
//       },
//       body: formData as unknown as BodyInit,
//     });

//     // Clean up the temporary file
//     fs.unlink(filePath, (err) => {
//       if (err) console.error('Error deleting temp file:', err);
//     });

//     if (!groqResponse.ok) {
//       const errorData = await groqResponse.json();
//       console.error('Groq API Error:', errorData);
//       return res.status(groqResponse.status).json({ message: 'Error from Groq API', error: errorData });
//     }

//     const groqData = await groqResponse.json();
//     const transcribedText = groqData.text;

//     // --- Sentiment/Keyword Detection for Fear/Danger ---
//     let fearOrDangerDetected = false;
//     const fearKeywords = [
//       "fear", "scared", "panic", "help", "emergency", "danger", "attack",
//       "injured", "fire", "accident", "trapped", "sos", "alarm", "hurt",
//       "pain", "unsafe", "threat", "violence", "robbery", "kidnapped", "collapse",
//       "broken", "stuck", "police", "ambush", "shot", "dead", "killing", "screaming"
//     ]; // Expanded keyword list
//     const lowerTranscribedText = transcribedText.toLowerCase();

//     for (const keyword of fearKeywords) {
//       if (lowerTranscribedText.includes(keyword)) {
//         fearOrDangerDetected = true;
//         break;
//       }
//     }

//     // --- Respond to Client ---
//     res.status(200).json({
//       transcribedText,
//       fearOrDangerDetected,
//       message: 'Audio processed successfully and analyzed for distress.',
//     });

//   } catch (error) {
//     console.error('Server error during audio translation or processing:', error);
//     // Ensure the temporary file is deleted even if there's an error during processing
//     // This requires catching the error earlier or having a cleanup mechanism.
//     // For now, let formidable handle its temporary files or add cleanup if you use uploadDir.
//     res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
//   }
// }

// src/pages/api/audio-translate.ts
// Uses Gemini 2.0 Flash (free tier) for audio transcription + distress detection
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables.');
    return res.status(500).json({ message: 'Server configuration error: GEMINI_API_KEY missing.' });
  }

  const form = formidable({ multiples: false, keepExtensions: true });

  try {
    const { files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err: any, fields: any, files: any) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const audioFile = files.audio as unknown as formidable.File;
    if (!audioFile || Array.isArray(audioFile)) {
      return res.status(400).json({ message: 'No single audio file found in the request.' });
    }

    const filePath = audioFile.filepath;
    if (!filePath) {
      return res.status(400).json({ message: 'Audio file path not found.' });
    }

    const audioBuffer = fs.readFileSync(filePath);
    const audioBase64 = audioBuffer.toString('base64');
    const mimeType = (audioFile.mimetype || 'audio/webm') as string;

    // Clean up temp file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    // Send audio to Gemini for transcription + distress analysis in one call
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: audioBase64,
              },
            },
            {
              text: `Transcribe the audio and analyze it for distress or emergency content.
Return ONLY a valid JSON object (no markdown, no code fences) with these fields:
{
  "transcription": "<full transcription>",
  "fearOrDangerDetected": <true or false>,
  "reason": "<brief reason if fearOrDangerDetected is true, else empty string>"
}
Detect fearOrDangerDetected as true if the audio contains: screaming, crying, words like help/danger/fire/attack/emergency/SOS/pain/hurt/trapped/robbery/violence/accident, or any clear distress signals.`,
            },
          ],
        }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API Error:', errorData);
      return res.status(geminiResponse.status).json({ message: 'Error from Gemini API', error: errorData });
    }

    const geminiData = await geminiResponse.json();
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    let parsed: { transcription?: string; fearOrDangerDetected?: boolean; reason?: string } = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error('Failed to parse Gemini JSON response:', rawText);
      return res.status(500).json({ message: 'Failed to parse Gemini response', raw: rawText });
    }

    return res.status(200).json({
      transcribedText: parsed.transcription ?? '',
      fearOrDangerDetected: parsed.fearOrDangerDetected ?? false,
      reason: parsed.reason ?? '',
      message: 'Audio processed successfully and analyzed for distress.',
    });

  } catch (error) {
    console.error('Server error during audio processing:', error);
    return res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
  }
}
