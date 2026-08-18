import React from 'react';
import { LayoutDashboard, Users, BookOpen, Settings, Bell, Calendar } from 'lucide-react';
import { Role } from '../../models/rbac';

interface SidebarProps {
  role: Role;
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const menuItems = {
    [Role.STUDENT]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: BookOpen, label: 'My Courses', path: '/courses' },
    ],
    [Role.TEACHER]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'My Students', path: '/students' },
      { icon: BookOpen, label: 'My Classes', path: '/classes' },
    ],
    [Role.SCHOOL_ADMIN]: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Users, label: 'Manage Staff', path: '/staff' },
        { icon: BookOpen, label: 'Manage Courses', path: '/courses' },
    ],
    [Role.PARENT]: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Calendar, label: 'Student Progress', path: '/progress' },
    ],
    [Role.B2C_USER]: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: BookOpen, label: 'Learning Path', path: '/learning-path' },
    ]
  };

  const items = menuItems[role] || menuItems[Role.STUDENT];

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 hidden md:flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">LingoLIVE</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {items.map((item) => {
          const isActive = window.location.pathname === item.path;
          return (
          <a
            key={item.label}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive 
                ? 'bg-blue-50 text-blue-700 font-semibold' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </a>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg w-full text-sm">
            <Settings size={18} />
            Settings
        </button>
      </div>
    </aside>
  );
};
