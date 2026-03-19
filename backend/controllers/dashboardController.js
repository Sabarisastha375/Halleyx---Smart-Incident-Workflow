const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');

/**
 * GET /api/dashboard/stats
 * Returns summary statistics for the dashboard.
 */
const getStats = async (req, res, next) => {
  try {
    const [
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      statusCounts,
      recentExecutions,
    ] = await Promise.all([
      Workflow.countDocuments(),
      Workflow.countDocuments({ isActive: true }),
      Execution.countDocuments(),
      Execution.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Execution.find()
        .populate('workflowId', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Build status map
    const byStatus = { pending: 0, in_progress: 0, completed: 0, failed: 0, canceled: 0 };
    statusCounts.forEach((s) => { byStatus[s._id] = s.count; });

    const successRate = totalExecutions
      ? Math.round((byStatus.completed / totalExecutions) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        successRate,
        byStatus,
        recentExecutions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
