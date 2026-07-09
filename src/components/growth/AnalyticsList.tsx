import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { BarChart3 } from 'lucide-react';

interface Analytic {
    id: string;
    alunoId: string;
    detected_error: string;
    correction: string;
    pedagogical_note: string;
    timestamp: any;
}

export default function AnalyticsList() {
    const [analytics, setAnalytics] = useState<Analytic[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'analytics'), orderBy('timestamp', 'desc'), limit(10));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Analytic));
            setAnalytics(data);
            setError(null);
        }, (err) => {
            console.error("Firestore error:", err);
            setError("Sem permissão para carregar os dados.");
            try {
                handleFirestoreError(err, OperationType.LIST, 'analytics');
            } catch (handledErr) {
                // Keep the error flowing or handled
            }
        });
        return unsubscribe;
    }, []);

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Insights Pedagógicos (AI)
            </h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="space-y-4">
                {!error && analytics.length === 0 && <p className="text-slate-500">Sem dados de prática recentes.</p>}
                {!error && analytics.map((a) => (
                    <div key={a.id} className="p-4 bg-slate-50 rounded-xl text-sm border border-slate-100">
                        <p className="font-semibold text-slate-800">Erro: {a.detected_error}</p>
                        <p className="text-emerald-700">Correção: {a.correction}</p>
                        <p className="text-slate-600 italic">Nota: {a.pedagogical_note}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
