import mongoose from 'mongoose';

const guestbookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const Guestbook = mongoose.model('Guestbook', guestbookSchema);
