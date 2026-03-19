const express = require('express');
const router = express.Router();
const { createRule, getRules, updateRule, deleteRule } = require('../controllers/ruleController');

// Rules nested under steps
router.route('/steps/:stepId/rules').get(getRules).post(createRule);
// Standalone rule operations
router.route('/rules/:id').put(updateRule).delete(deleteRule);

module.exports = router;
