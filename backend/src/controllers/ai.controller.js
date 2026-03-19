const aiService = require('../services/ai.service');
const Workflow = require('../models/workflow.model');
const Execution = require('../models/execution.model');

// POST /api/ai/classify-incident
exports.classifyIncident = async (req, res) => {
  try {
    const { title, description } = req.body;
    const workflows = await Workflow.find({ is_active: true }).select('name');
    const workflowNames = workflows.map(w => w.name);
    const result = await aiService.classifyIncident(title, description, workflowNames);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/suggest-workflow
exports.suggestWorkflow = async (req, res) => {
  try {
    const { description } = req.body;
    const result = await aiService.suggestWorkflow(description);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/suggest-rules
exports.suggestRules = async (req, res) => {
  try {
    const { step_name, step_type, schema_fields, available_steps } = req.body;
    const result = await aiService.suggestRules(step_name, step_type, schema_fields, available_steps);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/analyze-execution
exports.analyzeExecution = async (req, res) => {
  try {
    const { execution_id } = req.body;
    const execution = await Execution.findById(execution_id);
    if (!execution) return res.status(404).json({ error: 'Execution not found' });
    const result = await aiService.generatePostMortem(execution);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/generate-rca
exports.generateRCA = async (req, res) => {
  try {
    const { execution_id } = req.body;
    const execution = await Execution.findById(execution_id);
    if (!execution) return res.status(404).json({ error: 'Execution not found' });
    const rca = await aiService.generateRCA(execution);
    res.json({ rca });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/chat
exports.chat = async (req, res) => {
  try {
    const { messages, context } = req.body;
    const reply = await aiService.chat(messages, context || {});
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
