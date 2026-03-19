const mongoose = require('mongoose');

const inputSchemaFieldSchema = new mongoose.Schema({
  type: { type: String, enum: ['string', 'number', 'boolean'], required: true },
  required: { type: Boolean, default: false },
  allowed_values: [String],
  description: String
}, { _id: false });

const workflowSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  version: { type: Number, default: 1 },
  is_active: { type: Boolean, default: true },
  input_schema: { type: Map, of: inputSchemaFieldSchema, default: {} },
  start_step_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', default: null },
  created_by: { type: String, default: 'system' },
  tags: [String]
}, { timestamps: true });

workflowSchema.index({ name: 'text' });
workflowSchema.index({ is_active: 1 });

module.exports = mongoose.model('Workflow', workflowSchema);
