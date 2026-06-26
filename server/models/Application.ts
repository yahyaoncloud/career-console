import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  company: { type: String, required: true },
  position: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Wishlist', 'Applied', 'Interviewing', 'Offered', 'Rejected'],
    default: 'Wishlist'
  },
  dateApplied: { type: String },
  salary: { type: String },
  location: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Application = mongoose.model('Application', applicationSchema);
