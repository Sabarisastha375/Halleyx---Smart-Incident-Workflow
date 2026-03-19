const express = require('express');
const router = express.Router();
const {
  getExecutions,
  getExecution,
  cancelExecution,
  retryExecution,
  approveExecution,
  rejectExecution,
} = require('../controllers/executionController');

router.get('/executions', getExecutions);
router.get('/executions/:id', getExecution);
router.post('/executions/:id/cancel', cancelExecution);
router.post('/executions/:id/retry', retryExecution);
router.post('/executions/:id/approve', approveExecution);
router.post('/executions/:id/reject', rejectExecution);

module.exports = router;
