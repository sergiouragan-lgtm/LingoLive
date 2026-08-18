import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import MissionMap from '../../learning/kids/MissionMap';

const kidsNodes = [
  { id: 1, title: 'Floresta', status: 'completed', icon: '🌲', xp: 50 },
  { id: 2, title: 'Rio', status: 'completed', icon: '🌊', xp: 80 },
  { id: 3, title: 'Montanha', status: 'current', icon: '🏔️', xp: 120 },
  { id: 4, title: 'Caverna', status: 'locked', icon: '💎', xp: 200 },
  { id: 5, title: 'Castelo', status: 'locked', icon: '🏰', xp: 500 },
] as const;

const KidsDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-sky-100 p-6 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-sky-800">Olá, Explorador!</h1>
        <div className="flex items-center gap-4 bg-white p-3 rounded-full shadow-lg">
          <Star className="text-yellow-400 w-8 h-8" fill="currentColor" />
          <span className="text-2xl font-bold text-sky-800">1250 XP</span>
        </div>
      </header>

      <div className="w-full max-w-4xl grid grid-cols-1 gap-6">
        <motion.div 
          className="bg-white rounded-3xl p-8 shadow-xl flex items-center justify-between"
          whileHover={{ scale: 1.02 }}
        >
          <div>
            <h2 className="text-2xl font-bold text-sky-900 mb-2">Missão do Dia</h2>
            <p className="text-sky-600 text-lg">Ajuda o Leo a encontrar o tesouro perdido!</p>
          </div>
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl"
          >
            🦁
          </motion.div>
        </motion.div>

        <MissionMap nodes={kidsNodes} />
      </div>
    </div>
  );
};

export default KidsDashboard;
