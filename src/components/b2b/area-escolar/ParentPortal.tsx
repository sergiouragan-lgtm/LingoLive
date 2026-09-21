import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Search, X, Save, AlertCircle, Mail,
  CheckCircle2, Loader, TrendingUp, BarChart3, Calendar, Award,
  BookOpen, MessageCircle, DollarSign, Eye, EyeOff, Phone,
  User, LogOut, Settings, Download, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../../firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query,
  where, onSnapshot, Timestamp, getDocs
} from 'firebase/firestore';

interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  children: string[];
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Student {
  id: string;
  name: string;
  email: string;
  grade: number;
  classroomId: string;
  classroomName?: string;
  targetLanguage: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  status: 'active' | 'inactive' | 'suspended';
}

interface StudentProgress {
  studentId: string;
  totalLessonsCompleted: number;
  totalMinutesSpent: number;
  averageAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  performanceScore: number;
  lastActivityAt: Timestamp;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  vocabularyMastered: number;
  grammarMastered: number;
  speakingScore: number;
  listeningScore: number;
  readingScore: number;
  writingScore: number;
}

interface Assignment {
  id: string;
  studentId: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  submittedAt?: Timestamp;
  score?: number;
  feedback?: string;
  status: 'pending' | 'submitted' | 'graded';
}

interface ParentPortalProps {
  schoolId: string;
  parentId: string;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  schoolId,
  parentId
}) => {
  // State
  const [parent, setParent] = useState<Parent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Map<string, StudentProgress>>(new Map());
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'assignments' | 'settings'>('overview');

  // Fetch parent data
  useEffect(() => {
    if (!parentId) return;

    const parentRef = doc(db, 'schools', schoolId, 'parents', parentId);
    const unsubscribe = onSnapshot(parentRef, (snapshot) => {
      if (snapshot.exists()) {
        setParent({
          id: snapshot.id,
          ...snapshot.data()
        } as Parent);
      }
    }, (err) => {
      console.error('Error fetching parent:', err);
      setError('Erro ao carregar dados do responsável');
    });

    return () => unsubscribe();
  }, [schoolId, parentId]);

  // Fetch students linked to parent
  useEffect(() => {
    if (!parent?.children || parent.children.length === 0) {
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      try {
        const studentPromises = parent.children.map(studentId =>
          getDocs(
            query(
              collection(db, 'schools', schoolId, 'students'),
              where('id', '==', studentId)
            )
          ).then(snapshot => {
            if (!snapshot.empty) {
              return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
              } as Student;
            }
            return null;
          })
        );

        const studentData = (await Promise.all(studentPromises)).filter(s => s !== null) as Student[];
        setStudents(studentData);

        if (studentData.length > 0 && !selectedStudentId) {
          setSelectedStudentId(studentData[0].id);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    };

    fetchStudents();
  }, [parent, schoolId, selectedStudentId]);

  // Fetch progress for selected student
  useEffect(() => {
    if (!selectedStudentId) return;

    const progressRef = doc(
      db,
      'schools',
      schoolId,
      'students',
      selectedStudentId,
      'progress',
      'latest'
    );

    const unsubscribe = onSnapshot(progressRef, (snapshot) => {
      if (snapshot.exists()) {
        setProgress(prev => new Map(prev).set(selectedStudentId, {
          studentId: selectedStudentId,
          ...snapshot.data()
        } as StudentProgress));
      }
    }, (err) => {
      console.error('Error fetching progress:', err);
    });

    return () => unsubscribe();
  }, [selectedStudentId, schoolId]);

  // Fetch assignments for selected student
  useEffect(() => {
    if (!selectedStudentId) return;

    const q = query(
      collection(db, 'schools', schoolId, 'assignments'),
      where('studentId', '==', selectedStudentId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assignment[];
      setAssignments(data);
    }, (err) => {
      console.error('Error fetching assignments:', err);
    });

    return () => unsubscribe();
  }, [selectedStudentId, schoolId]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const selectedProgress = useMemo(() => {
    return selectedStudentId ? progress.get(selectedStudentId) : undefined;
  }, [selectedStudentId, progress]);

  const pendingAssignments = useMemo(() => {
    return assignments.filter(a => a.status === 'pending' || a.status === 'submitted');
  }, [assignments]);

  const handleDownloadReport = () => {
    if (!selectedStudent || !selectedProgress) return;

    const report = `
RELATÓRIO DE PROGRESSO DO ALUNO
Período: ${new Date().toLocaleDateString('pt-BR')}

====================================================
INFORMAÇÕES DO ALUNO
====================================================
Nome: ${selectedStudent.name}
Email: ${selectedStudent.email}
Turma: ${selectedStudent.classroomName || 'N/A'}
Série: ${selectedStudent.grade}
Idioma: ${selectedStudent.targetLanguage}
Nível Atual: ${selectedStudent.level}

====================================================
DESEMPENHO
====================================================
Pontuação de Desempenho: ${selectedProgress.performanceScore || 0}%
Acurácia Média: ${selectedProgress.averageAccuracy || 0}%
Sequência Atual: ${selectedProgress.currentStreak || 0} dias
Melhor Sequência: ${selectedProgress.longestStreak || 0} dias

Aulas Completadas: ${selectedProgress.totalLessonsCompleted || 0}
Minutos Gastos: ${selectedProgress.totalMinutesSpent || 0}

====================================================
HABILIDADES
====================================================
Vocabulário Dominado: ${selectedProgress.vocabularyMastered || 0} palavras
Gramática Dominada: ${selectedProgress.grammarMastered || 0} estruturas

Pronúncia: ${selectedProgress.speakingScore || 0}%
Compreensão Oral: ${selectedProgress.listeningScore || 0}%
Leitura: ${selectedProgress.readingScore || 0}%
Escrita: ${selectedProgress.writingScore || 0}%

====================================================
ÚLTIMAS ATIVIDADES
====================================================
Última Atividade: ${selectedProgress.lastActivityAt ? new Date(selectedProgress.lastActivityAt.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}

Obs.: Este relatório foi gerado automaticamente pelo portal de responsáveis LingoLive.
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${selectedStudent.name}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Portal de Responsáveis</h1>
            <p className="text-sm text-slate-600 mt-1">Acompanhe o progresso do seu filho</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
              <User className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-700">{parent?.name || 'Responsável'}</span>
            </div>
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Student Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Seus Filhos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {students.map((student) => (
              <motion.button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedStudentId === student.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <h3 className="font-semibold text-slate-900">{student.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{student.classroomName || `Série ${student.grade}`}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {student.level}
                  </span>
                  <span className="text-xs text-slate-500">{student.targetLanguage}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {selectedStudent && selectedProgress ? (
          <>
            {/* Tabs */}
            <div className="mb-8 flex gap-4 border-b border-slate-200">
              {(['overview', 'progress', 'assignments', 'settings'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'overview' && 'Visão Geral'}
                  {tab === 'progress' && 'Progresso'}
                  {tab === 'assignments' && 'Tarefas'}
                  {tab === 'settings' && 'Configurações'}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Desempenho</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          {selectedProgress.performanceScore || 0}%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Aulas Completas</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          {selectedProgress.totalLessonsCompleted || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Sequência Atual</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          {selectedProgress.currentStreak || 0} dias
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Tempo Total</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          {Math.round((selectedProgress.totalMinutesSpent || 0) / 60)} h
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Skills Overview */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">Habilidades Linguísticas</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Pronúncia', value: selectedProgress.speakingScore || 0 },
                      { label: 'Compreensão Oral', value: selectedProgress.listeningScore || 0 },
                      { label: 'Leitura', value: selectedProgress.readingScore || 0 },
                      { label: 'Escrita', value: selectedProgress.writingScore || 0 }
                    ].map((skill) => (
                      <div key={skill.label}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-slate-700">{skill.label}</label>
                          <span className="text-sm font-semibold text-slate-900">{skill.value}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.value}%` }}
                            transition={{ duration: 0.8 }}
                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Assignments */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Tarefas Pendentes</h3>
                  {pendingAssignments.length > 0 ? (
                    <div className="space-y-3">
                      {pendingAssignments.slice(0, 3).map((assignment) => (
                        <div key={assignment.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-slate-900">{assignment.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              assignment.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {assignment.status === 'pending' ? 'Pendente' : 'Enviada'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{assignment.description}</p>
                          <p className="text-sm text-slate-500">
                            Vencimento: {new Date(assignment.dueDate.seconds * 1000).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 text-center py-6">Nenhuma tarefa pendente</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumo de Progresso</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-4">Vocabulário & Gramática</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Palavras Dominadas</p>
                          <p className="text-2xl font-bold text-indigo-600">
                            {selectedProgress.vocabularyMastered || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Estruturas Gramaticais</p>
                          <p className="text-2xl font-bold text-indigo-600">
                            {selectedProgress.grammarMastered || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 mb-4">Estatísticas de Aprendizado</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Acurácia Média</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {selectedProgress.averageAccuracy || 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Melhor Sequência</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {selectedProgress.longestStreak || 0} dias
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar Relatório Completo
                </button>
              </motion.div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Todas as Tarefas</h3>
                  </div>
                  {assignments.length > 0 ? (
                    <div className="divide-y divide-slate-200">
                      {assignments.map((assignment) => (
                        <div key={assignment.id} className="p-6 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-900">{assignment.title}</h4>
                              <p className="text-sm text-slate-600 mt-1">{assignment.description}</p>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                              assignment.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : assignment.status === 'submitted'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {assignment.status === 'pending'
                                ? 'Pendente'
                                : assignment.status === 'submitted'
                                ? 'Enviada'
                                : 'Avaliada'}
                            </span>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-slate-600">
                            <div>Vencimento: {new Date(assignment.dueDate.seconds * 1000).toLocaleDateString('pt-BR')}</div>
                            {assignment.score !== undefined && (
                              <div className="font-semibold text-slate-900">
                                Nota: {assignment.score}%
                              </div>
                            )}
                          </div>
                          {assignment.feedback && (
                            <div className="mt-3 p-3 bg-slate-100 rounded text-sm text-slate-700">
                              <p className="font-medium mb-1">Feedback do Professor:</p>
                              <p>{assignment.feedback}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600">Nenhuma tarefa encontrada</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Informações Pessoais</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">Nome</label>
                      <input
                        type="text"
                        value={parent?.name || ''}
                        disabled
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">Email</label>
                      <input
                        type="email"
                        value={parent?.email || ''}
                        disabled
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">Telefone</label>
                      <input
                        type="tel"
                        value={parent?.phone || ''}
                        disabled
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Notificações</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                      <span className="text-slate-900">Receber atualizações de progresso</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                      <span className="text-slate-900">Receber notificação de novas tarefas</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                      <span className="text-slate-900">Receber feedback dos professores</span>
                    </label>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Suporte</h3>
                  <div className="space-y-3">
                    <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full">
                      <MessageCircle className="w-4 h-4" />
                      Entre em contato com suporte
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full">
                      <Mail className="w-4 h-4" />
                      Fale com um professor
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Selecione um aluno para visualizar detalhes</p>
          </div>
        )}
      </div>
    </div>
  );
};
