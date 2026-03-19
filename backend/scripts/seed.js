/**
 * Database Seed Script
 * Uses the shared connectDB so in-memory MongoDB works automatically.
 * Run with: npm run seed
 */

const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');
const Workflow = require('../models/Workflow');
const Step = require('../models/Step');
const Rule = require('../models/Rule');

const seed = async () => {
  try {
    await connectDB();
    console.log('\n🌱 Starting seed...');

    // Clear existing seed data
    await Workflow.deleteMany({ name: 'Smart Incident Response' });

    // ─── Create Workflow ────────────────────────────────────────────────────
    const workflow = await Workflow.create({
      name: 'Smart Incident Response',
      version: 1,
      isActive: true,
      description: 'Automated workflow for responding to technical incidents',
      inputSchema: {
        incident_type: { type: 'string', required: true },
        severity: {
          type: 'string',
          required: true,
          allowed_values: ['High', 'Medium', 'Low'],
        },
        system: { type: 'string', required: true },
        location: { type: 'string', required: false },
        reported_by: { type: 'string', required: true },
      },
    });
    console.log(`✅ Created workflow: ${workflow.name} (${workflow._id})`);

    // ─── Create Steps ───────────────────────────────────────────────────────
    const stepDefs = [
      { name: 'Incident Logged',      stepType: 'task',         order: 1 },
      { name: 'Severity Analysis',    stepType: 'task',         order: 2 },
      { name: 'Engineer Assignment',  stepType: 'task',         order: 3 },
      { name: 'Manager Escalation',   stepType: 'approval',     order: 4 },
      { name: 'DevOps Notification',  stepType: 'notification', order: 5 },
      { name: 'Incident Resolution',  stepType: 'task',         order: 6 },
    ];

    const steps = [];
    for (const def of stepDefs) {
      const step = await Step.create({ ...def, workflowId: workflow._id });
      steps.push(step);
      console.log(`   Step: ${step.name} (${step.stepType})`);
    }

    const sm = {};
    steps.forEach((s) => { sm[s.name] = s; });

    // Set start step
    await Workflow.findByIdAndUpdate(workflow._id, { startStepId: sm['Incident Logged']._id });

    // ─── Create Rules ────────────────────────────────────────────────────────

    // Incident Logged → Severity Analysis
    await Rule.create({ stepId: sm['Incident Logged']._id, condition: 'DEFAULT', nextStepId: sm['Severity Analysis']._id, priority: 1, isDefault: true });

    // Severity Analysis rules
    await Rule.create({ stepId: sm['Severity Analysis']._id, condition: 'severity == "High" && system == "Payment"', nextStepId: sm['Manager Escalation']._id, priority: 1, isDefault: false, description: 'High severity + Payment → Manager' });
    await Rule.create({ stepId: sm['Severity Analysis']._id, condition: 'severity == "High"', nextStepId: sm['Manager Escalation']._id, priority: 2, isDefault: false, description: 'Any High severity → Manager' });
    await Rule.create({ stepId: sm['Severity Analysis']._id, condition: 'DEFAULT', nextStepId: sm['Engineer Assignment']._id, priority: 3, isDefault: true, description: 'Medium/Low → Engineer' });

    // Engineer Assignment → DevOps Notification
    await Rule.create({ stepId: sm['Engineer Assignment']._id, condition: 'DEFAULT', nextStepId: sm['DevOps Notification']._id, priority: 1, isDefault: true });

    // Manager Escalation → DevOps Notification
    await Rule.create({ stepId: sm['Manager Escalation']._id, condition: 'DEFAULT', nextStepId: sm['DevOps Notification']._id, priority: 1, isDefault: true });

    // DevOps Notification → Incident Resolution
    await Rule.create({ stepId: sm['DevOps Notification']._id, condition: 'DEFAULT', nextStepId: sm['Incident Resolution']._id, priority: 1, isDefault: true });

    // Incident Resolution → terminal (no rules)

    console.log('\n✅ Seed completed!');
    console.log(`   Workflow ID : ${workflow._id}`);
    console.log(`   Steps       : ${steps.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seed();
