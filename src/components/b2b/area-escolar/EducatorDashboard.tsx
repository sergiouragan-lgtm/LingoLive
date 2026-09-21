import React, { useState, useEffect } from 'react';
import { ClassReport, StudentPerformance, TranscriptItem } from '../../../types';
import { BarChart3, AlertCircle, BookOpen, Users, Clock, Languages, CreditCard, TrendingUp } from 'lucide-react';
import AnalyticsList from '../../growth/AnalyticsList';
import SubscriptionModal from '../../growth/SubscriptionModal';
import { TranscriptModal } from '../../ai-tutor/TranscriptModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { auth } from '@/firebase';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMonitoring } from '@/hooks/useMonitoring';

interface EducatorDashboardProps {
  report: ClassReport;
  setView: (v: string) => void;
}

export default function EducatorDashboard({ report, setView }: EducatorDashboardProps) {
  const [langOfTheWeek, setLangOfTheWeek] = useState(() => localStorage.getItem('class_lang_of_week') || "Francês");
  const [filterLanguage, setFilterLanguage] = useState<string>("Todos");
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [transcriptModalData, setTranscriptModalData] = useState<{name: string, transcripts: TranscriptItem[]} | null>(null);
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  const filteredStudents = filterLanguage === "Todos"
      ? report.students
      : report.students.filter(s => s.targetLanguage === filterLanguage);

  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance>(filteredStudents[0]);

  useEffect(() => {
    if (userId) {
      trackEvent('educator_dashboard_viewed', {
        totalStudents: report.students.length,
        classSize: report.students.length,
        commonErrorsCount: report.commonErrors.length,
        dashboardType: 'educator'
      });
    }
  }, [userId, trackEvent, report.students.length, report.commonErrors.length]);

  // Mocking trend data as it's not directly in StudentPerformance
  const mockTrendData = [
      { session: 'Sessão 1', score: Math.max(20, selectedStudent.performanceScore - 30), scenario: 'Greetings', duration: '10 min' },
      { session: 'Sessão 2', score: Math.max(30, selectedStudent.performanceScore - 20), scenario: 'Ordering Food', duration: '15 min' },
      { session: 'Sessão 3', score: Math.max(40, selectedStudent.performanceScore - 10), scenario: 'Travel', duration: '12 min' },
      { session: 'Sessão 4', score: selectedStudent.performanceScore, scenario: 'Shopping', duration: '20 min' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-lg">
          <p className="font-semibold text-slate-900">{label}</p>
          <p className="text-indigo-600 font-bold">Score: {payload[0].value}%</p>
          <p className="text-slate-600 text-sm">Cenário: {payload[0].payload.scenario}</p>
          <p className="text-slate-600 text-sm">Duração: {payload[0].payload.duration}</p>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    localStorage.setItem('class_lang_of_week', langOfTheWeek);
    if (userId) {
      trackEvent('educator_dashboard_language_of_week_changed', {
        newLanguage: langOfTheWeek,
        dashboardType: 'educator'
      });
    }
  }, [langOfTheWeek, userId, trackEvent]);

  useEffect(() => {
      setSelectedStudent(filteredStudents[0]);
      if (userId) {
        trackEvent('educator_dashboard_language_filter_changed', {
          selectedLanguage: filterLanguage,
          filteredStudentCount: filteredStudents.length,
          dashboardType: 'educator'
        });
      }
  }, [filterLanguage, userId, trackEvent, filteredStudents.length]);

  const availableLanguages = ["Todos", ...Array.from(new Set(report.students.map(s => s.targetLanguage)))];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="educator-dashboard">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-slate-900">Painel do Educador</h1>
        </div>
        <div className="flex items-center gap-3">
            <button
                onClick={() => {
                  if (userId) {
                    trackEvent('educator_dashboard_subscription_clicked', {
                      dashboardType: 'educator'
                    });
                  }
                  setIsSubscriptionModalOpen(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
                <CreditCard className="w-4 h-4" />
                Assinar Plano
            </button>
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-sm text-slate-500 font-medium ml-2">Filtrar:</span>
                <select 
                    value={filterLanguage}
                    onChange={(e) => setFilterLanguage(e.target.value)}
                    className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg outline-none"
                >
                    {availableLanguages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-sm text-slate-500 font-medium ml-2">Idioma da Semana:</span>
                <input 
                    value={langOfTheWeek} 
                    onChange={(e) => setLangOfTheWeek(e.target.value)}
                    className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg outline-none"
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm md:col-span-1">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Alunos
            </h2>
            <div className="space-y-2">
                {filteredStudents.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => {
                          if (userId) {
                            trackEvent('educator_dashboard_student_selected', {
                              studentName: s.studentName,
                              performanceScore: s.performanceScore,
                              targetLanguage: s.targetLanguage,
                              dashboardType: 'educator'
                            });
                          }
                          setSelectedStudent(s);
                          setTranscriptModalData({ name: s.studentName, transcripts: s.transcripts.slice(-5) });
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all ${selectedStudent.studentName === s.studentName ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"}`}
                    >
                        {s.studentName}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="md:col-span-2 space-y-8">
            <div
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                if (userId) {
                  trackEvent('educator_dashboard_performance_trend_viewed', {
                    studentName: selectedStudent.studentName,
                    currentScore: selectedStudent.performanceScore,
                    dashboardType: 'educator'
                  });
                }
              }}
            >
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Tendência de Desempenho
                </h2>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="session" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    Progresso de {selectedStudent.studentName}
                </h2>
                <div className="space-y-4">
                    {selectedStudent.timeline.map((t, i) => (
                        <div key={i} className="flex gap-4 p-3 bg-slate-50 rounded-xl text-sm">
                            <span className="font-bold text-slate-500 min-w-[100px]">{t.date}</span>
                            <span className="text-slate-800">{t.activity}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                if (userId) {
                  trackEvent('educator_dashboard_vocabulary_viewed', {
                    studentName: selectedStudent.studentName,
                    vocabularyCount: selectedStudent.vocabularyMastery.length,
                    avgMasteryLevel: selectedStudent.vocabularyMastery.length > 0
                      ? Math.round(selectedStudent.vocabularyMastery.reduce((sum, v) => sum + v.masteryLevel, 0) / selectedStudent.vocabularyMastery.length)
                      : 0,
                    dashboardType: 'educator'
                  });
                }
              }}
            >
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Languages className="w-5 h-5 text-indigo-500" />
                    Vocabulário Masterizado
                </h2>
                <div className="flex flex-wrap gap-2">
                    {selectedStudent.vocabularyMastery.map((v, i) => (
                        <div key={i} className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {v.word}: {v.masteryLevel}%
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              if (userId) {
                trackEvent('educator_dashboard_common_errors_viewed', {
                  errorCount: report.commonErrors.length,
                  dashboardType: 'educator'
                });
              }
            }}
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Erros Comuns
            </h2>
            <ul className="space-y-2">
                {report.commonErrors.map((error, i) => (
                <li key={i} className="text-slate-700 bg-slate-50 px-4 py-2 rounded-lg text-sm">{error}</li>
                ))}
            </ul>
            </div>

            <div
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                if (userId) {
                  trackEvent('educator_dashboard_class_performance_viewed', {
                    classSize: filteredStudents.length,
                    avgPerformance: filteredStudents.length > 0
                      ? Math.round(filteredStudents.reduce((sum, s) => sum + s.performanceScore, 0) / filteredStudents.length)
                      : 0,
                    dashboardType: 'educator'
                  });
                }
              }}
            >
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Desempenho da Turma
                </h2>
                <div className="space-y-4">
                    {filteredStudents.map((s, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <span className="font-medium text-slate-800">{s.studentName}</span>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-500">{s.lastPractice}</span>
                                <span className="font-bold text-indigo-600">{s.performanceScore}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <AnalyticsList />
            <SubscriptionModal 
                isOpen={isSubscriptionModalOpen} 
                onClose={() => setIsSubscriptionModalOpen(false)} 
                setView={setView}
            />
            {transcriptModalData && (
                <TranscriptModal 
                    studentName={transcriptModalData.name} 
                    transcripts={transcriptModalData.transcripts}
                    onClose={() => setTranscriptModalData(null)}
                />
            )}
      </div>
    </div>
  );
}
