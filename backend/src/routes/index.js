const express = require('express');
const router = express.Router();

const workflowCtrl = require('../controllers/workflow.controller');
const stepCtrl = require('../controllers/step.controller');
const ruleCtrl = require('../controllers/rule.controller');
const executionCtrl = require('../controllers/execution.controller');
const aiCtrl = require('../controllers/ai.controller');

// ── Workflow Routes ─────────────────────────────────────────
router.get('/workflows', workflowCtrl.listWorkflows);
router.post('/workflows', workflowCtrl.createWorkflow);
router.get('/workflows/:id', workflowCtrl.getWorkflow);
router.put('/workflows/:id', workflowCtrl.updateWorkflow);
router.delete('/workflows/:id', workflowCtrl.deleteWorkflow);
router.post('/workflows/:id/duplicate', workflowCtrl.duplicateWorkflow);
router.post('/workflows/:workflow_id/execute', executionCtrl.startExecution);

// ── Step Routes ─────────────────────────────────────────────
router.get('/workflows/:workflow_id/steps', stepCtrl.listSteps);
router.post('/workflows/:workflow_id/steps', stepCtrl.addStep);
router.put('/steps/:id', stepCtrl.updateStep);
router.delete('/steps/:id', stepCtrl.deleteStep);
router.post('/steps/reorder', stepCtrl.reorderSteps);

// ── Rule Routes ─────────────────────────────────────────────
router.get('/steps/:step_id/rules', ruleCtrl.listRules);
router.post('/steps/:step_id/rules', ruleCtrl.addRule);
router.put('/rules/:id', ruleCtrl.updateRule);
router.delete('/rules/:id', ruleCtrl.deleteRule);
router.post('/rules/validate', ruleCtrl.validateRule);

// ── Execution Routes ────────────────────────────────────────
router.get('/executions/stats', executionCtrl.getStats);
router.get('/executions', executionCtrl.listExecutions);
router.get('/executions/:id', executionCtrl.getExecution);
router.post('/executions/:id/cancel', executionCtrl.cancelExecution);
router.post('/executions/:id/retry', executionCtrl.retryExecution);
router.post('/executions/:id/approve', executionCtrl.approveStep);
router.post('/executions/:id/reject', executionCtrl.rejectStep);

// ── AI Routes ───────────────────────────────────────────────
router.post('/ai/classify-incident', aiCtrl.classifyIncident);
router.post('/ai/suggest-workflow', aiCtrl.suggestWorkflow);
router.post('/ai/suggest-rules', aiCtrl.suggestRules);
router.post('/ai/analyze-execution', aiCtrl.analyzeExecution);
router.post('/ai/generate-rca', aiCtrl.generateRCA);
router.post('/ai/chat', aiCtrl.chat);

module.exports = router;
