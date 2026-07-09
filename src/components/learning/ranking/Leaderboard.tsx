import React from 'react';
import { Trophy } from 'lucide-react';
import { LeaderboardEntry } from '../../../types';

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { name: "Ana Silva", score: 1250, streak: 15, avatar: "https://ui-avatars.com/api/?name=Ana+Silva" },
  { name: "Bruno Santos", score: 1100, streak: 12, avatar: "https://ui-avatars.com/api/?name=Bruno+Santos" },
  { name: "Você (Carlos)", score: 950, streak: 8, avatar: "https://ui-avatars.com/api/?name=Carlos" },
  { name: "Diana Costa", score: 800, streak: 5, avatar: "https://ui-avatars.com/api/?name=Diana+Costa" },
];

export const Leaderboard: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-lg flex items-center gap-2">
            <Trophy className="text-amber-500" size={20} />
            Classificação
        </h2>
      </div>
      <div className="space-y-4">
        {MOCK_LEADERBOARD.map((entry, i) => (
          <div key={entry.name} className={`flex items-center gap-3 p-2 rounded-xl ${entry.name.includes("Você") ? "bg-indigo-50" : ""}`}>
            <span className={`font-bold w-6 ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-slate-500"}`}>{i + 1}º</span>
            <img src={entry.avatar} alt={entry.name} className="w-8 h-8 rounded-full" />
            <div className="flex-1">
                <div className="font-semibold text-sm">{entry.name}</div>
                <div className="text-xs text-slate-500">{entry.score} pts</div>
            </div>
            <div className="text-xs font-bold text-orange-500 flex items-center gap-1">
                🔥 {entry.streak}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
