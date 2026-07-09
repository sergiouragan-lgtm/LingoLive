import React from 'react';
import { AppView } from '../../types';

export const Onboarding: React.FC<{ setView: (view: AppView) => void }> = ({ setView }) => (
    <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <h2 className="text-3xl font-bold mb-6">Personalize seu perfil</h2>
        <p className="mb-8">Responda a 3 perguntas rápidas para criarmos seu plano de estudo.</p>
        <button onClick={() => setView('activation')} className="bg-primary text-white px-8 py-3 rounded-full font-semibold">Continuar</button>
    </div>
);
