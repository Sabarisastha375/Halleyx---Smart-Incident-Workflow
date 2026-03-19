const Rule = require('../models/rule.model');
const ruleEngine = require('../services/rule-engine.service');

// POST /api/steps/:step_id/rules
exports.addRule = async (req, res) => {
  try {
    const { condition, next_step_id, priority, description } = req.body;
    const isDefault = condition?.trim().toUpperCase() === 'DEFAULT';

    const rule = new Rule({
      step_id: req.params.step_id,
      condition, next_step_id: next_step_id || null,
      priority: priority ?? 99,
      description: description || '',
      is_default: isDefault
    });
    await rule.save();
    res.status(201).json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/steps/:step_id/rules
exports.listRules = async (req, res) => {
  try {
    const rules = await Rule.find({ step_id: req.params.step_id }).sort({ priority: 1 });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/rules/:id
exports.updateRule = async (req, res) => {
  try {
    const { condition } = req.body;
    if (condition) {
      req.body.is_default = condition.trim().toUpperCase() === 'DEFAULT';
    }
    const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/rules/:id
exports.deleteRule = async (req, res) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json({ message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/rules/validate
exports.validateRule = async (req, res) => {
  try {
    const { condition } = req.body;
    const result = ruleEngine.validate(condition);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
