import React from 'react';
import { Bell, Search, Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const Header: React.FC = () => {
  const { isInstallable, install } = usePWAInstall();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
      <div className="relative w-96">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="flex items-center gap-4">
        {isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            id="pwa-install-header-btn"
          >
            <Download size={14} />
            <span>Instalar LingoLIVE</span>
          </button>
        )}
        <button className="text-gray-400 hover:text-gray-900 transition-colors" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <button 
          className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-xs hover:bg-blue-700 transition-colors"
          aria-label="Profile settings"
        >
          U
        </button>
      </div>
    </header>
  );
};
