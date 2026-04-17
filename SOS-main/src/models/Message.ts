import mongoose, { Schema, Document } from 'mongoose';

export type MessageType = 'text' | 'image' | 'video' | 'voice';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderAvatar?: string;
  receiverId: mongoose.Types.ObjectId;
  message: string;
  messageType: MessageType;
  mediaData?: string;   // base64 data URI for image/video/voice
  mediaMime?: string;   // e.g. 'image/jpeg', 'video/mp4', 'audio/webm'
  read: boolean;
  timestamp: Date;
}

const MessageSchema: Schema<IMessage> = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderAvatar: { type: String },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: '' },
  messageType: { type: String, enum: ['text', 'image', 'video', 'voice'], default: 'text' },
  mediaData: { type: String },
  mediaMime: { type: String },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

// Index for faster queries
MessageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
