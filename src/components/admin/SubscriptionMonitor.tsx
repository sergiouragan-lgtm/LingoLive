import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../../firebase';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';

interface UserSubscription {
  id: string;
  name: string;
  email: string;
  subscriptionActive: boolean;
  paidUntil?: string;
}

export const SubscriptionMonitor = () => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Lifecycle tracking
  useEffect(() => {
    if (userId) {
      trackEvent('subscription_monitor_accessed', {
        initialLoadingState: loading,
      });
    }
  }, [userId, trackEvent]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const q = query(collection(db, 'users'), where('subscriptionActive', '==', true));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserSubscription));
        setSubscriptions(data);

        if (userId) {
          trackEvent('subscription_monitor_loaded', {
            activeSubscriptionCount: data.length,
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
        if (userId) {
          trackEvent('subscription_monitor_error', {
            errorMessage: String(error),
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, [userId, trackEvent]);

  if (loading) return <div className="p-4 text-center">Carregando assinaturas...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-6">Monitor de Assinaturas Recorrentes</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-3 px-4 text-sm font-medium text-gray-500">Nome</th>
              <th className="py-3 px-4 text-sm font-medium text-gray-500">Email</th>
              <th className="py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              <th className="py-3 px-4 text-sm font-medium text-gray-500">Data Expiração</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map(sub => (
              <tr key={sub.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-sm">{sub.name}</td>
                <td className="py-3 px-4 text-sm">{sub.email}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    sub.subscriptionActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {sub.subscriptionActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">{sub.paidUntil ? new Date(sub.paidUntil).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
