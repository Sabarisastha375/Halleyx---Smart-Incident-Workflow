const express = require('express');
const router = express.Router();
const {
  generate,
  createFromAI,
  listTemplates,
  createFromTemplate,
} = require('../controllers/aiController');

router.post('/generate', generate);
router.post('/create', createFromAI);
router.get('/templates', listTemplates);
router.post('/templates/:key/create', createFromTemplate);

module.exports = router;
