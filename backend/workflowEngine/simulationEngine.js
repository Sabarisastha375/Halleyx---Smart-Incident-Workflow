const Step = require('../models/Step');
const Rule = require('../models/Rule');
const { evaluateRules } = require('../ruleEngine/ruleEngine');
const { validateInput } = require('../middleware/inputValidator');

/**
 * Simulate workflow execution without saving to database.
 * @param {Object} workflow - Workflow document
 * @param {Object} inputData - Execution data
 * @param {Number} maxLoop - Maximum allowed loop iterations
 * @returns {Promise<Array>} - Ordered list of steps
 */
const simulateWorkflow = async (workflow, inputData, maxLoop = 5) => {
  const simulation = [];
  let currentStepId = workflow.startStepId;
  let iterationCount = 0;
  const MAX_ITERATIONS = 50; 
  let currentLoopCount = 0;
  const stepVisits = {};

  if (!currentStepId) {
    simulation.push({ message: "Error: No starting step defined" });
    return simulation;
  }

  while (currentStepId && iterationCount < MAX_ITERATIONS) {
    iterationCount++;

    const step = await Step.findById(currentStepId);
    if (!step) {
      simulation.push({ message: `Error: Step not found (${currentStepId})` });
      break;
    }

    // Add to simulation log
    simulation.push({
      step_name: step.name,
      step_type: step.stepType
    });

    // Loop protection
    stepVisits[currentStepId] = (stepVisits[currentStepId] || 0) + 1;
    if (stepVisits[currentStepId] > 1) {
      currentLoopCount++;
    }

    if (currentLoopCount > maxLoop) {
      simulation.push({ message: "Simulation halted: Max loop count exceeded" });
      break;
    }

    // Evaluate rules for next step
    const rules = await Rule.find({ stepId: step._id }).sort({ priority: 1 });
    const { matchedRule } = evaluateRules(rules, inputData);

    currentStepId = matchedRule ? matchedRule.nextStepId : null;
  }

  if (iterationCount >= MAX_ITERATIONS) {
    simulation.push({ message: "Simulation halted: Maximum iterations reached" });
  } else if (!currentStepId) {
    simulation.push({ message: "Simulation Completed" });
  }

  return simulation;
};

/**
 * Predict failure or risk based on input data and workflow path.
 * @param {Object} workflow - Workflow document
 * @param {Object} inputData - Execution data
 * @returns {Promise<Object>} - Risk assessment
 */
const predictFailure = async (workflow, inputData) => {
  // 1. Check required fields
  const { valid, errors } = validateInput(workflow.inputSchema, inputData);
  if (!valid) {
    return {
      risk: "High risk of failure",
      reason: `Missing or invalid required fields: ${errors.join(', ')}`
    };
  }

  // 2. Check for Approval step in High severity incidents
  if (inputData.severity === 'High') {
    let currentStepId = workflow.startStepId;
    let foundApproval = false;
    let iterationCount = 0;
    const visited = new Set();

    while (currentStepId && iterationCount < 50 && !visited.has(currentStepId)) {
      visited.add(currentStepId);
      iterationCount++;

      const step = await Step.findById(currentStepId);
      if (!step) break;

      if (step.stepType === 'approval') {
        foundApproval = true;
        break;
      }

      const rules = await Rule.find({ stepId: step._id }).sort({ priority: 1 });
      const { matchedRule } = evaluateRules(rules, inputData);
      currentStepId = matchedRule ? matchedRule.nextStepId : null;
    }

    if (!foundApproval) {
      return {
        risk: "High risk of failure",
        reason: "No approver assigned for high severity incident"
      };
    }
  }

  return {
    risk: "Low risk",
    reason: "No immediate issues detected in workflow path"
  };
};

module.exports = { simulateWorkflow, predictFailure };
