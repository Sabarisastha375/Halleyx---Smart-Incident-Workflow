const express = require('express');
const router = express.Router();
const {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  simulateWorkflow,
  predictWorkflow,
} = require('../controllers/workflowController');
const { createStep, getSteps, setStartStep } = require('../controllers/stepController');
const { startExecution } = require('../controllers/executionController');

router.route('/').get(getWorkflows).post(createWorkflow);
router.route('/:id').get(getWorkflow).put(updateWorkflow).delete(deleteWorkflow);

// Nested step routes
router.route('/:workflowId/steps').get(getSteps).post(createStep);
router.route('/:workflowId/steps/start').put(setStartStep);

// Execution trigger
router.post('/:workflowId/execute', startExecution);

// Simulation and Prediction
router.post('/:id/simulate', simulateWorkflow);
router.post('/:id/predict', predictWorkflow);

module.exports = router;
