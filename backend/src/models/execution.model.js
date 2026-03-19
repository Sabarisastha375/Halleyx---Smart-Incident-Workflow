const mongoose = require('mongoose');

const ruleEvalSchema = new mongoose.Schema({
  rule_id: String,
  condition: String,
  result: Boolean,
  error: String
}, { _id: false });

const stepLogSchema = new mongoose.Schema({
  step_id: String,
  step_name: String,
  step_type: String,
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed', 'skipped', 'waiting_approval'] },
  evaluated_rules: [ruleEvalSchema],
  selected_next_step: String,
  selected_next_step_id: String,
  approver_id: String,
  approval_action: { type: String, enum: ['approved', 'rejected', null], default: null },
  error_message: String,
  iteration: { type: Number, default: 0 },
  metadata: mongoose.Schema.Types.Mixed,
  started_at: Date,
  ended_at: Date
}, { _id: false });

const executionSchema = new mongoose.Schema({
  workflow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  workflow_name: String,
  workflow_version: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'canceled', 'waiting_approval'],
    default: 'pending'
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  logs: [stepLogSchema],
  current_step_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', default: null },
  current_step_name: String,
  retries: { type: Number, default: 0 },
  triggered_by: { type: String, default: 'user' },
  loop_iterations: { type: Map, of: Number, default: {} },
  started_at: Date,
  ended_at: Date
}, { timestamps: true });

executionSchema.index({ workflow_id: 1, status: 1 });
executionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Execution', executionSchema);
