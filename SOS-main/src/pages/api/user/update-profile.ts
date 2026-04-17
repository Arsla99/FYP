import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../utils/db';
import User from '../../../models/User';
import { requireAuth } from '../../../utils/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const user = await requireAuth(req, res);
    if (!user) return;

    // Connect to database
    await connectDB();

    // Get update data from request body
    const {
      name,
      age,
      bloodType,
      medicalConditions,
      avatarUrl
    } = req.body;

    // Find and update user
    const updatedUser = await (User as any).findByIdAndUpdate(
      user.id,
      {
        $set: {
          ...(name && { name }),
          ...(age !== undefined && { age }),
          ...(bloodType && { bloodType }),
          ...(medicalConditions !== undefined && { medicalConditions }),
          ...(avatarUrl && { avatarUrl })
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
