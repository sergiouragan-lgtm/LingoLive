import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Search, X, Save, AlertCircle,
  Clock, Users, BookOpen, Mail, CheckCircle2, Loader,
  RefreshCw, Eye, EyeOff, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../../firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query,
  where, onSnapshot, Timestamp, getDocs, writeBatch
} from 'firebase/firestore';
import { CloudFunctionService } from '../../../services/CloudFunctionService';

// Types
interface Classroom {
  id: string;
  name: string;
  grade: number;
  section: string;
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  teacherUid: string;
  teacherName?: string;
  teacherEmail?: string;
  capacity: number;
  enrolledCount: number;
  schedule: {
    startTime: string;
    endTime: string;
    days: string[];
    room: string;
  };
  curriculum: {
    primaryLanguage: string;
    topics: string[];
    materials: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Teacher {
  uid: string;
  name: string;
  email: string;
  languages: string[];
}

interface FormData {
  name: string;
  grade: number;
  section: string;
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  teacherUid: string;
  capacity: number;
  startTime: string;
  endTime: string;
  days: string[];
  room: string;
  topics: string;
}

interface ClassroomManagerProps {
  schoolId: string;
  onClassroomCreated?: (classroom: Classroom) => void;
  onSync?: () => void;
}

const CEFRLEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LANGUAGES = ['English', 'French', 'Spanish', 'Chinese', 'Portuguese', 'German'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const initialFormData: FormData = {
  name: '',
  grade: 5,
  section: 'A',
  language: 'English',
  level: 'A1',
  teacherUid: '',
  capacity: 30,
  startTime: '08:00',
  endTime: '10:00',
  days: ['Monday', 'Wednesday', 'Friday'],
  room: '',
  topics: ''
};

export const ClassroomManager: React.FC<ClassroomManagerProps> = ({
  schoolId,
  onClassroomCreated,
  onSync
}) => {
  // State
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Fetch classrooms
  useEffect(() => {
    if (!schoolId) return;

    const q = query(
      collection(db, 'schools', schoolId, 'classrooms')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Classroom[];
      setClassrooms(data);
    }, (err) => {
      console.error('Error fetching classrooms:', err);
      setError('Erro ao carregar turmas');
    });

    return () => unsubscribe();
  }, [schoolId]);

  // Fetch teachers
  useEffect(() => {
    if (!schoolId) return;

    const q = query(
      collection(db, 'schools', schoolId, 'teachers')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as Teacher[];
      setTeachers(data);
    }, (err) => {
      console.error('Error fetching teachers:', err);
    });

    return () => unsubscribe();
  }, [schoolId]);

  // Get teacher name for classroom
  const getTeacherName = (uid: string): { name: string; email: string } | null => {
    const teacher = teachers.find(t => t.uid === uid);
    return teacher ? { name: teacher.name, email: teacher.email } : null;
  };

  // Filtered classrooms
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.room.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = filterLevel === 'all' || c.level === filterLevel;
      const matchesLanguage = filterLanguage === 'all' || c.language === filterLanguage;
      return matchesSearch && matchesLevel && matchesLanguage;
    });
  }, [classrooms, searchQuery, filterLevel, filterLanguage]);

  // Handle form change
  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle day toggle
  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Nome da turma é obrigatório');
      return false;
    }
    if (!formData.teacherUid) {
      setError('Selecione um professor');
      return false;
    }
    if (!formData.room.trim()) {
      setError('Sala é obrigatória');
      return false;
    }
    if (formData.days.length === 0) {
      setError('Selecione pelo menos um dia da semana');
      return false;
    }
    if (formData.capacity < 1) {
      setError('Capacidade mínima: 1 aluno');
      return false;
    }
    return true;
  };

  // Handle save
  const handleSave = async () => {
    setError(null);
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingId) {
        // Update via Cloud Function
        const response = await CloudFunctionService.updateClassroom(editingId, {
          name: formData.name,
          teacherUid: formData.teacherUid,
          classroomId: editingId
        });

        if (!response.success) {
          throw new Error(response.message || 'Erro ao atualizar turma');
        }

        setSuccessMessage(`Turma ${formData.name} atualizada com sucesso!`);
        setEditingId(null);
      } else {
        // Create via Cloud Function
        const response = await CloudFunctionService.createClassroom({
          schoolId,
          name: formData.name,
          teacherUid: formData.teacherUid
        });

        if (!response.success) {
          throw new Error(response.message || 'Erro ao criar turma');
        }

        setSuccessMessage(`Turma ${formData.name} criada com sucesso!`);
        onClassroomCreated?.(response.data as unknown as Classroom);
      }

      setFormData(initialFormData);
      setShowForm(false);
    } catch (err) {
      console.error('Error saving classroom:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar turma. Tente novamente.');
    } finally {
      setLoading(false);
    }

    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Handle edit
  const handleEdit = (classroom: Classroom) => {
    setFormData({
      name: classroom.name,
      grade: classroom.grade,
      section: classroom.section,
      language: classroom.language,
      level: classroom.level,
      teacherUid: classroom.teacherUid,
      capacity: classroom.capacity,
      startTime: classroom.schedule.startTime,
      endTime: classroom.schedule.endTime,
      days: classroom.schedule.days,
      room: classroom.schedule.room,
      topics: classroom.curriculum.topics.join(', ')
    });
    setEditingId(classroom.id);
    setShowForm(true);
    setSelectedClassroom(classroom);
  };

  // Handle delete
  const handleDelete = async (classroomId: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'schools', schoolId, 'classrooms', classroomId));
      setSuccessMessage('Turma eliminada com sucesso');
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting classroom:', err);
      setError('Erro ao eliminar turma');
    } finally {
      setLoading(false);
    }

    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Handle sync
  const handleSync = async () => {
    setSyncing(true);
    try {
      // Simulate sync with a slight delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccessMessage('Turmas sincronizadas com sucesso');
      onSync?.();
    } catch (err) {
      setError('Erro ao sincronizar');
    } finally {
      setSyncing(false);
    }

    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Turmas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Crie e gerencie turmas, atribua professores e configure horários
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData(initialFormData);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-semibold shadow-md"
          >
            <Plus size={16} />
            <span>Nova Turma</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="text-rose-600 flex-shrink-0" size={20} />
            <p className="text-sm text-rose-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-rose-600 hover:text-rose-800"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
          >
            <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={20} />
            <p className="text-sm text-emerald-800">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Filtrar por nome da turma ou sala..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
          >
            <option value="all">Todos os Níveis</option>
            {CEFRLEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
          >
            <option value="all">Todos os Idiomas</option>
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingId ? 'Editar Turma' : 'Criar Nova Turma'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name and Grade */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">
                      Nome da Turma *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 5º Ano A"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">
                      Ano *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={formData.grade}
                      onChange={(e) => handleFormChange('grade', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">
                      Seção *
                    </label>
                    <input
                      type="text"
                      placeholder="A, B, C..."
                      value={formData.section}
                      onChange={(e) => handleFormChange('section', e.target.value.toUpperCase())}
                      maxLength={1}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Language and Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">
                      Idioma *
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => handleFormChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-1">
                      Nível CEFR *
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) => handleFormChange('level', e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                    >
                      {CEFRLEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Teacher */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">
                    Professor Responsável *
                  </label>
                  <select
                    value={formData.teacherUid}
                    onChange={(e) => handleFormChange('teacherUid', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Selecione um professor...</option>
                    {teachers.map(teacher => (
                      <option key={teacher.uid} value={teacher.uid}>
                        {teacher.name} ({teacher.languages.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Capacity */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">
                    Capacidade *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.capacity}
                    onChange={(e) => handleFormChange('capacity', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Schedule */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 text-sm">Horário</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Início
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleFormChange('startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Fim
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleFormChange('endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Sala *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Sala 4"
                        value={formData.room}
                        onChange={(e) => handleFormChange('room', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-2">
                      Dias da Semana *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <button
                          key={day}
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                            formData.days.includes(day)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Topics */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">
                    Tópicos Principais
                  </label>
                  <textarea
                    placeholder="Ex: Present Perfect, Modal Verbs, Phrasal Verbs (separar por vírgula)"
                    value={formData.topics}
                    onChange={(e) => handleFormChange('topics', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{editingId ? 'Atualizar' : 'Criar'} Turma</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredClassrooms.length > 0 ? (
            filteredClassrooms.map((classroom, idx) => (
              <motion.div
                key={classroom.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{classroom.name}</h3>
                    <p className="text-xs text-slate-500">
                      Ano {classroom.grade} | {classroom.language}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                    {classroom.level}
                  </span>
                </div>

                {/* Info Grid */}
                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users size={14} className="text-indigo-600" />
                    <span>{classroom.enrolledCount}/{classroom.capacity} alunos</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={14} className="text-amber-600" />
                    <span>
                      {classroom.schedule.startTime} - {classroom.schedule.endTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <BookOpen size={14} className="text-emerald-600" />
                    <span>{classroom.schedule.room}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} className="text-rose-600" />
                    <span className="truncate">
                      {getTeacherName(classroom.teacherUid)?.name || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Topics */}
                {classroom.curriculum.topics.length > 0 && (
                  <div className="mb-4 pb-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Tópicos:</p>
                    <div className="flex flex-wrap gap-1">
                      {classroom.curriculum.topics.slice(0, 2).map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                      {classroom.curriculum.topics.length > 2 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full">
                          +{classroom.curriculum.topics.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(classroom)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all text-xs font-semibold"
                  >
                    <Edit2 size={12} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(classroom.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-all text-xs font-semibold"
                  >
                    <Trash2 size={12} />
                    <span>Eliminar</span>
                  </button>
                </div>

                {/* Delete Confirm */}
                <AnimatePresence>
                  {showDeleteConfirm === classroom.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        className="bg-white p-4 rounded-xl shadow-lg text-center space-y-3 mx-2"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          Tem a certeza? Esta ação é irreversível.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleDelete(classroom.id)}
                            disabled={loading}
                            className="flex-1 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
                          >
                            {loading ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhuma turma encontrada</p>
              <p className="text-sm text-slate-400">
                {searchQuery || filterLevel !== 'all' || filterLanguage !== 'all'
                  ? 'Tente ajustar os filtros'
                  : 'Crie a sua primeira turma clicando em "Nova Turma"'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
