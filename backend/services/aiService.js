/**
 * AI Workflow Generation Service
 *
 * Strategy:
 *  1. If GEMINI_API_KEY is set → use Google Gemini 1.5 Flash to generate workflows
 *  2. If not → use smart keyword-based template matching (works offline, no key needed)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Smart Template Library ──────────────────────────────────────────────────
// Used as fallback when no Gemini API key is configured
const INCIDENT_TEMPLATES = {
  payment: {
    name: 'Payment Gateway Failure Response',
    description: 'Automated response for payment processing failures',
    inputSchema: {
      incident_type: { type: 'string', required: true },
      severity: { type: 'string', required: true, allowed_values: ['High', 'Medium', 'Low'] },
      system: { type: 'string', required: true },
      payment_provider: { type: 'string', required: false },
      reported_by: { type: 'string', required: true },
    },
    steps: [
      { name: 'Payment Alert Logged', stepType: 'task', order: 1, metadata: { action: 'Log payment failure details' } },
      { name: 'Transaction Impact Analysis', stepType: 'task', order: 2, metadata: { action: 'Assess how many transactions are affected' } },
      { name: 'Payment Team Notification', stepType: 'notification', order: 3, metadata: { channel: 'Slack #payments-alerts' } },
      { name: 'Finance Manager Escalation', stepType: 'approval', order: 4, metadata: { approver: 'Finance Manager' } },
      { name: 'Payment Gateway Rollback', stepType: 'task', order: 5, metadata: { action: 'Rollback to last stable config' } },
      { name: 'Incident Resolution Report', stepType: 'task', order: 6, metadata: { action: 'Generate resolution report' } },
    ],
    rules: [
      { stepIndex: 0, rules: [{ condition: 'DEFAULT', nextStepIndex: 1, priority: 1, isDefault: true }] },
      { stepIndex: 1, rules: [
        { condition: 'severity == "High"', nextStepIndex: 3, priority: 1, isDefault: false },
        { condition: 'DEFAULT', nextStepIndex: 2, priority: 2, isDefault: true },
      ]},
      { stepIndex: 2, rules: [{ condition: 'DEFAULT', nextStepIndex: 4, priority: 1, isDefault: true }] },
      { stepIndex: 3, rules: [{ condition: 'DEFAULT', nextStepIndex: 4, priority: 1, isDefault: true }] },
      { stepIndex: 4, rules: [{ condition: 'DEFAULT', nextStepIndex: 5, priority: 1, isDefault: true }] },
      { stepIndex: 5, rules: [] },
    ],
  },

  server: {
    name: 'Server Crash Recovery Workflow',
    description: 'Automated response for server outage and crash incidents',
    inputSchema: {
      incident_type: { type: 'string', required: true },
      severity: { type: 'string', required: true, allowed_values: ['High', 'Medium', 'Low'] },
      server_name: { type: 'string', required: true },
      location: { type: 'string', required: false },
      reported_by: { type: 'string', required: true },
    },
    steps: [
      { name: 'Server Alert Detected', stepType: 'task', order: 1, metadata: { action: 'Log server crash event' } },
      { name: 'Automated Health Check', stepType: 'task', order: 2, metadata: { action: 'Run automated diagnostics' } },
      { name: 'DevOps Team Alert', stepType: 'notification', order: 3, metadata: { channel: 'PagerDuty + Slack' } },
      { name: 'Manager Escalation', stepType: 'approval', order: 4, metadata: { escalation_level: 'P1' } },
      { name: 'Server Restart / Failover', stepType: 'task', order: 5, metadata: { action: 'Trigger auto-restart or failover' } },
      { name: 'Post-Incident Review', stepType: 'task', order: 6, metadata: { action: 'Write post-mortem report' } },
    ],
    rules: [
      { stepIndex: 0, rules: [{ condition: 'DEFAULT', nextStepIndex: 1, priority: 1, isDefault: true }] },
      { stepIndex: 1, rules: [
        { condition: 'severity == "High"', nextStepIndex: 3, priority: 1, isDefault: false },
        { condition: 'DEFAULT', nextStepIndex: 2, priority: 2, isDefault: true },
      ]},
      { stepIndex: 2, rules: [{ condition: 'DEFAULT', nextStepIndex: 4, priority: 1, isDefault: true }] },
      { stepIndex: 3, rules: [{ condition: 'DEFAULT', nextStepIndex: 4, priority: 1, isDefault: true }] },
      { stepIndex: 4, rules: [{ condition: 'DEFAULT', nextStepIndex: 5, priority: 1, isDefault: true }] },
      { stepIndex: 5, rules: [] },
    ],
  },

  security: {
    name: 'Security Breach Response Workflow',
    description: 'Incident response for security alerts and data breaches',
    inputSchema: {
      incident_type: { type: 'string', required: true },
      severity: { type: 'string', required: true, allowed_values: ['High', 'Medium', 'Low'] },
      affected_system: { type: 'string', required: true },
      breach_type: { type: 'string', required: false },
      reported_by: { type: 'string', required: true },
    },
    steps: [
      { name: 'Security Alert Triggered', stepType: 'task', order: 1, metadata: { action: 'Log security event' } },
      { name: 'Threat Assessment', stepType: 'task', order: 2, metadata: { action: 'Assess threat level and blast radius' } },
      { name: 'Security Team Notification', stepType: 'notification', order: 3, metadata: { channel: 'Security Slack + Email' } },
      { name: 'CISO Approval for Lockdown', stepType: 'approval', order: 4, metadata: { approver: 'CISO' } },
      { name: 'System Isolation / Lockdown', stepType: 'task', order: 5, metadata: { action: 'Isolate affected systems' } },
      { name: 'Forensics & Remediation', stepType: 'task', order: 6, metadata: { action: 'Run forensics and patch' } },
      { name: 'Compliance Report', stepType: 'notification', order: 7, metadata: { channel: 'Legal & Compliance team' } },
    ],
    rules: [
      { stepIndex: 0, rules: [{ condition: 'DEFAULT', nextStepIndex: 1, priority: 1, isDefault: true }] },
      { stepIndex: 1, rules: [
        { condition: 'severity == "High"', nextStepIndex: 3, priority: 1, isDefault: false },
        { condition: 'DEFAULT', nextStepIndex: 2, priority: 2, isDefault: true },
      ]},
      { stepIndex: 2, rules: [{ condition: 'DEFAULT', nextStepIndex: 4, priority: 1, isDefault: true }] },
      { stepIndex: 3, rules: [{ condition: 'DEFAULT', nextStepIndex: 4, priority: 1, isDefault: true }] },
      { stepIndex: 4, rules: [{ condition: 'DEFAULT', nextStepIndex: 5, priority: 1, isDefault: true }] },
      { stepIndex: 5, rules: [{ condition: 'DEFAULT', nextStepIndex: 6, priority: 1, isDefault: true }] },
      { stepIndex: 6, rules: [] },
    ],
  },

  network: {
    name: 'Network Outage Response Workflow',
    description: 'Response workflow for network connectivity failures and outages',
    inputSchema: {
      incident_type: { type: 'string', required: true },
      severity: { type: 'string', required: true, allowed_values: ['High', 'Medium', 'Low'] },
      affected_region: { type: 'string', required: true },
      system: { type: 'string', required: false },
      reported_by: { type: 'string', required: true },
    },
    steps: [
      { name: 'Outage Detected', stepType: 'task', order: 1, metadata: { action: 'Log outage alert' } },
      { name: 'Network Diagnostics', stepType: 'task', order: 2, metadata: { action: 'Run ping, traceroute, BGP check' } },
      { name: 'NOC Team Notified', stepType: 'notification', order: 3, metadata: { channel: 'NOC Slack + PagerDuty' } },
      { name: 'Traffic Reroute', stepType: 'task', order: 4, metadata: { action: 'Reroute traffic via backup path' } },
      { name: 'ISP Escalation', stepType: 'approval', order: 5, metadata: { approver: 'Network Manager' } },
      { name: 'Network Restored', stepType: 'task', order: 6, metadata: { action: 'Confirm connectivity restored' } },
    ],
    rules: [
      { stepIndex: 0, rules: [{ condition: 'DEFAULT', nextStepIndex: 1, priority: 1, isDefault: true }] },
      { stepIndex: 1, rules: [
        { condition: 'severity == "High"', nextStepIndex: 4, priority: 1, isDefault: false },
        { condition: 'DEFAULT', nextStepIndex: 2, priority: 2, isDefault: true },
      ]},
      { stepIndex: 2, rules: [{ condition: 'DEFAULT', nextStepIndex: 3, priority: 1, isDefault: true }] },
      { stepIndex: 3, rules: [{ condition: 'DEFAULT', nextStepIndex: 5, priority: 1, isDefault: true }] },
      { stepIndex: 4, rules: [{ condition: 'DEFAULT', nextStepIndex: 5, priority: 1, isDefault: true }] },
      { stepIndex: 5, rules: [] },
    ],
  },

  database: {
    name: 'Database Failure Response Workflow',
    description: 'Automated response for database crashes, corruption, or connectivity issues',
    inputSchema: {
      incident_type: { type: 'string', required: true },
      severity: { type: 'string', required: true, allowed_values: ['High', 'Medium', 'Low'] },
      database: { type: 'string', required: true },
      environment: { type: 'string', required: false },
      reported_by: { type: 'string', required: true },
    },
    steps: [
      { name: 'DB Alert Logged', stepType: 'task', order: 1, metadata: { action: 'Log DB failure event' } },
      { name: 'Connection Pool Analysis', stepType: 'task', order: 2, metadata: { action: 'Check connection limits and locks' } },
      { name: 'DBA Team Notified', stepType: 'notification', order: 3, metadata: { channel: 'DBA On-Call' } },
      { name: 'Read Replica Failover', stepType: 'task', order: 4, metadata: { action: 'Promote read replica to primary' } },
      { name: 'Data Integrity Check', stepType: 'task', order: 5, metadata: { action: 'Validate data consistency' } },
      { name: 'DB Incident Report', stepType: 'task', order: 6, metadata: { action: 'Generate DB incident report' } },
    ],
    rules: [
      { stepIndex: 0, rules: [{ condition: 'DEFAULT', nextStepIndex: 1, priority: 1, isDefault: true }] },
      { stepIndex: 1, rules: [
        { condition: 'severity == "High"', nextStepIndex: 3, priority: 1, isDefault: false },
        { condition: 'DEFAULT', nextStepIndex: 2, priority: 2, isDefault: true },
      ]},
      { stepIndex: 2, rules: [{ condition: 'DEFAULT', nextStepIndex: 3, priority: 1, isDefault: true }] },
      { stepIndex: 3, rules: [{ condition: 'DEFAULT', nextStepIndex: 4, priority: 1, isDefault: true }] },
      { stepIndex: 4, rules: [{ condition: 'DEFAULT', nextStepIndex: 5, priority: 1, isDefault: true }] },
      { stepIndex: 5, rules: [] },
    ],
  },
};

// ─── Keyword Matching ────────────────────────────────────────────────────────
const matchTemplate = (description) => {
  const d = description.toLowerCase();
  if (d.match(/pay|payment|transaction|billing|stripe|checkout/)) return 'payment';
  if (d.match(/server|crash|down|memory|cpu|vm|pod|container|host/)) return 'server';
  if (d.match(/security|breach|attack|hack|unauthoriz|exploit|malware|ddos/)) return 'security';
  if (d.match(/network|outage|connectivity|dns|vpn|latency|packet|bandwidth/)) return 'network';
  if (d.match(/database|db|sql|mongo|postgres|mysql|redis|connection pool/)) return 'database';
  return 'server'; // default
};

// ─── Gemini AI Generation ────────────────────────────────────────────────────
const generateWithGemini = async (description) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are an expert incident response engineer. Generate a complete workflow for this incident scenario:

"${description}"

Respond ONLY with valid JSON (no markdown, no explanation) in this exact format:
{
  "name": "Workflow name (max 60 chars)",
  "description": "1 sentence description",
  "inputSchema": {
    "fieldName": { "type": "string", "required": true, "allowed_values": ["val1","val2"] }
  },
  "steps": [
    { "name": "Step Name", "stepType": "task|approval|notification", "order": 1, "metadata": { "action": "what this step does" } }
  ],
  "rules": [
    {
      "stepIndex": 0,
      "rules": [
        { "condition": "DEFAULT", "nextStepIndex": 1, "priority": 1, "isDefault": true }
      ]
    }
  ]
}

Rules:
- 4-7 steps
- stepType must be one of: task, approval, notification
- rules.stepIndex must match a step's position (0-indexed)
- nextStepIndex null means terminal step
- Use conditions like: severity == "High", contains(system,"payment"), DEFAULT
- Include at least 1 approval or notification step
- inputSchema should have 4-6 relevant fields
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Extract JSON — strip potential markdown code fences
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
};

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Generate a workflow definition from a natural language description.
 * Uses Gemini if API key is set, otherwise uses smart template matching.
 * @param {string} description
 * @returns {Object} workflow definition with steps and rules
 */
const generateWorkflow = async (description) => {
  if (!description || description.trim().length < 3) {
    throw new Error('Please provide a meaningful incident description');
  }

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      console.log('[AI] Using Gemini API to generate workflow...');
      const result = await generateWithGemini(description);
      result._source = 'gemini';
      return result;
    } catch (aiErr) {
      console.warn('[AI] Gemini failed, falling back to smart templates:', aiErr.message);
    }
  }

  // Smart template fallback
  console.log('[AI] Using smart template matching...');
  const key = matchTemplate(description);
  const template = INCIDENT_TEMPLATES[key];
  const result = JSON.parse(JSON.stringify(template)); // deep clone
  result._source = 'template';
  result._matchedTemplate = key;
  return result;
};

/**
 * Return all available template categories for the frontend.
 */
const getTemplates = () => {
  return Object.entries(INCIDENT_TEMPLATES).map(([key, t]) => ({
    key,
    name: t.name,
    description: t.description,
    stepCount: t.steps.length,
    stepTypes: [...new Set(t.steps.map((s) => s.stepType))],
  }));
};

module.exports = { generateWorkflow, getTemplates, INCIDENT_TEMPLATES };
