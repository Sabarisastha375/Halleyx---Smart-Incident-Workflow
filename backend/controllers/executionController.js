const executionService = require('../services/executionService');

/**
 * @route   POST /api/workflows/:workflowId/execute
 */
const startExecution = async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const { data, triggeredBy } = req.body;

    const execution = await executionService.startExecution(
      workflowId,
      data || {},
      triggeredBy || 'api'
    );

    res.status(201).json({ success: true, data: execution });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @route   GET /api/executions
 */
const getExecutions = async (req, res, next) => {
  try {
    const { page, limit, workflowId, status } = req.query;
    const result = await executionService.getAllExecutions({ page, limit, workflowId, status });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/executions/:id
 */
const getExecution = async (req, res, next) => {
  try {
    const execution = await executionService.getExecution(req.params.id);
    res.json({ success: true, data: execution });
  } catch (error) {
    res.status(404);
    next(error);
  }
};

/**
 * @route   POST /api/executions/:id/cancel
 */
const cancelExecution = async (req, res, next) => {
  try {
    const execution = await executionService.cancelExecution(req.params.id);
    res.json({ success: true, data: execution });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @route   POST /api/executions/:id/retry
 */
const retryExecution = async (req, res, next) => {
  try {
    const execution = await executionService.retryExecutionService(req.params.id);
    res.json({ success: true, data: execution });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @route   POST /api/executions/:id/approve
 */
const approveExecution = async (req, res, next) => {
  try {
    const { approverId } = req.body;
    const execution = await executionService.approveExecution(req.params.id, approverId || 'system');
    res.json({ success: true, data: execution });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @route   POST /api/executions/:id/reject
 */
const rejectExecution = async (req, res, next) => {
  try {
    const { approverId } = req.body;
    const execution = await executionService.rejectExecution(req.params.id, approverId || 'system');
    res.json({ success: true, data: execution });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

module.exports = {
  startExecution,
  getExecutions,
  getExecution,
  cancelExecution,
  retryExecution,
  approveExecution,
  rejectExecution,
};
