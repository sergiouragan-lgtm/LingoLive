import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Pesquisar...',
  value,
  onChange,
}) => (
  <div className="relative">
    <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
    />
  </div>
);
