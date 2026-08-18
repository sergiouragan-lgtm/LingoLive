import React from 'react';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Widget: React.FC<WidgetProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
      {children}
    </div>
  );
};
