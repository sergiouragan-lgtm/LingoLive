import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Toast {
  id: number;
  title?: string;
  message: string;
  type: 'achievement' | 'info' | 'success' | 'error' | string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (arg1: string, arg2?: string) => void;
  showToast: (arg1: string, arg2?: string) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((arg1: string, arg2?: string) => {
    const id = Date.now() + Math.random();
    
    let title: string | undefined = undefined;
    let message = arg1;
    let type: 'achievement' | 'info' | 'success' | 'error' | string = 'info';

    if (arg2) {
      const knownTypes = ['achievement', 'info', 'success', 'error'];
      if (knownTypes.includes(arg2)) {
        // Pattern B: addToast(description, type)
        message = arg1;
        type = arg2;
        if (type === 'achievement') title = 'Nova Conquista!';
        else if (type === 'success') title = 'Sucesso!';
        else if (type === 'error') title = 'Erro';
        else title = 'Informação';
      } else {
        // Pattern A: addToast(title, description)
        title = arg1;
        message = arg2;
        
        // Infer the type based on the title string
        const lowerTitle = arg1.toLowerCase();
        if (lowerTitle.includes('erro') || lowerTitle.includes('falha') || lowerTitle.includes('aviso de conexão')) {
          type = 'error';
        } else if (lowerTitle.includes('sucesso') || lowerTitle.includes('parabéns') || lowerTitle.includes('cadastrada') || lowerTitle.includes('confirmado')) {
          type = 'success';
        } else if (lowerTitle.includes('conquista') || lowerTitle.includes('desbloqueada') || lowerTitle.includes('streak')) {
          type = 'achievement';
        } else {
          type = 'info';
        }
      }
    } else {
      // Single argument: addToast(message)
      message = arg1;
      type = 'info';
      title = 'Informação';
    }

    const newToast: Toast = { id, title, message, type };

    // Defers state update to microtask queue to prevent "Cannot update a component while rendering a different component"
    queueMicrotask(() => {
      setToasts((prev) => [...prev, newToast]);
    });
    
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  // Connect the local ToastContext to the global in-app event bus
  useEffect(() => {
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { title, message, type } = customEvent.detail;
        if (title && message) {
          addToast(title, message);
        } else if (message) {
          addToast(message, type || 'info');
        }
      }
    };
    
    window.addEventListener('lingolive_new_notification', handleNewNotification);
    return () => {
      window.removeEventListener('lingolive_new_notification', handleNewNotification);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, showToast: addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    const dummy = () => {};
    return { toasts: [], addToast: dummy, showToast: dummy, removeToast: dummy };
  }
  return context;
};
