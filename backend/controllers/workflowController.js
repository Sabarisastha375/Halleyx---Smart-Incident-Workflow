const workflowService = require('../services/workflowService');
const { simulateWorkflow, predictFailure } = require('../workflowEngine/simulationEngine');
const Workflow = require('../models/Workflow');

/**
 * @route   GET /api/workflows
 * @desc    Get all workflows with pagination and search
 */
const getWorkflows = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await workflowService.getAllWorkflows({ page, limit, search });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/workflows/:id
 * @desc    Get workflow by ID with steps
 */
const getWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id);
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(404);
    next(error);
  }
};

/**
 * @route   POST /api/workflows
 * @desc    Create a new workflow
 */
const createWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowService.createWorkflow(req.body);
    res.status(201).json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/workflows/:id
 * @desc    Update workflow
 */
const updateWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.body);
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(404);
    next(error);
  }
};

/**
 * @route   DELETE /api/workflows/:id
 * @desc    Delete workflow and its steps
 */
const deleteWorkflow = async (req, res, next) => {
  try {
    const result = await workflowService.deleteWorkflow(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(404);
    next(error);
  }
};

/**
 * @route   POST /api/workflows/:id/simulate
 * @desc    Simulate workflow execution path
 */
const simulateWorkflowHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    const workflow = await Workflow.findById(id);
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });

    const simulation = await simulateWorkflow(workflow, data || {});
    res.json({ success: true, simulation });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/workflows/:id/predict
 * @desc    Predict workflow failure/risk
 */
const predictWorkflowHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    const workflow = await Workflow.findById(id);
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });

    const prediction = await predictFailure(workflow, data || {});
    res.json({ success: true, ...prediction });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  simulateWorkflow: simulateWorkflowHandler,
  predictWorkflow: predictWorkflowHandler,
};
