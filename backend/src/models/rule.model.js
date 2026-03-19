const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  step_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', required: true },
  condition: { type: String, required: true },
  next_step_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', default: null },
  priority: { type: Number, default: 99 },
  description: { type: String, default: '' },
  is_default: { type: Boolean, default: false }
}, { timestamps: true });

ruleSchema.index({ step_id: 1, priority: 1 });

module.exports = mongoose.model('Rule', ruleSchema);
