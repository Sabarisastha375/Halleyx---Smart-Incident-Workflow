Smart Incident Workflow



A production-ready full-stack application that leverages AI to automatically generate incident response workflows. It allows users to create, edit, and manage workflows by adding or deleting steps, defining rule-based transitions, and monitoring executions through an interactive dashboard.

---
## 🏗️ Architecture

```
smart-incident-workflow/
├── backend/                   # Node.js + Express API
│   ├── config/db.js           # MongoDB connection
│   ├── models/                # Mongoose schemas
│   │   ├── Workflow.js
│   │   ├── Step.js
│   │   ├── Rule.js
│   │   ├── Execution.js
│   │   └── ExecutionLog.js
│   ├── routes/                # Express routers
│   ├── controllers/           # Request handlers
│   ├── services/              # Business logic
│   ├── ruleEngine/            # Dynamic condition evaluator
│   ├── workflowEngine/        # Execution orchestrator
│   ├── middleware/            # Error handler, input validator
│   ├── scripts/seed.js        # Sample data seeder
│   └── server.js              # Entry point
│
└── frontend/                  # React + Vite + Tailwind
    └── src/
        ├── pages/
        │   ├── WorkflowList.jsx
        │   ├── WorkflowEditor.jsx
        │   ├── RuleEditor.jsx
        │   ├── ExecutionPage.jsx
        │   ├── ExecutionLogs.jsx
        │   └── ExecutionsList.jsx
        ├── components/Layout.jsx
        └── services/api.js
```

---

## ⚙️ Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS      |
| Backend     | Node.js, Express.js               |
| Database    | MongoDB, Mongoose                 |
| DnD         | @dnd-kit (rule priority ordering) |

---

##### 🎥 Project Demo Video

Watch on Youtube  : https://youtu.be/Eoq01DIjG1c?si=Reuc7OfivXs8QvFG


Demo Video Google Drive : (https://drive.google.com/file/d/1ap1BuHbnhSKEn6HwshOL68oV_z8ONUUf/view?usp=sharing)



## 🚀 Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & navigate
```bash
cd smart-incident-workflow
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env          # configure MONGO_URI if needed
npm run dev                   # starts on http://localhost:5000
```

### 3. Seed sample data (optional)
```bash
npm run seed                  # creates the "Smart Incident Response" workflow
```

### 4. Frontend
```bash
cd ../frontend
npm install
npm run dev                   # starts on http://localhost:3000
```


---

## 📡 API Reference

### Workflows
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | List with pagination & search |
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows/:id` | Get workflow + steps |
| PUT | `/api/workflows/:id` | Update workflow |
| DELETE | `/api/workflows/:id` | Delete workflow & steps |

### Steps
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows/:workflowId/steps` | List steps |
| POST | `/api/workflows/:workflowId/steps` | Add step |
| PUT | `/api/steps/:id` | Update step |
| DELETE | `/api/steps/:id` | Delete step |

### Rules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/steps/:stepId/rules` | List rules |
| POST | `/api/steps/:stepId/rules` | Create rule |
| PUT | `/api/rules/:id` | Update rule |
| DELETE | `/api/rules/:id` | Delete rule |

### Executions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workflows/:workflowId/execute` | Start execution |
| GET | `/api/executions` | List all executions |
| GET | `/api/executions/:id` | Get execution + logs |
| POST | `/api/executions/:id/cancel` | Cancel execution |
| POST | `/api/executions/:id/retry` | Retry failed execution |

---

## 🔬 Rule Engine

Rules are evaluated in **ascending priority order**. The first rule returning `true` wins.

### Supported Operators
```
==   !=   >   <   >=   <=   &&   ||
```

### Supported Functions
```
contains(field, value)
startsWith(field, value)
endsWith(field, value)
```

### Example Conditions
```
severity == "High" && system == "Payment"
severity == "Medium" || severity == "Low"
contains(incident_type, "crash")
DEFAULT
```

---

## 🎯 Sample Workflow

**Smart Incident Response** (created by seed script)

```
Incident Logged (task)
    └─ DEFAULT → Severity Analysis

Severity Analysis (task)
    ├─ P1: severity == "High" && system == "Payment" → Manager Escalation
    ├─ P2: severity == "High" → Manager Escalation
    └─ P3: DEFAULT → Engineer Assignment

Engineer Assignment (task)
    └─ DEFAULT → DevOps Notification

Manager Escalation (approval)
    └─ DEFAULT → DevOps Notification

DevOps Notification (notification)
    └─ DEFAULT → Incident Resolution

Incident Resolution (task) ← terminal
```

### Example Execution Input
```json
{
  "incident_type": "Server Crash",
  "severity": "High",
  "system": "Payment",
  "location": "US-East",
  "reported_by": "john.doe"
}
```
### Expected Path
`Incident Logged → Severity Analysis → Manager Escalation → DevOps Notification → Incident Resolution`

---

## 📋 Input Schema Definition

```json
{
  "incident_type": { "type": "string", "required": true },
  "severity": {
    "type": "string",
    "required": true,
    "allowed_values": ["High", "Medium", "Low"]
  },
  "system": { "type": "string", "required": true },
  "location": { "type": "string", "required": false },
  "reported_by": { "type": "string", "required": true }
}
```

---

## 🌍 Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smart_incident_workflow
NODE_ENV=development
```

---

## ✅ Features

- ✅ Multi-step workflow builder with JSON schema definition
- ✅ Dynamic rule engine (operators + functions, priority-ordered)
- ✅ Drag-and-drop rule priority management
- ✅ Step types: `task`, `approval`, `notification`
- ✅ Full execution engine with step-by-step logging
- ✅ Retry failed / cancel in-progress executions
- ✅ Per-step rule evaluation audit trail
- ✅ Pagination & search on all list views
- ✅ Dark, responsive UI with animated transitions
#
