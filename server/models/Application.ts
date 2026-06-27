import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  company:        { type: String, required: true },
  position:       { type: String, required: true },
  location:       { type: String, default: '' },
  salary:         { type: String, default: '' },
  employmentType: { type: String, enum: ['Full-time', 'Contract', 'Part-time', 'Remote', 'Hybrid'], default: 'Full-time' },
  appliedDate:    { type: String, default: '' },
  deadline:       { type: String, default: '' },
  referral:       { type: String, default: '' },
  recruiter:      { type: String, default: '' },
  contact:        { type: String, default: '' },
  website:        { type: String, default: '' },
  priority:       { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: {
    type: String,
    enum: ['Wishlist', 'Applied', 'HR Screening', 'Technical', 'Manager Round', 'Final Round', 'Offer', 'Accepted', 'Rejected', 'Archived'],
    default: 'Wishlist'
  },
  interviewDate:  { type: String, default: '' },
  notes:          { type: String, default: '' },
  resumeUsed:     { type: String, default: '' },
  coverLetter:    { type: String, default: '' },
  tags:           { type: [String], default: [] },
  createdAt:      { type: Date, default: Date.now },
});

export const Application = mongoose.model('Application', applicationSchema);
