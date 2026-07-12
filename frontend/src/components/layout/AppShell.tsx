import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShell() {
  const [isReady, setIsReady] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`page-enter ${isReady ? 'page-enter-active' : ''}`}>
      <div className="starfield" />
      <div className="grid-overlay" />
      <div className="relative z-10 flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
