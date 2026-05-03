import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History } from 'lucide-react';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="font-mono text-cyan text-xs tracking-widest">{time.toLocaleTimeString('en-US', { hour12: false })}</span>;
}

export default function Sidebar() {
  const navItems = [
    { to: '/', icon: History, label: 'MISSION LOG' },
    { to: '/new', icon: PlusCircle, label: 'NEW SCAN' },
    { to: '/report/current', icon: LayoutDashboard, label: 'DASHBOARD' },
  ];

  return (
    <aside className="app-sidebar w-64 flex flex-col border-r border-cyan-dim" style={{ background: 'rgba(5,8,12,0.9)' }}>
      <div className="p-6 border-b border-cyan-dim">
        <h1 className="font-heading text-sm tracking-[4px] glow-text">COMPLIANCE<br/>AUTOPILOT</h1>
        <p className="text-[10px] font-mono text-ink-muted mt-2 tracking-widest">POWERED BY IBM BOB</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-xs font-heading tracking-[2px] transition-all border-l-2 ${
                isActive
                  ? 'border-cyan text-cyan bg-cyan/5 shadow-[inset_0_0_20px_rgba(0,240,255,0.03)]'
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-cyan/30'
              }`
            }
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-cyan-dim">
        <div className="panel-label">SYSTEM STATUS</div>
        <div className="space-y-2 text-[11px] font-mono">
          <div className="flex justify-between"><span className="text-ink-muted">UPTIME</span><LiveClock /></div>
          <div className="flex justify-between"><span className="text-ink-muted">SIGNAL</span><span className="text-ok">● LOCKED</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">ENGINE</span><span className="text-cyan">IBM BOB</span></div>
        </div>
      </div>
    </aside>
  );
}
