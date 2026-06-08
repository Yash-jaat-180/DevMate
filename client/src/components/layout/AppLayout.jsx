import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'sonner';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`app-main ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <div className="page-container">
          <Outlet />
        </div>
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111118',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#f1f5f9',
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
}
