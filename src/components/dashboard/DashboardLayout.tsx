import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Role } from '../../models/rbac';

interface DashboardLayoutProps {
  role: Role;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role, children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
