import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  type:        { type: String, enum: ['Resume', 'Cover Letter', 'Certificate', 'Offer Letter', 'Other'], default: 'Resume' },
  version:     { type: String, default: 'v1.0' },
  url:         { type: String, default: '' }, // Supabase Storage public URL
  storagePath: { type: String, default: '' }, // Supabase Storage path for deletion
  size:        { type: String, default: '' }, // human-readable e.g. "234 KB"
  mimeType:    { type: String, default: '' },
  uploadedAt:  { type: String, default: () => new Date().toISOString().split('T')[0] },
  createdAt:   { type: Date, default: Date.now },
});

export const Document = mongoose.model('Document', documentSchema);
