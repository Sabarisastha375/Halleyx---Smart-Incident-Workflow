const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: [true, 'Workflow ID is required'],
    },
    workflowVersion: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in_progress', 'completed', 'failed', 'canceled', 'waiting_approval'],
        message: 'Invalid execution status',
      },
      default: 'pending',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    aiSuggestion: {
      type: String,
      default: null,
    },
    loopCount: {
      type: Number,
      default: 0,
    },
    maxLoop: {
      type: Number,
      default: 5,
    },
    currentStepId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Step',
      default: null,
    },
    current_step_name: {
      type: String,
      default: null,
    },
    retries: {
      type: Number,
      default: 0,
    },
    triggeredBy: {
      type: String,
      default: 'system',
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast queries
executionSchema.index({ workflowId: 1, status: 1 });
executionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Execution', executionSchema);
