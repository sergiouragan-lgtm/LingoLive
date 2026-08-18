import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';

const UserRoleContext = createContext<{ role: UserRole; setRole: (role: UserRole) => void } | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<UserRole>(() => (localStorage.getItem('lingolive_role') as UserRole) || 'Student');
  
  useEffect(() => {
    localStorage.setItem('lingolive_role', role);
  }, [role]);

  return (
    <UserRoleContext.Provider value={{ role, setRole }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    return { role: 'Student' as UserRole, setRole: () => {} };
  }
  return context;
};
