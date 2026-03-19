const Step = require('../models/step.model');
const Rule = require('../models/rule.model');
const Workflow = require('../models/workflow.model');

// POST /api/workflows/:workflow_id/steps
exports.addStep = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.workflow_id);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const { name, step_type, order, metadata, loop_config } = req.body;
    const stepCount = await Step.countDocuments({ workflow_id: workflow._id });

    const step = new Step({
      workflow_id: workflow._id,
      name, step_type,
      order: order ?? stepCount + 1,
      metadata: metadata || {},
      loop_config: loop_config || {}
    });
    await step.save();

    // Auto-set start_step_id if first step
    if (!workflow.start_step_id) {
      workflow.start_step_id = step._id;
      await workflow.save();
    }

    res.status(201).json(step);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/workflows/:workflow_id/steps
exports.listSteps = async (req, res) => {
  try {
    const steps = await Step.find({ workflow_id: req.params.workflow_id }).sort({ order: 1 });
    const stepsWithRules = await Promise.all(steps.map(async (step) => {
      const rules = await Rule.find({ step_id: step._id }).sort({ priority: 1 });
      return { ...step.toObject(), rules };
    }));
    res.json(stepsWithRules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/steps/:id
exports.updateStep = async (req, res) => {
  try {
    const step = await Step.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!step) return res.status(404).json({ error: 'Step not found' });
    res.json(step);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/steps/:id
exports.deleteStep = async (req, res) => {
  try {
    const step = await Step.findById(req.params.id);
    if (!step) return res.status(404).json({ error: 'Step not found' });

    await Rule.deleteMany({ step_id: step._id });
    await Step.findByIdAndDelete(req.params.id);

    // If this was start_step, update workflow
    const workflow = await Workflow.findById(step.workflow_id);
    if (workflow && workflow.start_step_id?.toString() === req.params.id) {
      const nextStep = await Step.findOne({ workflow_id: workflow._id }).sort({ order: 1 });
      workflow.start_step_id = nextStep?._id || null;
      await workflow.save();
    }

    res.json({ message: 'Step deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/steps/reorder
exports.reorderSteps = async (req, res) => {
  try {
    const { steps } = req.body; // [{id, order}]
    for (const { id, order } of steps) {
      await Step.findByIdAndUpdate(id, { order });
    }
    res.json({ message: 'Steps reordered' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
