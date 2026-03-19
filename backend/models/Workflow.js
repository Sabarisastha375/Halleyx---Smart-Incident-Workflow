const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    inputSchema: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    startStepId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Step',
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Workflow', workflowSchema);
