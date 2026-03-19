const Workflow = require('../models/Workflow');
const Step = require('../models/Step');

/**
 * Get all workflows with step counts and pagination.
 */
const getAllWorkflows = async ({ page = 1, limit = 10, search = '' }) => {
  const query = {};
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const [workflows, total] = await Promise.all([
    Workflow.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Workflow.countDocuments(query),
  ]);

  // Attach step counts
  const workflowIds = workflows.map((w) => w._id);
  const stepCounts = await Step.aggregate([
    { $match: { workflowId: { $in: workflowIds } } },
    { $group: { _id: '$workflowId', count: { $sum: 1 } } },
  ]);

  const stepCountMap = {};
  stepCounts.forEach((s) => {
    stepCountMap[s._id.toString()] = s.count;
  });

  const enriched = workflows.map((w) => ({
    ...w.toObject(),
    stepCount: stepCountMap[w._id.toString()] || 0,
  }));

  return {
    workflows: enriched,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single workflow with its full step list.
 */
const getWorkflowById = async (id) => {
  const workflow = await Workflow.findById(id);
  if (!workflow) throw new Error('Workflow not found');

  const steps = await Step.find({ workflowId: id }).sort({ order: 1 });
  return { ...workflow.toObject(), steps };
};

/**
 * Create a new workflow.
 */
const createWorkflow = async (data) => {
  const workflow = await Workflow.create(data);
  return workflow;
};

/**
 * Update a workflow. Bumps version on schema change.
 */
const updateWorkflow = async (id, data) => {
  const existing = await Workflow.findById(id);
  if (!existing) throw new Error('Workflow not found');

  // Bump version if inputSchema changes
  if (data.inputSchema) {
    data.version = existing.version + 1;
  }

  const updated = await Workflow.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  return updated;
};

/**
 * Delete a workflow and its orphaned steps.
 */
const deleteWorkflow = async (id) => {
  const workflow = await Workflow.findById(id);
  if (!workflow) throw new Error('Workflow not found');
  await Step.deleteMany({ workflowId: id });
  await Workflow.findByIdAndDelete(id);
  return { message: 'Workflow and its steps deleted successfully' };
};

module.exports = {
  getAllWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
};
