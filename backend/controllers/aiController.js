const { generateWorkflow, getTemplates, INCIDENT_TEMPLATES } = require('../services/aiService');
const Workflow = require('../models/Workflow');
const Step = require('../models/Step');
const Rule = require('../models/Rule');

/**
 * POST /api/ai/generate
 * Generate a workflow definition from a description (preview only, not saved)
 */
const generate = async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description) {
      res.status(400);
      throw new Error('description is required');
    }
    const workflow = await generateWorkflow(description);
    res.json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/create
 * Generate AND immediately save workflow + steps + rules to the database
 */
const createFromAI = async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description) {
      res.status(400);
      throw new Error('description is required');
    }

    const generated = await generateWorkflow(description);

    // 1. Save workflow
    const workflow = await Workflow.create({
      name: generated.name,
      description: generated.description,
      version: 1,
      isActive: true,
      inputSchema: generated.inputSchema || {},
    });

    // 2. Save steps
    const savedSteps = [];
    for (const stepDef of generated.steps) {
      const step = await Step.create({
        workflowId: workflow._id,
        name: stepDef.name,
        stepType: stepDef.stepType,
        order: stepDef.order,
        metadata: stepDef.metadata || {},
      });
      savedSteps.push(step);
    }

    // 3. Set start step
    if (savedSteps.length > 0) {
      await Workflow.findByIdAndUpdate(workflow._id, { startStepId: savedSteps[0]._id });
    }

    // 4. Save rules (map stepIndex → saved step IDs)
    for (const ruleGroup of (generated.rules || [])) {
      const fromStep = savedSteps[ruleGroup.stepIndex];
      if (!fromStep) continue;

      for (const rule of ruleGroup.rules) {
        const nextStep = rule.nextStepIndex != null ? savedSteps[rule.nextStepIndex] : null;
        await Rule.create({
          stepId: fromStep._id,
          condition: rule.condition,
          nextStepId: nextStep ? nextStep._id : null,
          priority: rule.priority,
          isDefault: rule.isDefault || false,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Workflow "${workflow.name}" created with ${savedSteps.length} steps`,
      data: {
        workflowId: workflow._id,
        name: workflow.name,
        stepCount: savedSteps.length,
        source: generated._source,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/templates
 * Returns the list of available smart templates
 */
const listTemplates = (req, res) => {
  const templates = getTemplates();
  res.json({ success: true, data: templates });
};

/**
 * POST /api/ai/templates/:key/create
 * Instantly create a workflow from a named template
 */
const createFromTemplate = async (req, res, next) => {
  try {
    const { key } = req.params;
    const template = INCIDENT_TEMPLATES[key];
    if (!template) {
      res.status(404);
      throw new Error(`Template "${key}" not found`);
    }

    const workflow = await Workflow.create({
      name: template.name,
      description: template.description,
      version: 1,
      isActive: true,
      inputSchema: template.inputSchema,
    });

    const savedSteps = [];
    for (const stepDef of template.steps) {
      const step = await Step.create({ ...stepDef, workflowId: workflow._id });
      savedSteps.push(step);
    }
    if (savedSteps.length > 0) {
      await Workflow.findByIdAndUpdate(workflow._id, { startStepId: savedSteps[0]._id });
    }
    for (const ruleGroup of (template.rules || [])) {
      const fromStep = savedSteps[ruleGroup.stepIndex];
      if (!fromStep) continue;
      for (const rule of ruleGroup.rules) {
        const nextStep = rule.nextStepIndex != null ? savedSteps[rule.nextStepIndex] : null;
        await Rule.create({
          stepId: fromStep._id,
          condition: rule.condition,
          nextStepId: nextStep ? nextStep._id : null,
          priority: rule.priority,
          isDefault: rule.isDefault || false,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Workflow created from "${key}" template`,
      data: { workflowId: workflow._id, name: workflow.name, stepCount: savedSteps.length },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { generate, createFromAI, listTemplates, createFromTemplate };
