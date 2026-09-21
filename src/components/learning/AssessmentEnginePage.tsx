import React, { useEffect } from 'react';
import { AssessmentEngine } from './AssessmentEngine';
import { ArrowLeft } from 'lucide-react';
import { auth } from '../../firebase';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';

interface AssessmentEnginePageProps {
  setView?: (view: any) => void;
}

export const AssessmentEnginePage: React.FC<AssessmentEnginePageProps> = ({ setView }) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('assessment_engine_page_viewed', {
        pageName: 'Assessment Engine Simulator',
        pageType: 'adaptive_assessment_interface'
      });
    }
  }, [userId, trackEvent]);

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <button 
          onClick={() => setView?.("assessment-platform")}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Módulo de Avaliação
        </button>
        <h1 className="text-3xl font-black text-slate-800 mb-2">Simulador de Motor Adaptativo IACE</h1>
        <p className="text-slate-500 text-sm">Esta interface demonstra o comportamento do motor de exames adaptativos da LingoLIVE IA. A dificuldade (1-5) ajusta-se automaticamente com base na precisão da sua resposta.</p>
      </div>
      <AssessmentEngine />
    </div>
  );
};
