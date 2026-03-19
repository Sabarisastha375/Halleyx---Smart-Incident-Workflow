import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';

const navSections = [
  {
    label: 'Overview',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'AI Features',
    items: [
      {
        to: '/ai-generator',
        label: 'AI Generator',
        icon: <span className="text-lg leading-none">🤖</span>,
      },
      {
        to: '/templates',
        label: 'Templates',
        icon: <span className="text-lg leading-none">📋</span>,
      },
    ],
  },
  {
    label: 'Workflows',
    items: [
      {
        to: '/workflows',
        label: 'All Workflows',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        ),
      },
      {
        to: '/executions',
        label: 'Executions',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        ),
      },
    ],
  },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-surface relative z-0 font-sans">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-600/20 blur-[120px] mix-blend-screen animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[100px] mix-blend-screen animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Floating Sidebar */}
      <aside className="w-64 m-4 flex-shrink-0 bg-surface-card/80 backdrop-blur-2xl border border-surface-border rounded-3xl flex flex-col shadow-glass z-10 transition-all duration-500">
        {/* Brand */}
        <div className="p-6 border-b border-surface-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.5)] transform hover:rotate-12 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">Smart Incident</h1>
              <p className="text-xs text-primary-400/80 font-medium">Workflow System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-5 overflow-y-auto custom-scrollbar">
          {navSections.map(({ label, items }) => (
            <div key={label} className="animate-slide-up" style={{ animationFillMode: 'both' }}>
              <p className="text-[10px] font-bold text-slate-500/80 uppercase tracking-widest px-3 mb-2">
                {label}
              </p>
              <div className="space-y-1">
                {items.map(({ to, label: itemLabel, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group ${
                        isActive
                          ? 'bg-primary-500/10 text-primary-400 shadow-[inset_3px_0_0_rgba(20,184,166,1)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 hover:shadow-[inset_3px_0_0_rgba(148,163,184,0.3)]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-primary-400' : 'group-hover:scale-110 group-hover:text-slate-300'}`}>
                          {icon}
                        </div>
                        {itemLabel}
                        {isActive && (
                          <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(20,184,166,0.8)] animate-pulse2"></div>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border/50">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md mb-3">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
               Usr
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">Active User</p>
            </div>
            <button 
              onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href='/login'; }}
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md transition-all hover:bg-slate-900/60 cursor-pointer">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-medium tracking-wide text-slate-300">System Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 m-4 ml-0 rounded-3xl bg-surface-card/40 backdrop-blur-xl border border-surface-border shadow-glass flex flex-col overflow-hidden transition-all duration-500">
        {/* Top header */}
        <div className="border-b border-surface-border/30 bg-slate-900/20 px-8 py-5 backdrop-blur-3xl z-20">
          <p className="text-xs font-bold text-primary-400/80 uppercase tracking-widest">
            {location.pathname.replace(/\//g, ' / ').replace(/-/g, ' ').trim() || 'Overview'}
          </p>
        </div>

        {/* Page Content */}
        <div className="p-8 animate-fade-in flex-1 overflow-y-auto custom-scrollbar relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
