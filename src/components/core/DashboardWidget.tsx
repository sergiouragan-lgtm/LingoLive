import React from 'react';

interface DashboardWidgetProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({ title, icon, children, className = '' }) => {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 ${className}`}>
      <h3 className="font-bold text-base text-slate-800 flex items-center gap-2 mb-4">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
};
