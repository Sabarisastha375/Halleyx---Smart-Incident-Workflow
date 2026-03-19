const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: [true, 'Workflow ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Step name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    stepType: {
      type: String,
      enum: {
        values: ['task', 'approval', 'notification'],
        message: 'Step type must be task, approval, or notification',
      },
      required: [true, 'Step type is required'],
    },
    order: {
      type: Number,
      required: [true, 'Step order is required'],
      min: [0, 'Order must be non-negative'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient ordering
stepSchema.index({ workflowId: 1, order: 1 });

module.exports = mongoose.model('Step', stepSchema);
