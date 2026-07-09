import React from 'react';
import { Gift, Share2, Tag, Percent, Megaphone } from 'lucide-react';

export const MarketingView: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Marketing</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <Gift className="text-pink-500" size={32}/>
            <h2 className="font-semibold text-lg">Sistema de Indicação</h2>
            <p className="text-gray-500">Convide amigos e ganhe</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <Share2 className="text-indigo-500" size={32}/>
            <h2 className="font-semibold text-lg">Afiliados</h2>
            <p className="text-gray-500">Torne-se um afiliado</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <Tag className="text-green-500" size={32}/>
            <h2 className="font-semibold text-lg">Cupons</h2>
            <p className="text-gray-500">Gerir cupons de desconto</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <Percent className="text-yellow-500" size={32}/>
            <h2 className="font-semibold text-lg">Promoções</h2>
            <p className="text-gray-500">Criar campanhas</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <Megaphone className="text-red-500" size={32}/>
            <h2 className="font-semibold text-lg">Ads Integration</h2>
            <p className="text-gray-500">Meta Ads Manager</p>
        </div>
      </div>
    </div>
  );
};
