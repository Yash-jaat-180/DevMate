import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

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
    </div>
  );
}
