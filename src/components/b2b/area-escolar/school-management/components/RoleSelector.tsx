import React from 'react';
import { Shield } from 'lucide-react';
import type { RbacRole } from '../types';

interface RoleSelectorProps {
  selectedRole: RbacRole;
  onRoleChange: (role: RbacRole) => void;
  roles?: RbacRole[];
}

const DEFAULT_ROLES: RbacRole[] = ['Super Admin', 'Diretor', 'Professor', 'Aluno', 'Encarregado'];

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onRoleChange,
  roles = DEFAULT_ROLES,
}) => (
  <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-1">
    <div className="flex items-center gap-1.5 px-2 text-slate-500 text-xs font-semibold">
      <Shield size={14} className="text-indigo-500" />
      <span>Simular Perfil:</span>
    </div>
    {roles.map((role) => (
      <button
        key={role}
        onClick={() => onRoleChange(role)}
        className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
          selectedRole === role
            ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
        }`}
      >
        {role}
      </button>
    ))}
  </div>
);
