import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  keywords?: string[];
  role: 'user' | 'admin';
  contacts: Array<{
    name: string;
    phone: string;
    relationship?: string;
  }>;
  bloodType?: string;
  medicalConditions?: string;
  age?: number;
  avatarUrl?: string;
  googleId?: string;  // For Google OAuth users
  passcode?: string;  // Emergency passcode
  subscription?: {
    planId: string;
    planName: string;
    selectedAt: Date;
    status: 'active' | 'pending' | 'expired' | 'cancelled';
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  contacts: [{
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, default: 'Emergency Contact' }
  }],
  keywords: { 
    type: [String], 
    default: ['help', 'emergency', 'sos', 'danger', 'fire', 'attack', 'injured', 'accident', 'panic', 'hurt', 'stuck', 'trapped', 'robbery', 'kidnapped', 'violence', 'threat']
  },
  bloodType: { type: String },
  medicalConditions: { type: String },
  age: { type: Number },
  avatarUrl: { type: String },
  googleId: { type: String },  // For Google OAuth
  passcode: { type: String },  // Emergency passcode
  subscription: {
    planId: { type: String },
    planName: { type: String },
    selectedAt: { type: Date },
    status: { 
      type: String, 
      enum: ['active', 'pending', 'expired', 'cancelled'],
      default: 'pending' 
    }
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt fields
});

// Hash password before saving to the database
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords during login
UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
