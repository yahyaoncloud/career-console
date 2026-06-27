import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name:       { type: String, required: true },
  website:    { type: String, default: '' },
  industry:   { type: String, default: '' },
  hq:         { type: String, default: '' },
  size:       { type: String, default: '' }, // e.g. "50-200", "1000+"
  status:     { type: String, enum: ['Target', 'Applied', 'Interviewing', 'Blacklisted', 'Tracking'], default: 'Tracking' },
  notes:      { type: String, default: '' },
  recruiter:  { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  linkedinUrl:  { type: String, default: '' },
  tags:       { type: [String], default: [] },
}, { timestamps: true });

export const Company = mongoose.model('Company', companySchema);
