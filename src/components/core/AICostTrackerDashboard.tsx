import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TokenUsage {
  id: string;
  userId: string;
  model: string;
  tokens: number;
  timestamp: any;
}

export default function AICostTrackerDashboard() {
  const [data, setData] = useState<TokenUsage[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'ai_token_usage'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TokenUsage[];
      setData(newData);
    });

    return () => unsubscribe();
  }, []);

  // Process data for charts
  const modelUsage = data.reduce((acc, curr) => {
    acc[curr.model] = (acc[curr.model] || 0) + curr.tokens;
    return acc;
  }, {} as Record<string, number>);

  const userUsage = data.reduce((acc, curr) => {
    acc[curr.userId] = (acc[curr.userId] || 0) + curr.tokens;
    return acc;
  }, {} as Record<string, number>);

  const modelChartData = Object.entries(modelUsage).map(([name, tokens]) => ({
    name,
    tokens
  }));

  const userChartData = Object.entries(userUsage).map(([name, tokens]) => ({
    name: name.substring(0, 8) + '...', // abbreviate user id
    tokens
  }));

  return (
    <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-8">
      <h2 className="text-xl font-bold">Monitoramento de Consumo de Tokens IA</h2>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Por Modelo</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={modelChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tokens" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Por Usuário</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={userChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tokens" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
