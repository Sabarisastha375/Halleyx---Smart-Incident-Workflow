const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema(
  {
    stepId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Step',
      required: [true, 'Step ID is required'],
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      trim: true,
    },
    nextStepId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Step',
      default: null,
    },
    priority: {
      type: Number,
      required: [true, 'Priority is required'],
      min: [1, 'Priority must be at least 1'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for priority ordering
ruleSchema.index({ stepId: 1, priority: 1 });

module.exports = mongoose.model('Rule', ruleSchema);
