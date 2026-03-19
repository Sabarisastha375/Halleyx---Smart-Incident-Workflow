const Anthropic = require('@anthropic-ai/sdk');

class AIService {
  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = 'claude-sonnet-4-20250514';
  }

  async _chat(systemPrompt, userMessage) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });
    return response.content[0].text;
  }

  /**
   * Classify an incident and suggest severity, type, workflow
   */
  async classifyIncident(title, description, availableWorkflows = []) {
    const system = `You are an expert IT incident classifier. Analyze incidents and return ONLY valid JSON with no markdown or explanation.
    
    Return exactly this structure:
    {
      "suggested_severity": "P1|P2|P3|P4",
      "suggested_type": "outage|degradation|security|data_loss|performance",
      "affected_system": "string",
      "recommended_workflow": "workflow name or null",
      "confidence": 0.0-1.0,
      "reasoning": "brief explanation",
      "suggested_input": {
        "severity": "P1",
        "incident_type": "outage",
        "affected_system": "payments",
        "region": "US-EAST",
        "priority": "High"
      }
    }`;

    const userMsg = `Incident Title: ${title}
Description: ${description}
Available Workflows: ${availableWorkflows.join(', ') || 'none'}

Classify this incident.`;

    try {
      const text = await this._chat(system, userMsg);
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (err) {
      return {
        suggested_severity: 'P2',
        suggested_type: 'degradation',
        affected_system: 'unknown',
        recommended_workflow: null,
        confidence: 0.5,
        reasoning: 'Could not classify automatically',
        suggested_input: {}
      };
    }
  }

  /**
   * Suggest a complete workflow from plain English description
   */
  async suggestWorkflow(description) {
    const system = `You are a workflow design expert. Generate a complete incident response workflow from a description.
    Return ONLY valid JSON with no markdown.
    
    Return exactly this structure:
    {
      "name": "workflow name",
      "description": "workflow description",
      "input_schema": {
        "field_name": {"type": "string|number|boolean", "required": true, "allowed_values": ["val1","val2"]}
      },
      "steps": [
        {
          "name": "Step Name",
          "step_type": "task|approval|notification",
          "order": 1,
          "metadata": {
            "channel": "slack|email|ui",
            "template": "message template",
            "assignee_email": "role@company.com",
            "sla_minutes": 30
          },
          "suggested_rules": [
            {"condition": "severity == 'P1'", "next_step": "Next Step Name", "priority": 1},
            {"condition": "DEFAULT", "next_step": null, "priority": 99}
          ]
        }
      ]
    }`;

    try {
      const text = await this._chat(system, `Create a workflow for: ${description}`);
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (err) {
      return null;
    }
  }

  /**
   * Suggest rules for a step given schema fields
   */
  async suggestRules(stepName, stepType, schemaFields, availableSteps = []) {
    const system = `You are a workflow rule expert. Suggest smart routing rules for workflow steps.
    Return ONLY valid JSON array with no markdown.
    
    Return an array of rule objects:
    [
      {
        "condition": "field == 'value' && other > 100",
        "description": "human readable explanation",
        "priority": 1,
        "suggested_next_step": "step name or null"
      }
    ]
    Always include a DEFAULT rule as the last item.`;

    const userMsg = `Step: "${stepName}" (type: ${stepType})
Available input fields: ${JSON.stringify(schemaFields)}
Available next steps: ${availableSteps.join(', ') || 'none'}

Suggest 3-5 routing rules for this step.`;

    try {
      const text = await this._chat(system, userMsg);
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (err) {
      return [];
    }
  }

  /**
   * Generate post-mortem analysis from execution logs
   */
  async generatePostMortem(execution) {
    const system = `You are an expert incident analyst. Analyze workflow execution data and generate a structured post-mortem.
    Return ONLY valid JSON with no markdown.
    
    Return exactly this structure:
    {
      "summary": "2-3 sentence summary",
      "timeline": [{"time": "HH:MM:SS", "event": "what happened"}],
      "what_went_well": ["item1", "item2"],
      "what_went_wrong": ["item1", "item2"],
      "root_cause": "detailed root cause analysis",
      "impact": "impact assessment",
      "recommendations": ["action1", "action2"],
      "mttr_minutes": 0,
      "severity_assessment": "accurate|over_escalated|under_escalated"
    }`;

    const userMsg = `Execution Data:
Workflow: ${execution.workflow_name}
Status: ${execution.status}
Duration: ${execution.ended_at ? Math.round((new Date(execution.ended_at) - new Date(execution.started_at)) / 60000) : 'ongoing'} minutes
Input Data: ${JSON.stringify(execution.data)}
Step Logs: ${JSON.stringify(execution.logs, null, 2)}

Generate a post-mortem analysis.`;

    try {
      const text = await this._chat(system, userMsg);
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (err) {
      return { summary: 'Analysis unavailable', recommendations: [] };
    }
  }

  /**
   * Generate RCA report as markdown text
   */
  async generateRCA(execution) {
    const system = `You are an expert at writing Root Cause Analysis (RCA) reports for IT incidents. 
    Generate a professional, detailed RCA document in markdown format.`;

    const userMsg = `Generate an RCA report for this incident execution:
Workflow: ${execution.workflow_name}
Status: ${execution.status}
Input: ${JSON.stringify(execution.data)}
Duration: ${execution.ended_at ? Math.round((new Date(execution.ended_at) - new Date(execution.started_at)) / 60000) : 'N/A'} minutes
Logs: ${JSON.stringify(execution.logs, null, 2)}

Include: Executive Summary, Timeline, Root Cause, Impact Analysis, Resolution Steps, Preventive Actions.`;

    try {
      return await this._chat(system, userMsg);
    } catch (err) {
      return '# RCA Report\n\nUnable to generate report at this time.';
    }
  }

  /**
   * AI Chat assistant - context-aware
   */
  async chat(messages, context = {}) {
    const system = `You are an expert AI assistant for the Smart Incident Response Workflow Engine.
    You help users create workflows, write rules, understand executions, and manage incidents.
    
    Current context: ${JSON.stringify(context)}
    
    Be concise, practical, and helpful. For rule syntax, use:
    - Comparison: ==, !=, <, >, <=, >=
    - Logical: && (AND), || (OR)  
    - String: contains(field, "value"), startsWith(field, "prefix"), endsWith(field, "suffix")
    - Special: DEFAULT (catch-all rule)`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1000,
        system,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      });
      return response.content[0].text;
    } catch (err) {
      return 'Sorry, I encountered an error. Please try again.';
    }
  }
}

module.exports = new AIService();
