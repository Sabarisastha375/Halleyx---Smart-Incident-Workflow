require('dotenv').config();
const mongoose = require('mongoose');
const Workflow = require('../models/workflow.model');
const Step = require('../models/step.model');
const Rule = require('../models/rule.model');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-incident-workflow');
  console.log('✅ Connected to MongoDB');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    Workflow.deleteMany({}),
    Step.deleteMany({}),
    Rule.deleteMany({})
  ]);
  console.log('🗑️  Cleared existing data');

  // ─── Workflow 1: P1 Critical Incident Response ───────────────
  const w1 = await Workflow.create({
    name: 'P1 Critical Incident Response',
    description: 'Full escalation workflow for critical production incidents',
    version: 1,
    is_active: true,
    input_schema: {
      incident_title: { type: 'string', required: true },
      severity: { type: 'string', required: true, allowed_values: ['P1', 'P2', 'P3', 'P4'] },
      incident_type: { type: 'string', required: true, allowed_values: ['outage', 'degradation', 'security', 'data_loss'] },
      affected_system: { type: 'string', required: true },
      region: { type: 'string', required: true, allowed_values: ['US-EAST', 'US-WEST', 'EU', 'APAC'] },
      priority: { type: 'string', required: true, allowed_values: ['High', 'Medium', 'Low'] }
    },
    tags: ['critical', 'incident', 'p1']
  });

  const s1_1 = await Step.create({ workflow_id: w1._id, name: 'Page On-Call Engineer', step_type: 'notification', order: 1, metadata: { channel: 'slack', template: '🚨 {{severity}} Incident: {{incident_title}} affecting {{affected_system}}', sla_minutes: 5 } });
  const s1_2 = await Step.create({ workflow_id: w1._id, name: 'Manager Escalation', step_type: 'approval', order: 2, metadata: { assignee_email: 'manager@company.com', sla_minutes: 15, instructions: 'Review incident details and approve escalation path' } });
  const s1_3 = await Step.create({ workflow_id: w1._id, name: 'CTO Emergency Alert', step_type: 'notification', order: 3, metadata: { channel: 'email', template: '🔴 CRITICAL: {{incident_title}} - Immediate attention required', assignee_email: 'cto@company.com' } });
  const s1_4 = await Step.create({ workflow_id: w1._id, name: 'Create War Room', step_type: 'task', order: 4, metadata: { channel: 'slack', template: 'War room created for {{incident_title}}', instructions: 'Auto-create Slack channel and page all relevant engineers' } });
  const s1_5 = await Step.create({ workflow_id: w1._id, name: 'Resolution Confirmation', step_type: 'approval', order: 5, metadata: { assignee_email: 'oncall@company.com', sla_minutes: 60, instructions: 'Confirm the incident has been resolved' } });
  const s1_6 = await Step.create({ workflow_id: w1._id, name: 'Post-Mortem Trigger', step_type: 'task', order: 6, metadata: { instructions: 'Schedule RCA meeting and create post-mortem document' } });
  const s1_7 = await Step.create({ workflow_id: w1._id, name: 'Closure Notification', step_type: 'notification', order: 7, metadata: { channel: 'slack', template: '✅ Incident Resolved: {{incident_title}} - All systems normal' } });

  // Rules for Manager Escalation
  await Rule.create([
    { step_id: s1_2._id, condition: "severity == 'P1' && incident_type == 'outage'", next_step_id: s1_3._id, priority: 1, description: 'P1 outages go to CTO immediately' },
    { step_id: s1_2._id, condition: "severity == 'P1' && incident_type == 'security'", next_step_id: s1_3._id, priority: 2, description: 'Security incidents escalate to CTO' },
    { step_id: s1_2._id, condition: "severity == 'P2'", next_step_id: s1_4._id, priority: 3, description: 'P2 goes to war room' },
    { step_id: s1_2._id, condition: 'DEFAULT', next_step_id: s1_4._id, priority: 99, is_default: true, description: 'Default: create war room' }
  ]);

  // Rules for Resolution Confirmation
  await Rule.create([
    { step_id: s1_5._id, condition: 'DEFAULT', next_step_id: s1_6._id, priority: 99, is_default: true, description: 'Always trigger post-mortem' }
  ]);

  // Rules for Post-Mortem Trigger
  await Rule.create([
    { step_id: s1_6._id, condition: 'DEFAULT', next_step_id: s1_7._id, priority: 99, is_default: true }
  ]);

  // Rules for CTO Alert → War Room
  await Rule.create([
    { step_id: s1_3._id, condition: 'DEFAULT', next_step_id: s1_4._id, priority: 99, is_default: true }
  ]);

  // Rules for War Room → Resolution
  await Rule.create([
    { step_id: s1_4._id, condition: 'DEFAULT', next_step_id: s1_5._id, priority: 99, is_default: true }
  ]);

  // Set start step and notification rules
  await Rule.create([
    { step_id: s1_1._id, condition: 'DEFAULT', next_step_id: s1_2._id, priority: 99, is_default: true }
  ]);

  w1.start_step_id = s1_1._id;
  await w1.save();

  // ─── Workflow 2: Security Breach Response ─────────────────────
  const w2 = await Workflow.create({
    name: 'Security Breach Response',
    description: 'Handles security incidents including breaches, unauthorized access, and data leaks',
    version: 1,
    is_active: true,
    input_schema: {
      incident_title: { type: 'string', required: true },
      breach_type: { type: 'string', required: true, allowed_values: ['unauthorized_access', 'data_leak', 'ransomware', 'phishing'] },
      severity: { type: 'string', required: true, allowed_values: ['P1', 'P2', 'P3'] },
      affected_users: { type: 'number', required: true },
      data_classification: { type: 'string', required: true, allowed_values: ['public', 'internal', 'confidential', 'restricted'] },
      region: { type: 'string', required: false }
    },
    tags: ['security', 'breach', 'compliance']
  });

  const s2_1 = await Step.create({ workflow_id: w2._id, name: 'Threat Assessment', step_type: 'task', order: 1, metadata: { instructions: 'Assess threat level and contain immediate damage' } });
  const s2_2 = await Step.create({ workflow_id: w2._id, name: 'Security Team Alert', step_type: 'notification', order: 2, metadata: { channel: 'slack', template: '🔐 Security Alert: {{breach_type}} detected - {{incident_title}}', assignee_email: 'security@company.com' } });
  const s2_3 = await Step.create({ workflow_id: w2._id, name: 'CISO Approval', step_type: 'approval', order: 3, metadata: { assignee_email: 'ciso@company.com', sla_minutes: 30, instructions: 'CISO approval required for breach response actions' } });
  const s2_4 = await Step.create({ workflow_id: w2._id, name: 'System Isolation', step_type: 'task', order: 4, metadata: { instructions: 'Isolate affected systems to prevent further damage' } });
  const s2_5 = await Step.create({ workflow_id: w2._id, name: 'Compliance Ticket', step_type: 'task', order: 5, metadata: { instructions: 'File regulatory compliance ticket (GDPR/HIPAA as applicable)' } });
  const s2_6 = await Step.create({ workflow_id: w2._id, name: 'Executive Notification', step_type: 'notification', order: 6, metadata: { channel: 'email', template: '⚠️ Security Breach Report: {{incident_title}}', assignee_email: 'executives@company.com' } });
  const s2_7 = await Step.create({ workflow_id: w2._id, name: 'Closure and Report', step_type: 'task', order: 7, metadata: { instructions: 'Document timeline, impact, and remediation steps' } });

  await Rule.create([
    { step_id: s2_1._id, condition: 'DEFAULT', next_step_id: s2_2._id, priority: 99, is_default: true },
    { step_id: s2_2._id, condition: 'DEFAULT', next_step_id: s2_3._id, priority: 99, is_default: true },
    { step_id: s2_3._id, condition: "data_classification == 'restricted' || affected_users > 100", next_step_id: s2_4._id, priority: 1, description: 'High impact breaches require isolation' },
    { step_id: s2_3._id, condition: 'DEFAULT', next_step_id: s2_5._id, priority: 99, is_default: true },
    { step_id: s2_4._id, condition: 'DEFAULT', next_step_id: s2_5._id, priority: 99, is_default: true },
    { step_id: s2_5._id, condition: "severity == 'P1'", next_step_id: s2_6._id, priority: 1 },
    { step_id: s2_5._id, condition: 'DEFAULT', next_step_id: s2_7._id, priority: 99, is_default: true },
    { step_id: s2_6._id, condition: 'DEFAULT', next_step_id: s2_7._id, priority: 99, is_default: true }
  ]);

  w2.start_step_id = s2_1._id;
  await w2.save();

  console.log('✅ Seed complete!');
  console.log(`   Workflow 1: ${w1.name} (${w1._id})`);
  console.log(`   Workflow 2: ${w2.name} (${w2._id})`);
  await mongoose.disconnect();
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
