const Execution = require('../models/execution.model');
const executionService = require('../services/execution.service');

// POST /api/workflows/:workflow_id/execute
exports.startExecution = async (req, res) => {
  try {
    const { data, triggered_by } = req.body;
    const execution = await executionService.startExecution(
      req.params.workflow_id,
      data || {},
      triggered_by || 'user'
    );
    res.status(201).json(execution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/executions
exports.listExecutions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, workflow_id } = req.query;
    const query = {};
    if (status) query.status = status;
    if (workflow_id) query.workflow_id = workflow_id;

    const total = await Execution.countDocuments(query);
    const executions = await Execution.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('workflow_id', 'name');

    res.json({ data: executions, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/executions/:id
exports.getExecution = async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id).populate('workflow_id', 'name version');
    if (!execution) return res.status(404).json({ error: 'Execution not found' });
    res.json(execution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/executions/:id/cancel
exports.cancelExecution = async (req, res) => {
  try {
    const execution = await executionService.cancelExecution(req.params.id);
    res.json(execution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/executions/:id/retry
exports.retryExecution = async (req, res) => {
  try {
    const execution = await executionService.retryExecution(req.params.id);
    res.json(execution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/executions/:id/approve
exports.approveStep = async (req, res) => {
  try {
    const { approver_id } = req.body;
    await executionService.processApproval(req.params.id, 'approved', approver_id || 'user');
    const execution = await Execution.findById(req.params.id);
    res.json(execution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/executions/:id/reject
exports.rejectStep = async (req, res) => {
  try {
    const { approver_id } = req.body;
    await executionService.processApproval(req.params.id, 'rejected', approver_id || 'user');
    const execution = await Execution.findById(req.params.id);
    res.json(execution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/executions/stats
exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, active, completed, failed, todayExecs] = await Promise.all([
      Execution.countDocuments(),
      Execution.countDocuments({ status: { $in: ['in_progress', 'waiting_approval'] } }),
      Execution.countDocuments({ status: 'completed' }),
      Execution.countDocuments({ status: 'failed' }),
      Execution.countDocuments({ createdAt: { $gte: today } })
    ]);

    const severityBreakdown = await Execution.aggregate([
      { $group: { _id: '$data.severity', count: { $sum: 1 } } }
    ]);

    const recentFailed = await Execution.find({ status: 'failed' })
      .sort({ createdAt: -1 }).limit(5).select('workflow_name status started_at');

    res.json({ total, active, completed, failed, today: todayExecs, severityBreakdown, recentFailed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
