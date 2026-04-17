import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get NextAuth session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if user is admin
    if (session.user.role !== "admin") {
      return res.status(403).json({ 
        message: "Admin access required",
        currentRole: session.user.role || "user"
      });
    }

    const { db } = await connectToDatabase();

    const adminEmail = session.user.email || "unknown";

    // Handle GET - Fetch all users
    if (req.method === "GET") {
      await handleGetUsers(db, res, adminEmail);
    }
    // Handle PUT - Update user role
    else if (req.method === "PUT") {
      await handleUpdateUser(db, req, res, adminEmail);
    }
    // Handle DELETE - Delete user
    else if (req.method === "DELETE") {
      await handleDeleteUser(db, req, res, adminEmail);
    }
    else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("❌ Admin API error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function handleGetUsers(db: any, res: NextApiResponse, adminEmail: string) {
  try {

    // Fetch all users with contacts info
    const users = await db
      .collection("users")
      .find({})
      .project({
        password: 0,
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Count active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = users.filter(
      (user: any) => user.lastActive && new Date(user.lastActive) > thirtyDaysAgo
    );

    console.log(`✅ Admin ${adminEmail} accessed user list - Found ${users.length} users`);

    res.status(200).json({
      success: true,
      users: users,
      pagination: {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
      },
      stats: {
        total: users.length,
        active: activeUsers.length,
        admins: users.filter((u: any) => u.role === "admin").length,
        regular: users.filter((u: any) => u.role !== "admin").length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    throw error;
  }
}

async function handleUpdateUser(db: any, req: NextApiRequest, res: NextApiResponse, adminEmail: string) {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ message: "userId and role are required" });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: role } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`✅ Admin ${adminEmail} updated user ${userId} role to ${role}`);

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    throw error;
  }
}

async function handleDeleteUser(db: any, req: NextApiRequest, res: NextApiResponse, adminEmail: string) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`✅ Admin ${adminEmail} deleted user ${userId}`);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    throw error;
  }
}
