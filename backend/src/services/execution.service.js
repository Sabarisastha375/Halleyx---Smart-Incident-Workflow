const Execution = require('../models/execution.model');
const Workflow = require('../models/workflow.model');
const Step = require('../models/step.model');
const Rule = require('../models/rule.model');
const ruleEngine = require('./rule-engine.service');

class ExecutionService {
  /**
   * Start a new workflow execution
   */
  async startExecution(workflowId, inputData, triggeredBy = 'user') {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) throw new Error('Workflow not found');
    if (!workflow.is_active) throw new Error('Workflow is not active');
    if (!workflow.start_step_id) throw new Error('Workflow has no start step defined');

    const execution = new Execution({
      workflow_id: workflowId,
      workflow_name: workflow.name,
      workflow_version: workflow.version,
      status: 'in_progress',
      data: inputData,
      triggered_by: triggeredBy,
      started_at: new Date(),
      current_step_id: workflow.start_step_id
    });

    await execution.save();

    // Run execution asynchronously
    this._runExecution(execution._id).catch(err => {
      console.error(`Execution ${execution._id} failed:`, err.message);
    });

    return execution;
  }

  /**
   * Core execution loop
   */
  async _runExecution(executionId) {
    const execution = await Execution.findById(executionId);
    if (!execution) return;

    let currentStepId = execution.current_step_id;
    const loopIterations = {};

    while (currentStepId) {
      // Reload execution to check for cancellation
      const freshExec = await Execution.findById(executionId);
      if (!freshExec || freshExec.status === 'canceled') return;

      const step = await Step.findById(currentStepId);
      if (!step) {
        await this._failExecution(executionId, `Step ${currentStepId} not found`);
        return;
      }

      // Handle loop iteration tracking
      const stepKey = currentStepId.toString();
      loopIterations[stepKey] = (loopIterations[stepKey] || 0) + 1;

      if (step.loop_config?.enabled) {
        const maxIter = step.loop_config.max_iterations || 3;
        if (loopIterations[stepKey] > maxIter) {
          await this._addLog(executionId, {
            step_id: stepKey,
            step_name: step.name,
            step_type: step.step_type,
            status: 'failed',
            error_message: `Max loop iterations (${maxIter}) reached`,
            started_at: new Date(),
            ended_at: new Date()
          });
          await Execution.findByIdAndUpdate(executionId, {
            status: 'failed',
            ended_at: new Date()
          });
          return;
        }
      }

      // For approval steps, pause and wait
      if (step.step_type === 'approval') {
        await Execution.findByIdAndUpdate(executionId, {
          status: 'waiting_approval',
          current_step_id: currentStepId,
          current_step_name: step.name,
          loop_iterations: loopIterations
        });

        await this._addLog(executionId, {
          step_id: stepKey,
          step_name: step.name,
          step_type: step.step_type,
          status: 'waiting_approval',
          iteration: loopIterations[stepKey],
          metadata: step.metadata,
          started_at: new Date()
        });
        return; // Will resume via approve/reject endpoint
      }

      // Execute the step
      const stepResult = await this._executeStep(step, freshExec.data, executionId, loopIterations[stepKey]);

      if (stepResult.status === 'failed') {
        await Execution.findByIdAndUpdate(executionId, {
          status: 'failed',
          ended_at: new Date(),
          current_step_name: step.name
        });
        return;
      }

      currentStepId = stepResult.nextStepId;

      await Execution.findByIdAndUpdate(executionId, {
        current_step_id: currentStepId || null,
        current_step_name: stepResult.nextStepName || null,
        loop_iterations: loopIterations
      });
    }

    // No more steps → completed
    await Execution.findByIdAndUpdate(executionId, {
      status: 'completed',
      ended_at: new Date(),
      current_step_id: null,
      current_step_name: null
    });
  }

  /**
   * Execute a single non-approval step
   */
  async _executeStep(step, data, executionId, iteration = 1) {
    const startedAt = new Date();
    const stepId = step._id.toString();

    // Get rules for this step
    const rules = await Rule.find({ step_id: step._id }).sort({ priority: 1 });
    const { evaluations, selectedRule } = ruleEngine.evaluateRules(rules, data);

    // Simulate task/notification execution (in production, call actual services)
    await this._simulateStepAction(step);

    let nextStepId = null;
    let nextStepName = null;

    if (selectedRule) {
      nextStepId = selectedRule.next_step_id;
      if (nextStepId) {
        const nextStep = await Step.findById(nextStepId);
        nextStepName = nextStep?.name || null;
      }
    }

    const endedAt = new Date();
    const logEntry = {
      step_id: stepId,
      step_name: step.name,
      step_type: step.step_type,
      status: rules.length > 0 && !selectedRule ? 'failed' : 'completed',
      evaluated_rules: evaluations,
      selected_next_step: nextStepName,
      selected_next_step_id: nextStepId?.toString(),
      error_message: (rules.length > 0 && !selectedRule) ? 'No matching rule found' : null,
      iteration,
      metadata: step.metadata,
      started_at: startedAt,
      ended_at: endedAt
    };

    await this._addLog(executionId, logEntry);

    if (logEntry.status === 'failed') {
      return { status: 'failed', nextStepId: null };
    }

    return { status: 'completed', nextStepId, nextStepName };
  }

  /**
   * Simulate step action (task/notification)
   */
  async _simulateStepAction(step) {
    // In production: send emails, call APIs, trigger webhooks, etc.
    await new Promise(resolve => setTimeout(resolve, 200));

    if (step.step_type === 'notification') {
      console.log(`📢 Notification sent via ${step.metadata?.channel || 'ui'}: ${step.metadata?.template || step.name}`);
    } else if (step.step_type === 'task') {
      console.log(`⚙️ Task executed: ${step.name}`);
    }
  }

  /**
   * Resume execution after approval action
   */
  async processApproval(executionId, action, approverId) {
    const execution = await Execution.findById(executionId);
    if (!execution) throw new Error('Execution not found');
    if (execution.status !== 'waiting_approval') throw new Error('Execution is not waiting for approval');

    const step = await Step.findById(execution.current_step_id);
    if (!step) throw new Error('Current step not found');

    const stepId = execution.current_step_id.toString();

    // Update the waiting_approval log entry
    await Execution.findByIdAndUpdate(executionId, {
      $set: {
        'logs.$[elem].status': action === 'approved' ? 'completed' : 'failed',
        'logs.$[elem].approval_action': action,
        'logs.$[elem].approver_id': approverId,
        'logs.$[elem].ended_at': new Date()
      }
    }, {
      arrayFilters: [{ 'elem.step_id': stepId, 'elem.status': 'waiting_approval' }]
    });

    if (action === 'rejected') {
      await Execution.findByIdAndUpdate(executionId, {
        status: 'failed',
        ended_at: new Date()
      });
      return;
    }

    // Get rules and determine next step
    const rules = await Rule.find({ step_id: step._id }).sort({ priority: 1 });
    const { evaluations, selectedRule } = ruleEngine.evaluateRules(rules, execution.data);

    // Append rule evaluations to log
    await Execution.findByIdAndUpdate(executionId, {
      $set: {
        'logs.$[elem].evaluated_rules': evaluations,
        'logs.$[elem].selected_next_step': selectedRule ? (await Step.findById(selectedRule.next_step_id))?.name : null,
        'logs.$[elem].selected_next_step_id': selectedRule?.next_step_id?.toString()
      }
    }, {
      arrayFilters: [{ 'elem.step_id': stepId }]
    });

    const nextStepId = selectedRule?.next_step_id || null;

    await Execution.findByIdAndUpdate(executionId, {
      status: 'in_progress',
      current_step_id: nextStepId
    });

    if (nextStepId) {
      const loopIter = execution.loop_iterations || {};
      this._runExecution(executionId).catch(console.error);
    } else {
      await Execution.findByIdAndUpdate(executionId, {
        status: 'completed',
        ended_at: new Date(),
        current_step_id: null
      });
    }
  }

  /**
   * Retry failed execution from current step
   */
  async retryExecution(executionId) {
    const execution = await Execution.findById(executionId);
    if (!execution) throw new Error('Execution not found');
    if (execution.status !== 'failed') throw new Error('Only failed executions can be retried');

    await Execution.findByIdAndUpdate(executionId, {
      status: 'in_progress',
      retries: (execution.retries || 0) + 1,
      ended_at: null
    });

    this._runExecution(executionId).catch(console.error);

    return Execution.findById(executionId);
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId) {
    const execution = await Execution.findById(executionId);
    if (!execution) throw new Error('Execution not found');
    if (['completed', 'failed', 'canceled'].includes(execution.status)) {
      throw new Error('Cannot cancel a finished execution');
    }

    return Execution.findByIdAndUpdate(executionId, {
      status: 'canceled',
      ended_at: new Date()
    }, { new: true });
  }

  async _addLog(executionId, logEntry) {
    await Execution.findByIdAndUpdate(executionId, {
      $push: { logs: logEntry }
    });
  }

  async _failExecution(executionId, message) {
    await Execution.findByIdAndUpdate(executionId, {
      status: 'failed',
      ended_at: new Date()
    });
  }
}

module.exports = new ExecutionService();
