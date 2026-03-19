const express = require('express');
const router = express.Router();
const { updateStep, deleteStep, reorderSteps } = require('../controllers/stepController');

// Step-level operations
router.route('/steps/reorder').put(reorderSteps);
router.route('/steps/:id').put(updateStep).delete(deleteStep);

module.exports = router;
