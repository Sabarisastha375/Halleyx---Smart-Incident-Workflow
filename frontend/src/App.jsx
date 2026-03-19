import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AIGenerator from './pages/AIGenerator';
import TemplatesPage from './pages/TemplatesPage';
import WorkflowList from './pages/WorkflowList';
import WorkflowEditor from './pages/WorkflowEditor';
import RuleEditor from './pages/RuleEditor';
import ExecutionPage from './pages/ExecutionPage';
import ExecutionLogs from './pages/ExecutionLogs';
import ExecutionsList from './pages/ExecutionsList';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="ai-generator" element={<AIGenerator />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="workflows" element={<WorkflowList />} />
          <Route path="workflows/new" element={<WorkflowEditor />} />
          <Route path="workflows/:id/edit" element={<WorkflowEditor />} />
          <Route path="workflows/:id/rules" element={<RuleEditor />} />
          <Route path="workflows/:id/execute" element={<ExecutionPage />} />
          <Route path="executions" element={<ExecutionsList />} />
          <Route path="executions/:id" element={<ExecutionLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
