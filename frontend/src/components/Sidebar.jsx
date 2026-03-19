import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, GitBranch, Play, ScrollText,
  Zap, Activity, ChevronRight
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Workflows', icon: GitBranch, path: '/workflows' },
  { label: 'Executions', icon: Play, path: '/executions' },
  { label: 'Audit Log', icon: ScrollText, path: '/audit' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={14} color="white" />
          </div>
          <h2>INCIDENT<br />WORKFLOW</h2>
        </div>
        <span>Engine v1.0</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        margin: '0 8px 12px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 8,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer'
        }}>
          <Activity size={14} color="var(--accent-purple)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-purple)' }}>AI ASSISTANT</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ask me anything</div>
          </div>
          <ChevronRight size={12} color="var(--text-muted)" />
        </div>
      </div>
    </aside>
  );
}
