import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.warn('[MongoDB] MONGO_URI not found in env, using local memory if fallback allowed, otherwise it will fail.');
    }
    await mongoose.connect(uri || 'mongodb://localhost:27017/portfolio');
    console.log('[MongoDB] Connected Successfully');
  } catch (error) {
    console.error('[MongoDB] Connection Failed:', error);
    process.exit(1);
  }
};
