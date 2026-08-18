import React from 'react';
import { motion } from 'motion/react';
import { Baby, Zap, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { AgeGroup } from '../../types';

export type TargetAgeGroup = 'CHILD' | 'TEEN' | 'ADULT';

export interface ProfileVisualState {
  id: TargetAgeGroup;
  title: string;
  range: string;
  tag: string;
  color: string;
  badgeColor: string;
  description: string;
  features: string[];
  icon: typeof Baby | typeof Zap | typeof User;
  containerClasses: string;
  badgeClasses: string;
  isSelected: boolean;
  actionText: string;
}

/**
 * Função pura que calcula e retorna a configuração do estado visual de um perfil de aprendizagem
 * (Criança, Adolescente ou Adulto) em função da faixa etária e do estado de seleção atual.
 * Garantia de computação puramente determinística e reatividade instantânea sem recarregamento da página.
 */
export function getProfileVisualState(
  group: TargetAgeGroup,
  isSelected: boolean
): ProfileVisualState {
  const isChild = group === 'CHILD';
  const isTeen = group === 'TEEN';

  if (isChild) {
    return {
      id: 'CHILD',
      title: 'Criança',
      range: '4 a 11 anos',
      tag: 'Lúdico & Interativo',
      color: 'from-amber-500 to-orange-500',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
      description: 'Metodologia adaptada com vocabulário simples, histórias visuais, jogos pedagógicos e tutoria IA com tom caloroso e encorajador.',
      features: [
        'Histórias interativas e personagens',
        'Jogos de associação visual',
        'Reforço positivo constante',
        'Filtro de conteúdo estrito e seguro'
      ],
      icon: Baby,
      containerClasses: isSelected
        ? 'bg-white dark:bg-slate-900 border-amber-500 shadow-xl ring-2 ring-amber-500/20'
        : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700/60',
      badgeClasses: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
      isSelected,
      actionText: isSelected ? 'Perfil Ativo' : 'Selecionar Perfil Criança'
    };
  }

  if (isTeen) {
    return {
      id: 'TEEN',
      title: 'Adolescente',
      range: '12 a 17 anos',
      tag: 'Dinâmico & Desafiante',
      color: 'from-indigo-500 to-purple-600',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60',
      description: 'Abordagem focada em cultura pop, tecnologia, preparação escolar e conversação dinâmica com tutoria motivadora.',
      features: [
        'Temas de atualidade e cultura digital',
        'Desafios de gamificação e ranking',
        'Apoio a exames e trabalhos escolares',
        'Conversação em ritmo acelerado'
      ],
      icon: Zap,
      containerClasses: isSelected
        ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20'
        : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60',
      badgeClasses: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60',
      isSelected,
      actionText: isSelected ? 'Perfil Ativo' : 'Selecionar Perfil Adolescente'
    };
  }

  return {
    id: 'ADULT',
    title: 'Adulto',
    range: '18 anos ou mais',
    tag: 'Profissional & Prático',
    color: 'from-blue-600 to-cyan-600',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
    description: 'Foco direto em fluência prática, contexto corporativo, viagens, negócios e simulações do mundo real.',
    features: [
      'Inglês de negócios e entrevistas',
      'Simulações de viagens e imigração',
      'Correções gramaticais detalhadas',
      'Flexibilidade total de tópicos'
    ],
    icon: User,
    containerClasses: isSelected
      ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20'
      : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
    badgeClasses: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
    isSelected,
    actionText: isSelected ? 'Perfil Ativo' : 'Selecionar Perfil Adulto'
  };
}

export interface ProfileCardProps {
  groupKey: TargetAgeGroup;
  isSelected: boolean;
  onSelect: (group: TargetAgeGroup) => void;
}

/**
 * Componente que renderiza um cartão individual de perfil de aprendizagem.
 * Utiliza a função pura getProfileVisualState para obter o estado visual de forma síncrona,
 * garantindo reatividade imediata no clique sem reload da página.
 */
export const ProfileCard: React.FC<ProfileCardProps> = React.memo(({
  groupKey,
  isSelected,
  onSelect
}) => {
  const item = getProfileVisualState(groupKey, isSelected);
  const IconComponent = item.icon;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(groupKey)}
      className={`relative rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between ${item.containerClasses}`}
      data-testid={`profile-card-${groupKey.toLowerCase()}`}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400">
          <CheckCircle2 className="w-6 h-6 fill-indigo-600/10" />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${item.color} text-white shadow-md`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              {item.title}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Faixa Etária: {item.range}
            </p>
          </div>
        </div>

        <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${item.badgeColor}`}>
          {item.tag}
        </span>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {item.description}
        </p>

        <ul className="space-y-1.5 pt-2">
          {item.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className={`font-semibold ${isSelected ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
          {item.actionText}
        </span>
        <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-indigo-600 dark:text-indigo-400 translate-x-1' : 'text-slate-400'}`} />
      </div>
    </motion.div>
  );
});

ProfileCard.displayName = 'ProfileCard';
