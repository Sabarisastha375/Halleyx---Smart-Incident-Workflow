const Step = require('../models/Step');
const Rule = require('../models/Rule');
const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const { evaluateRules } = require('../ruleEngine/ruleEngine');
const { validateInput } = require('../middleware/inputValidator');

/**
 * AI-Based Decision Suggestion
 */
const suggestNextStep = (data) => {
  if (!data) return 'Log Incident';
  if (data.severity === 'High') return 'Notify DevOps';
  if (data.severity === 'Medium') return 'Assign Engineer';
  return 'Log Incident';
};

/**
 * Multi-Channel Notification
 */
const sendNotification = (type, message) => {
  if (type === 'email') console.log('Email:', message);
  else if (type === 'sms') console.log('SMS:', message);
  else if (type === 'in_app') console.log('In-App:', message);
  else console.log('Notification:', message);
};

/**
 * Workflow Execution Engine
 * Orchestrates the full execution lifecycle of a workflow.
 */

/**
 * Execute a workflow from start to finish.
 * @param {Object} workflow - Mongoose Workflow document
 * @param {Object} inputData - Execution input data
 * @param {string} triggeredBy - User or system that triggered execution
 * @returns {Object} - Final execution record
 */
const executeWorkflow = async (workflow, inputData, triggeredBy = 'system', existingExecution = null) => {
  // 1. Validate input schema
  const { valid, errors } = validateInput(workflow.inputSchema, inputData);
  if (!valid) {
    throw new Error(`Input validation failed: ${errors.join('; ')}`);
  }

  // 2. Create execution record
  const execution = existingExecution || await Execution.create({
    workflowId: workflow._id,
    workflowVersion: workflow.version,
    status: 'in_progress',
    data: inputData,
    triggeredBy,
    startedAt: new Date(),
    currentStepId: workflow.startStepId,
  });

  try {
    let currentStepId = execution.currentStepId;
    let iterationCount = 0;
    const MAX_ITERATIONS = 50; // Safety guard against infinite loops
    let currentLoopCount = execution.loopCount || 0;
    const maxLoop = execution.maxLoop !== undefined ? execution.maxLoop : 5;
    const stepVisits = {};

    while (currentStepId && iterationCount < MAX_ITERATIONS) {
      iterationCount++;

      // 3. Load current step
      const step = await Step.findById(currentStepId);
      if (!step) {
        throw new Error(`Step not found: ${currentStepId}`);
      }

      stepVisits[currentStepId] = (stepVisits[currentStepId] || 0) + 1;
      if (stepVisits[currentStepId] > 1) {
        currentLoopCount++;
        execution.loopCount = currentLoopCount;
        await Execution.findByIdAndUpdate(execution._id, { loopCount: currentLoopCount });
      }

      const aiSuggestion = suggestNextStep(inputData);
      if (iterationCount === 1) {
        execution.aiSuggestion = aiSuggestion;
        await Execution.findByIdAndUpdate(execution._id, { aiSuggestion });
      }

      if (currentLoopCount > maxLoop) {
        throw new Error(`Execution exceeded maximum loop count (${maxLoop})`);
      }

      // Update execution to reflect current step
      await Execution.findByIdAndUpdate(execution._id, { 
        currentStepId: step._id,
        current_step_name: step.name
      });
      execution.current_step_name = step.name;

      let notificationType = null;
      let notificationMessage = null;
      if (step.stepType === 'notification' && step.metadata) {
        notificationType = step.metadata.type || 'email';
        notificationMessage = step.metadata.message || 'Default system notification message';
      }

      // 4. Create log entry for step pending
      const log = await ExecutionLog.create({
        executionId: execution._id,
        stepName: step.name,
        stepType: step.stepType,
        aiSuggestion,
        loopCount: currentLoopCount,
        notificationType,
        notificationMessage,
        status: 'pending',
        startedAt: new Date(),
      });

      // Delay 1 second as 'pending'
      await simulateDelay(1000);

      // Update to 'in_progress'
      await ExecutionLog.findByIdAndUpdate(log._id, { status: 'in_progress' });

      // Pause if this is an approval step
      if (step.stepType === 'approval') {
        await Execution.findByIdAndUpdate(execution._id, { status: 'waiting_approval' });
        await ExecutionLog.findByIdAndUpdate(log._id, { status: 'waiting_approval' });
        return execution;
      }

      // 5. Execute the step (step-type based logic)
      await executeStep(step, inputData);

      // Delay 1 second to make step execution visible
      await simulateDelay(1000);

      // 6. Load and evaluate rules for this step
      const rules = await Rule.find({ stepId: step._id }).sort({ priority: 1 });
      const { matchedRule, evaluationResults } = evaluateRules(rules, inputData);

      const selectedNextStep = matchedRule
        ? await getStepName(matchedRule.nextStepId)
        : 'END';

      // 7. Update the log entry
      await ExecutionLog.findByIdAndUpdate(log._id, {
        evaluatedRules: evaluationResults,
        selectedNextStep,
        status: 'completed',
        endedAt: new Date(),
      });

      // 8. Move to next step
      currentStepId = matchedRule ? matchedRule.nextStepId : null;
    }

    if (iterationCount >= MAX_ITERATIONS) {
      throw new Error('Workflow exceeded maximum step iterations — possible infinite loop detected');
    }

    // 9. Mark execution complete
    const completedExecution = await Execution.findByIdAndUpdate(
      execution._id,
      { status: 'completed', endedAt: new Date(), currentStepId: null },
      { new: true }
    );

    return completedExecution;
  } catch (error) {
    // Mark execution as failed
    await Execution.findByIdAndUpdate(execution._id, {
      status: 'failed',
      endedAt: new Date(),
      errorMessage: error.message,
    });

    // Log the failure
    await ExecutionLog.create({
      executionId: execution._id,
      stepName: 'Engine',
      stepType: 'task',
      status: 'failed',
      errorMessage: error.message,
      startedAt: new Date(),
      endedAt: new Date(),
    });

    throw error;
  }
};

/**
 * Execute a single step based on its type.
 * In a real system, this would integrate with external services.
 */
const executeStep = async (step, data) => {
  switch (step.stepType) {
    case 'task':
      // Simulate automated task processing
      await simulateDelay(100);
      console.log(`[ENGINE] Executed task step: ${step.name}`);
      break;

    case 'approval':
      // In production: would send approval request to approver
      // For now, auto-approve if metadata.autoApprove is set
      await simulateDelay(100);
      console.log(`[ENGINE] Approval step triggered: ${step.name}`);
      break;

    case 'notification':
      // In production: would send email/Slack/PagerDuty notification
      await simulateDelay(100);
      const notifyType = step.metadata?.type || 'email';
      const notifyMsg = step.metadata?.message || 'Default system notification message';
      sendNotification(notifyType, notifyMsg);
      console.log(`[ENGINE] Notification sent for step: ${step.name}`);
      break;

    default:
      throw new Error(`Unknown step type: ${step.stepType}`);
  }
};

/**
 * Get step name by ID (helper for logging).
 */
const getStepName = async (stepId) => {
  if (!stepId) return 'END';
  const step = await Step.findById(stepId).select('name');
  return step ? step.name : 'Unknown';
};

/**
 * Simple delay simulation for step execution.
 */
const simulateDelay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Retry a failed execution from its last step.
 */
const retryExecution = async (executionId) => {
  const execution = await Execution.findById(executionId).populate('workflowId');
  if (!execution) throw new Error('Execution not found');
  if (execution.status !== 'failed') throw new Error('Only failed executions can be retried');

  await Execution.findByIdAndUpdate(executionId, {
    status: 'in_progress',
    retries: execution.retries + 1,
    errorMessage: null,
    endedAt: null,
    startedAt: new Date(),
  });

  return executeWorkflow(execution.workflowId, execution.data, execution.triggeredBy);
};

/**
 * Resume execution after approval
 */
const resumeExecution = async (executionId, action, approverId) => {
  const execution = await Execution.findById(executionId).populate('workflowId');
  if (!execution) throw new Error('Execution not found');
  if (execution.status !== 'waiting_approval') throw new Error('Execution is not waiting for approval');

  // Find the waiting log
  const log = await ExecutionLog.findOne({ 
    executionId, 
    status: 'waiting_approval' 
  }).sort({ createdAt: -1 });

  if (!log) throw new Error('Approval log not found');

  // Load and evaluate rules for that approval step
  const rules = await Rule.find({ stepId: execution.currentStepId }).sort({ priority: 1 });
  const { matchedRule, evaluationResults } = evaluateRules(rules, execution.data);

  const selectedNextStep = matchedRule
    ? await getStepName(matchedRule.nextStepId)
    : 'END';

  // Mark log as completed
  await ExecutionLog.findByIdAndUpdate(log._id, {
    evaluatedRules: evaluationResults,
    selectedNextStep,
    status: 'completed',
    endedAt: new Date(),
    approval_action: action,
    approverId
  });

  // Move to next step
  const nextStepId = matchedRule ? matchedRule.nextStepId : null;
  
  await Execution.findByIdAndUpdate(executionId, {
    status: 'in_progress',
    currentStepId: nextStepId
  });

  execution.status = 'in_progress';
  execution.currentStepId = nextStepId;

  // Resume workflow
  return executeWorkflow(execution.workflowId, execution.data, execution.triggeredBy, execution);
};

module.exports = { executeWorkflow, retryExecution, resumeExecution };
