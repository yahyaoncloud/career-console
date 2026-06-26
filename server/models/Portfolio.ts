import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  resume: { type: mongoose.Schema.Types.Mixed },
  portfolio: { type: mongoose.Schema.Types.Mixed },
  documents: { type: mongoose.Schema.Types.Mixed },
});

export const PortfolioData = mongoose.model('PortfolioData', portfolioSchema);
