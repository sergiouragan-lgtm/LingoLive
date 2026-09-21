import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Role } from '../../models/rbac';
import { auth } from '../../firebase';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';

interface DashboardLayoutProps {
  role: Role;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role, children }) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('dashboard_layout_loaded', {
        userRole: role,
        layoutType: 'main_dashboard'
      });
    }
  }, [userId, role, trackEvent]);
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
