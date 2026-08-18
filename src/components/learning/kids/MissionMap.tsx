import React from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';

interface Node {
  id: number;
  title: string;
  status: 'completed' | 'current' | 'locked';
  icon: string;
  xp: number;
}

interface MissionMapProps {
  nodes: Node[];
}

const nodePositions = [
  { top: '50%', left: '10%' },
  { top: '20%', left: '30%' },
  { top: '50%', left: '50%' },
  { top: '80%', left: '70%' },
  { top: '50%', left: '90%' },
];

const MissionMap: React.FC<MissionMapProps> = ({ nodes }) => {
  const activeMissionIndex = nodes.findIndex(m => m.status === 'current');
  const activePos = nodePositions[activeMissionIndex === -1 ? 0 : activeMissionIndex];
  const [hoveredNode, setHoveredNode] = React.useState<number | null>(null);

  return (
    <div className="w-full bg-white rounded-3xl p-8 shadow-xl relative overflow-hidden h-96">
      <h2 className="text-2xl font-bold text-sky-900 mb-6">Mapa da Aventura</h2>
      
      {/* Winding Path SVG */}
      <svg className="absolute top-0 left-0 w-full h-full -z-0" viewBox="0 0 100 50" preserveAspectRatio="none">
        <path d="M 5 25 Q 25 5, 50 25 T 95 25" stroke="#bae6fd" fill="none" strokeWidth="4" />
      </svg>

      {/* Nodes */}
      {nodes.map((node, index) => (
        <motion.div 
          key={node.id}
          className="absolute flex flex-col items-center z-10 cursor-pointer"
          style={{ top: nodePositions[index].top, left: nodePositions[index].left }}
          onMouseEnter={() => node.status !== 'locked' && setHoveredNode(node.id)}
          onMouseLeave={() => setHoveredNode(null)}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md border-4 ${
            node.status === 'completed' ? 'bg-green-100 border-green-500' :
            node.status === 'current' ? 'bg-yellow-100 border-yellow-500' :
            'bg-gray-100 border-gray-300'
          }`}>
            {node.status === 'locked' ? <Lock className="text-gray-400 w-6 h-6" /> : node.icon}
          </div>
          <span className="mt-1 font-bold text-sky-800 text-xs">{node.title}</span>
          
          {hoveredNode === node.id && (
            <motion.div
              className="absolute -top-12 bg-white p-2 rounded-lg shadow-lg border-2 border-sky-200 z-30 whitespace-nowrap"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <p className="font-bold text-sky-900 text-sm">{node.title}</p>
              <p className="text-yellow-600 text-xs font-semibold">{node.xp} XP</p>
            </motion.div>
          )}
        </motion.div>
      ))}

      {/* Character Animation */}
      <motion.div
        className="absolute text-3xl z-20"
        initial={false}
        animate={{ top: activePos.top, left: activePos.left }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        🦁
      </motion.div>
    </div>
  );
};

export default MissionMap;
