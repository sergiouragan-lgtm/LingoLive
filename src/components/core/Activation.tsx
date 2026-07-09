import React from 'react';
import { AppView } from '../../types';

export const Activation: React.FC<{ setView: (view: AppView) => void }> = ({ setView }) => (
    <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <h2 className="text-3xl font-bold mb-6">Bem-vindo!</h2>
        <p className="mb-8">Vamos aprender sua primeira frase em inglês.</p>
        <button onClick={() => setView('dashboard')} className="bg-primary text-white px-8 py-3 rounded-full font-semibold">Iniciar Agora</button>
    </div>
);
