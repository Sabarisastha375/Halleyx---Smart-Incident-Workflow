const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const { executeWorkflow, retryExecution } = require('../workflowEngine/workflowEngine');

/**
 * Trigger a new execution for a workflow.
 */
const startExecution = async (workflowId, inputData, triggeredBy = 'api') => {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) throw new Error('Workflow not found');
  if (!workflow.isActive) throw new Error('Workflow is not active');
  if (!workflow.startStepId) throw new Error('Workflow has no starting step defined');

  const execution = await executeWorkflow(workflow, inputData, triggeredBy);
  return execution;
};

/**
 * Get a single execution with its logs.
 */
const getExecution = async (executionId) => {
  const execution = await Execution.findById(executionId)
    .populate('workflowId', 'name version')
    .populate('currentStepId', 'name stepType');

  if (!execution) throw new Error('Execution not found');

  const logs = await ExecutionLog.find({ executionId }).sort({ startedAt: 1 });
  return { ...execution.toObject(), logs };
};

/**
 * Cancel a running execution.
 */
const cancelExecution = async (executionId) => {
  const execution = await Execution.findById(executionId);
  if (!execution) throw new Error('Execution not found');
  if (!['pending', 'in_progress'].includes(execution.status)) {
    throw new Error('Only pending or in_progress executions can be canceled');
  }

  const updated = await Execution.findByIdAndUpdate(
    executionId,
    { status: 'canceled', endedAt: new Date() },
    { new: true }
  );

  await ExecutionLog.create({
    executionId,
    stepName: 'System',
    stepType: 'task',
    status: 'skipped',
    errorMessage: 'Execution was manually canceled',
    startedAt: new Date(),
    endedAt: new Date(),
  });

  return updated;
};

/**
 * Approve a waiting execution step.
 */
const approveExecution = async (executionId, approverId) => {
  const { resumeExecution } = require('../workflowEngine/workflowEngine');
  return await resumeExecution(executionId, 'approved', approverId);
};

/**
 * Reject a waiting execution step.
 */
const rejectExecution = async (executionId, approverId) => {
  const execution = await Execution.findById(executionId);
  if (!execution) throw new Error('Execution not found');
  if (execution.status !== 'waiting_approval') {
    throw new Error('Execution is not waiting for approval');
  }

  const log = await ExecutionLog.findOne({ 
    executionId, 
    status: 'waiting_approval' 
  }).sort({ createdAt: -1 });

  if (log) {
    await ExecutionLog.findByIdAndUpdate(log._id, {
      status: 'failed',
      endedAt: new Date(),
      approval_action: 'rejected',
      approverId,
      errorMessage: 'Step was rejected by user'
    });
  }

  const updated = await Execution.findByIdAndUpdate(
    executionId,
    { status: 'failed', endedAt: new Date(), errorMessage: 'Step was rejected by user', currentStepId: null },
    { new: true }
  );

  return updated;
};

/**
 * Retry a failed execution.
 */
const retryExecutionService = async (executionId) => {
  return await retryExecution(executionId);
};

/**
 * Get all executions with pagination.
 */
const getAllExecutions = async ({ page = 1, limit = 10, workflowId, status }) => {
  const query = {};
  if (workflowId) query.workflowId = workflowId;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [executions, total] = await Promise.all([
    Execution.find(query)
      .populate('workflowId', 'name')
      .populate('currentStepId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Execution.countDocuments(query),
  ]);

  return {
    executions,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  startExecution,
  getExecution,
  cancelExecution,
  retryExecutionService,
  getAllExecutions,
  approveExecution,
  rejectExecution,
};
