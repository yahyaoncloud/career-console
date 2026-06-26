import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  event: { type: String, required: true },
  status: { type: String, enum: ['SUCCESS', 'WARNING', 'ERROR', 'INFO'], required: true },
  module: { type: String, required: true },
});

export const Log = mongoose.model('Log', logSchema);
