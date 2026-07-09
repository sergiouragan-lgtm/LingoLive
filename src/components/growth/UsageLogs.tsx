import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { AuditLog } from '../../types';
import { Clock } from 'lucide-react';

export const UsageLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
      } catch (error) {
        console.error("Error fetching admin logs:", error);
        handleFirestoreError(error, OperationType.LIST, 'admin_logs');
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Clock className="w-6 h-6 text-indigo-600" />
        Logs de Uso e Segurança
      </h3>
      <div className="space-y-4">
        {logs.map(log => (
          <div key={log.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
            <p className="font-semibold text-slate-800">{log.action}</p>
            <p className="text-slate-500">{log.adminEmail} em {new Date(log.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
