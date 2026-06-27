import mongoose from 'mongoose';

const learningTopicSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  description: { type: String, required: true },
  action: { type: String, required: true },
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  createdAt: { type: Date, default: Date.now, expires: 2592000 } // 30 days retention
});

export const LearningTopic = mongoose.models.LearningTopic || mongoose.model('LearningTopic', learningTopicSchema);
