const mongoose = require('mongoose');

const executionLogSchema = new mongoose.Schema(
  {
    executionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Execution',
      required: [true, 'Execution ID is required'],
    },
    stepName: {
      type: String,
      required: true,
    },
    stepType: {
      type: String,
      required: true,
    },
    aiSuggestion: {
      type: String,
      default: null,
    },
    loopCount: {
      type: Number,
      default: 0,
    },
    notificationType: {
      type: String,
      default: null,
    },
    notificationMessage: {
      type: String,
      default: null,
    },
    evaluatedRules: {
      type: [
        {
          ruleId: mongoose.Schema.Types.ObjectId,
          condition: String,
          priority: Number,
          result: Boolean,
          isDefault: Boolean,
        },
      ],
      default: [],
    },
    selectedNextStep: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'started', 'completed', 'failed', 'skipped', 'waiting_approval'],
      default: 'started',
    },
    approverId: {
      type: String,
      default: null,
    },
    approval_action: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

executionLogSchema.index({ executionId: 1, createdAt: -1 });

module.exports = mongoose.model('ExecutionLog', executionLogSchema);
