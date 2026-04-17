// import { NextApiRequest, NextApiResponse } from 'next';
// import fs from 'fs/promises';
// import path from 'path';

// const DATA_DIR = path.resolve(process.cwd(), 'data'); // Define the directory path
// const USERS_FILE_PATH = path.join(DATA_DIR, 'users.json'); // Join directory and file name

// export default async function signup(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method Not Allowed' });
//   }

//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ message: 'Email and password are required.' });
//   }

//   try {
//     // --- NEW: Ensure data directory exists ---
//     await fs.mkdir(DATA_DIR, { recursive: true }); // Create directory if it doesn't exist
//     // ------------------------------------------

//     // Read existing users from the file
//     let users: { email: string; password: string }[] = [];
//     try {
//       const data = await fs.readFile(USERS_FILE_PATH, 'utf-8');
//       users = JSON.parse(data);
//     } catch (readError: any) {
//       // If file doesn't exist or is empty/corrupted, start with an empty array
//       if (readError.code === 'ENOENT' || readError instanceof SyntaxError) { // Also handle empty/corrupted JSON
//         console.warn('users.json not found or corrupted, initializing with empty array.');
//         users = []; // Initialize as empty array
//       } else {
//         console.error('Error reading users.json:', readError);
//         return res.status(500).json({ message: 'Failed to read user data.' });
//       }
//     }

//     // Check if user already exists
//     const userExists = users.some(u => u.email === email);
//     if (userExists) {
//       return res.status(409).json({ message: 'Email already registered.' });
//     }

//     // Add new user (with plain text password, as requested)
//     users.push({ email, password });

//     // Write updated users array back to the file
//     await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf-8');

//     return res.status(201).json({ message: 'User registered successfully!' });

//   } catch (error) {
//     console.error('Signup error:', error);
//     return res.status(500).json({ message: 'Something went wrong during signup.' });
//   }
// }


// DBBBBBBBBBBBBBBBB

// import mongoose from "mongoose";
// import { User } from "../../../models/User";

// async function connectDB() {
//   if (mongoose.connections[0].readyState) return;

//   const mongoURI = process.env.MONGODB_URI;
//   if (!mongoURI) {
//     throw new Error("Missing MONGODB_URI environment variable");
//   }

//   await mongoose.connect(mongoURI);
// }

// export default async function handler(req: { method: string; body: { name: any; email: any; password: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; }) {
//   if (req.method === "POST") {
//     const { name, email, password } = req.body;

//     await connectDB();

//     try {
//       const userExists = await (User as any).findOne({ email });
//       if (userExists) {
//         return res.status(400).json({ message: "User already exists" });
//       }

//       const user = new User({ name, email, password });
//       await user.save();

//       res.status(201).json({ message: "User created" });
//     } catch (error) {
//       res.status(500).json({ message: "Server error" });
//     }
//   } else {
//     res.status(400).json({ message: "Invalid request" });
//   }
// }



// import mongoose from "mongoose";
// import User from "../../../models/User";
// import bcrypt from "bcryptjs";

// async function connectDB() {
//   if (mongoose.connections[0].readyState) return;

//   const mongoURI = process.env.MONGODB_URI;
//   if (!mongoURI) {
//     throw new Error("Missing MONGODB_URI environment variable");
//   }

//   await mongoose.connect(mongoURI);
// }

// export default async function handler(req: { method: string; body: { name: any; email: any; password: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; }) {
//   if (req.method === "POST") {
//     const { name, email, password } = req.body;

//     await connectDB();

//     try {
//       const userExists = await (User as any).findOne({ email });
//       if (userExists) {
//         return res.status(400).json({ message: "User already exists" });
//       }

//       // Hash the password before saving the user
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(password, salt);

//       const user = new User({ name, email, password: hashedPassword });
//       await user.save();

//       res.status(201).json({ message: "User created" });
//     } catch (error) {
//       res.status(500).json({ message: "Server error" });
//     }
//   } else {
//     res.status(400).json({ message: "Invalid request" });
//   }
// }






// src/pages/api/auth/signup.ts
import User from "../../../models/User";
import connectDB from "../../../utils/db";
import { NextApiRequest, NextApiResponse } from 'next';

// Use NextApiRequest and NextApiResponse for better typing
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please enter all fields" });
    }

    await connectDB();

    try {
      const userExists = await (User as any).findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }

      // --- REMOVE THE MANUAL HASHING HERE ---
      // The password will be hashed automatically by the pre('save') hook in your User model
      const user = new User({ name, email, password }); // Pass the plain password
      await user.save();

      res.status(201).json({ message: "User created successfully" }); // More descriptive message
    } catch (error) {
      console.error("Signup error:", error); // Log the actual error
      res.status(500).json({ message: "Server error during signup" }); // More descriptive message
    }
  } else {
    res.status(400).json({ message: "Invalid request method. Only POST allowed." }); // More descriptive message
  }
}