const express = require('express');
const router = express.Router();
const { updateStep, deleteStep } = require('../controllers/stepController');

// Step-level operations (by step ID)
router.route('/steps/:id').put(updateStep).delete(deleteStep);

module.exports = router;
