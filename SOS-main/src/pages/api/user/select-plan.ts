import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../utils/db';
import User from '../../../models/User';
import { requireAuth } from '../../../utils/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Use requireAuth so both NextAuth cookie sessions and legacy JWT work
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent 401/403

    const { planId, planName } = req.body;

    if (!planId || !planName) {
      return res.status(400).json({ error: 'Plan ID and name are required' });
    }

    // Update user's selected plan
    const user = await (User as any).findById(authUser.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.subscription = {
      planId,
      planName,
      selectedAt: new Date(),
      status: 'active'
    };

    await user.save();

    res.status(200).json({ 
      message: 'Plan selected successfully',
      plan: { planId, planName },
      note: 'In a real implementation, this would redirect to payment processing'
    });

  } catch (error) {
    console.error('Error selecting plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
