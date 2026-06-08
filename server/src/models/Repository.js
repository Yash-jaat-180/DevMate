import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  repoName: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  repoUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  defaultBranch: {
    type: String,
    default: 'main',
  },
  language: {
    type: String,
    default: '',
  },
  languages: {
    type: Map,
    of: Number,
    default: {},
  },
  stars: {
    type: Number,
    default: 0,
  },
  forks: {
    type: Number,
    default: 0,
  },
  fileCount: {
    type: Number,
    default: 0,
  },
  structure: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },

  // AI Summary Cache — generated on import
  summary: {
    projectSummary: { type: String, default: '' },
    techStack: [{ type: String }],
    importantFiles: [{ type: String }],
    architectureOverview: { type: String, default: '' },
  },

  // Source Code Cache — stored on import for offline AI context
  // Stores content of up to 50 important files (max 3000 chars each)
  contextFiles: [
    {
      path:    { type: String, required: true },
      content: { type: String, default: '' },
    },
  ],

  importedAt: {
    type: Date,
    default: Date.now,
  },
  lastAnalyzedAt: {
    type: Date,
    default: null,
  },
});

// Compound index: one user can't import the same repo twice
repositorySchema.index({ userId: 1, repoUrl: 1 }, { unique: true });

const Repository = mongoose.model('Repository', repositorySchema);
export default Repository;
