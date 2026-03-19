const Step = require('../models/Step');
const Workflow = require('../models/Workflow');

/**
 * @route   POST /api/workflows/:workflowId/steps
 */
const createStep = async (req, res, next) => {
  try {
    const { workflowId } = req.params;

    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      res.status(404);
      throw new Error('Workflow not found');
    }

    const step = await Step.create({ ...req.body, workflowId });

    // Set as start step if it's the first step
    if (!workflow.startStepId) {
      await Workflow.findByIdAndUpdate(workflowId, { startStepId: step._id });
    }

    res.status(201).json({ success: true, data: step });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/workflows/:workflowId/steps
 */
const getSteps = async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const steps = await Step.find({ workflowId }).sort({ order: 1 });
    res.json({ success: true, data: steps });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/steps/:id
 */
const updateStep = async (req, res, next) => {
  try {
    const step = await Step.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!step) {
      res.status(404);
      throw new Error('Step not found');
    }
    res.json({ success: true, data: step });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/steps/:id
 */
const deleteStep = async (req, res, next) => {
  try {
    const step = await Step.findById(req.params.id);
    if (!step) {
      res.status(404);
      throw new Error('Step not found');
    }

    // If this was the start step, clear it from the workflow
    await Workflow.updateOne(
      { startStepId: step._id },
      { $set: { startStepId: null } }
    );

    await Step.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Step deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/workflows/:workflowId/steps/reorder
 * Set startStepId on the workflow when steps are reordered.
 */
const setStartStep = async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const { startStepId } = req.body;

    const updated = await Workflow.findByIdAndUpdate(
      workflowId,
      { startStepId },
      { new: true }
    );
    if (!updated) {
      res.status(404);
      throw new Error('Workflow not found');
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/steps/reorder
 */
const reorderSteps = async (req, res, next) => {
  try {
    const { steps } = req.body; // Array of { id, order }

    if (!Array.isArray(steps)) {
      res.status(400);
      throw new Error('Invalid steps data');
    }

    const operations = steps.map((s) => ({
      updateOne: {
        filter: { _id: s.id },
        update: { $set: { order: s.order } },
      },
    }));

    await Step.bulkWrite(operations);

    res.json({ success: true, message: 'Steps reordered successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createStep, getSteps, updateStep, deleteStep, setStartStep, reorderSteps };
