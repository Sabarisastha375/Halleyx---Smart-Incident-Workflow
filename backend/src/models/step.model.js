const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  workflow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  name: { type: String, required: true, trim: true },
  step_type: { type: String, enum: ['task', 'approval', 'notification'], required: true },
  order: { type: Number, default: 0 },
  metadata: {
    assignee_email: String,
    channel: { type: String, enum: ['slack', 'email', 'ui', 'pagerduty'], default: 'ui' },
    template: String,
    instructions: String,
    sla_minutes: { type: Number, default: 30 },
    retry_count: { type: Number, default: 0 },
    retry_interval_minutes: { type: Number, default: 5 },
    auto_approve: { type: Boolean, default: false }
  },
  loop_config: {
    enabled: { type: Boolean, default: false },
    max_iterations: { type: Number, default: 3 },
    loop_back_to_step_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', default: null },
    break_condition: String
  }
}, { timestamps: true });

stepSchema.index({ workflow_id: 1, order: 1 });

module.exports = mongoose.model('Step', stepSchema);
