const Rule = require('../models/Rule');
const Step = require('../models/Step');

/**
 * @route   POST /api/steps/:stepId/rules
 */
const createRule = async (req, res, next) => {
  try {
    const { stepId } = req.params;

    const step = await Step.findById(stepId);
    if (!step) {
      res.status(404);
      throw new Error('Step not found');
    }

    const rule = await Rule.create({ ...req.body, stepId });
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/steps/:stepId/rules
 */
const getRules = async (req, res, next) => {
  try {
    const { stepId } = req.params;
    const rules = await Rule.find({ stepId })
      .populate('nextStepId', 'name stepType')
      .sort({ priority: 1 });
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/rules/:id
 */
const updateRule = async (req, res, next) => {
  try {
    const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!rule) {
      res.status(404);
      throw new Error('Rule not found');
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/rules/:id
 */
const deleteRule = async (req, res, next) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) {
      res.status(404);
      throw new Error('Rule not found');
    }
    res.json({ success: true, message: 'Rule deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/rules/reorder
 */
const reorderRules = async (req, res, next) => {
  try {
    const { rules } = req.body; // Array of { id, priority }

    if (!Array.isArray(rules)) {
      res.status(400);
      throw new Error('Invalid rules data');
    }

    const operations = rules.map((r) => ({
      updateOne: {
        filter: { _id: r.id },
        update: { $set: { priority: r.priority } },
      },
    }));

    await Rule.bulkWrite(operations);

    res.json({ success: true, message: 'Rules reordered successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRule, getRules, updateRule, deleteRule, reorderRules };
