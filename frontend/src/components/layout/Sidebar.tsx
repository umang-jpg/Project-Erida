import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', icon: History, label: 'History' },
    { to: '/new', icon: PlusCircle, label: 'New Analysis' },
    { to: '/report/current', icon: LayoutDashboard, label: 'Dashboard' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary">ComplianceAutopilot</h1>
        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Powered by IBM BOB</p>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
