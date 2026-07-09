import React from 'react';
import { CreditCard, Wallet, Landmark, Smartphone } from 'lucide-react';

export const PaymentsView: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Pagamentos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
            <CreditCard className="text-blue-600" size={32}/>
            <div>
                <h2 className="font-semibold text-lg">Cartão de Crédito/Débito</h2>
                <p className="text-gray-500">Stripe Integration</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
            <Smartphone className="text-blue-600" size={32}/>
            <div>
                <h2 className="font-semibold text-lg">Multicaixa</h2>
                <p className="text-gray-500">Pagamento Angola</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
            <Landmark className="text-blue-600" size={32}/>
            <div>
                <h2 className="font-semibold text-lg">Transferência Bancária</h2>
                <p className="text-gray-500">Dados da conta</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
            <Wallet className="text-blue-600" size={32}/>
            <div>
                <h2 className="font-semibold text-lg">Wallet Interna</h2>
                <p className="text-gray-500">Saldo atual: $0.00</p>
            </div>
        </div>
      </div>
    </div>
  );
};
