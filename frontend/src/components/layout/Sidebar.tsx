import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History } from 'lucide-react';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="font-mono text-orange text-xs tracking-widest">{time.toLocaleTimeString('en-US', { hour12: false })}</span>;
}

export default function Sidebar() {
  const navItems = [
    { to: '/?warp=reverse', icon: History, label: 'MISSION LOG' },
    { to: '/new', icon: PlusCircle, label: 'NEW SCAN' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'DASHBOARD' },
  ];

  return (
    <aside className="app-sidebar w-64 flex flex-col border-r border-orange-dim">
      <div className="p-6 border-b border-orange-dim">
        <h1 className="font-heading text-sm tracking-[4px] glow-text">ERIDA</h1>
        <p 
          className="font-mono mt-2 tracking-widest uppercase"
          style={{ color: 'rgba(245,240,232,0.3)', fontSize: '9px', letterSpacing: '0.35em' }}
        >
          POWERED BY IBM BOB
        </p>
      </div>
      <nav className="flex-1 p-0 py-4">
        {navItems.map((item, idx) => (
          <React.Fragment key={item.label}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-4 text-xs font-heading tracking-[2px] transition-all duration-200 border-l-2 ${
                  isActive
                    ? 'border-orange text-orange bg-[var(--orange)]/[0.06] pl-[28px]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--orange)]/[0.02]'
                }`
              }
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
            {idx < navItems.length - 1 && (
              <div className="mx-6 border-b border-[rgba(255,107,43,0.08)]" />
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="p-4 border-t border-orange-dim">
        <div className="panel-label">SYSTEM STATUS</div>
        <div className="space-y-2 text-[11px] font-mono">
          <div className="flex justify-between"><span className="text-text-muted">UPTIME</span><LiveClock /></div>
          <div className="flex justify-between"><span className="text-text-muted">SIGNAL</span><span className="text-pass">● LOCKED</span></div>
          <div className="flex justify-between"><span className="text-text-muted">ENGINE</span><span className="text-orange">IBM BOB</span></div>
        </div>
      </div>
    </aside>
  );
}

// Made with Bob
