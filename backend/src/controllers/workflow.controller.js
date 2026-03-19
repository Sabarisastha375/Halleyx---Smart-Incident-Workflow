const Workflow = require('../models/workflow.model');
const Step = require('../models/step.model');
const Rule = require('../models/rule.model');

// GET /api/workflows
exports.listWorkflows = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const query = {};
    if (search) query.$text = { $search: search };
    if (status === 'active') query.is_active = true;
    if (status === 'inactive') query.is_active = false;

    const total = await Workflow.countDocuments(query);
    const workflows = await Workflow.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Attach step counts
    const workflowsWithCounts = await Promise.all(workflows.map(async (w) => {
      const stepCount = await Step.countDocuments({ workflow_id: w._id });
      return { ...w.toObject(), step_count: stepCount };
    }));

    res.json({ data: workflowsWithCounts, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/workflows
exports.createWorkflow = async (req, res) => {
  try {
    const { name, description, input_schema, tags } = req.body;
    const workflow = new Workflow({ name, description, input_schema, tags });
    await workflow.save();
    res.status(201).json(workflow);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/workflows/:id
exports.getWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const steps = await Step.find({ workflow_id: workflow._id }).sort({ order: 1 });
    const stepsWithRules = await Promise.all(steps.map(async (step) => {
      const rules = await Rule.find({ step_id: step._id }).sort({ priority: 1 });
      return { ...step.toObject(), rules };
    }));

    res.json({ ...workflow.toObject(), steps: stepsWithRules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/workflows/:id
exports.updateWorkflow = async (req, res) => {
  try {
    const { name, description, input_schema, is_active, start_step_id, tags } = req.body;
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    workflow.name = name ?? workflow.name;
    workflow.description = description ?? workflow.description;
    workflow.is_active = is_active ?? workflow.is_active;
    workflow.tags = tags ?? workflow.tags;
    if (input_schema) workflow.input_schema = input_schema;
    if (start_step_id) workflow.start_step_id = start_step_id;
    workflow.version += 1;

    await workflow.save();
    res.json(workflow);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/workflows/:id
exports.deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const steps = await Step.find({ workflow_id: workflow._id });
    for (const step of steps) {
      await Rule.deleteMany({ step_id: step._id });
    }
    await Step.deleteMany({ workflow_id: workflow._id });
    await Workflow.findByIdAndDelete(req.params.id);

    res.json({ message: 'Workflow deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/workflows/:id/duplicate
exports.duplicateWorkflow = async (req, res) => {
  try {
    const original = await Workflow.findById(req.params.id);
    if (!original) return res.status(404).json({ error: 'Workflow not found' });

    const clone = new Workflow({
      name: `${original.name} (Copy)`,
      description: original.description,
      input_schema: original.input_schema,
      version: 1,
      is_active: false,
      tags: original.tags
    });
    await clone.save();

    // Clone steps and rules
    const steps = await Step.find({ workflow_id: original._id }).sort({ order: 1 });
    const stepIdMap = {};

    for (const step of steps) {
      const newStep = new (require('../models/step.model'))({
        workflow_id: clone._id,
        name: step.name,
        step_type: step.step_type,
        order: step.order,
        metadata: step.metadata,
        loop_config: step.loop_config
      });
      await newStep.save();
      stepIdMap[step._id.toString()] = newStep._id;
    }

    // Clone rules with updated step references
    for (const step of steps) {
      const rules = await Rule.find({ step_id: step._id });
      for (const rule of rules) {
        const newRule = new Rule({
          step_id: stepIdMap[step._id.toString()],
          condition: rule.condition,
          next_step_id: rule.next_step_id ? stepIdMap[rule.next_step_id.toString()] : null,
          priority: rule.priority,
          description: rule.description,
          is_default: rule.is_default
        });
        await newRule.save();
      }
    }

    // Set start_step_id on clone
    if (original.start_step_id) {
      clone.start_step_id = stepIdMap[original.start_step_id.toString()] || null;
      await clone.save();
    }

    res.status(201).json(clone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
