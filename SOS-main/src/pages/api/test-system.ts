import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const testResults = {
    timestamp: new Date().toISOString(),
    tests: {
      environment: { status: 'checking...', details: {} },
      database: { status: 'checking...', details: {} },
      emotionAPI: { status: 'checking...', details: {} }
    }
  };

  // Test Environment Variables
  try {
    const envTests = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      MONGODB_DB: !!process.env.MONGODB_DB,
      JWT_SECRET: !!process.env.JWT_SECRET,
      EMOTION_API_URL: !!process.env.NEXT_PUBLIC_EMOTION_API_URL
    };

    testResults.tests.environment = {
      status: Object.values(envTests).every(Boolean) ? 'passed' : 'failed',
      details: envTests
    };
  } catch (error) {
    testResults.tests.environment = {
      status: 'error',
      details: { error: 'Failed to check environment variables' }
    };
  }

  // Test MongoDB Connection
  try {
    const { db } = await connectToDatabase();
    await db.admin().ping();
    
    const collections = await db.listCollections().toArray();
    testResults.tests.database = {
      status: 'passed',
      details: {
        connected: true,
        database: process.env.MONGODB_DB,
        collections: collections.map(c => c.name)
      }
    };
  } catch (error) {
    testResults.tests.database = {
      status: 'failed',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown database error' 
      }
    };
  }

  // Test Emotion API
  try {
    const API_URL = process.env.NEXT_PUBLIC_EMOTION_API_URL;
    if (!API_URL) {
      throw new Error('Emotion API URL not configured');
    }

    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'ngrok-skip-browser-warning': 'true' },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      testResults.tests.emotionAPI = {
        status: 'passed',
        details: { 
          url: API_URL,
          health: data 
        }
      };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    testResults.tests.emotionAPI = {
      status: 'failed',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown API error',
        url: process.env.NEXT_PUBLIC_EMOTION_API_URL
      }
    };
  }

  const allPassed = Object.values(testResults.tests).every(test => test.status === 'passed');

  res.status(allPassed ? 200 : 500).json({
    success: allPassed,
    message: allPassed ? 'All system tests passed!' : 'Some system tests failed',
    ...testResults
  });
}
