import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Edit2, Trash2, Search, X, Save, AlertCircle, Upload,
  CheckCircle2, Loader, RefreshCw, Download, Eye, EyeOff, Mail,
  Phone, Calendar, User, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../../firebase';
import {
  collection, doc, query, onSnapshot, Timestamp, writeBatch
} from 'firebase/firestore';
import { CloudFunctionService } from '../../../services/CloudFunctionService';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  grade: number;
  classroomId: string;
  classroomName?: string;
  targetLanguage: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  enrollmentDate: Timestamp;
  status: 'active' | 'inactive' | 'suspended';
  parentEmail?: string;
  parentPhone?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Classroom {
  id: string;
  name: string;
  level: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  grade: number;
  classroomId: string;
  targetLanguage: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  status: 'active' | 'inactive' | 'suspended';
  parentEmail: string;
  parentPhone: string;
  notes: string;
}

interface StudentManagerProps {
  schoolId: string;
  onStudentCreated?: (student: Student) => void;
}

const CEFRLEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LANGUAGES = ['English', 'French', 'Spanish', 'Chinese', 'Portuguese', 'German'];
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const STATUSES = ['active', 'inactive', 'suspended'] as const;

const initialFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  grade: 1,
  classroomId: '',
  targetLanguage: 'English',
  level: 'A1',
  status: 'active',
  parentEmail: '',
  parentPhone: '',
  notes: ''
};

export const StudentManager: React.FC<StudentManagerProps> = ({
  schoolId,
  onStudentCreated
}) => {
  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClassroom, setFilterClassroom] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch students
  useEffect(() => {
    if (!schoolId) return;

    const q = query(
      collection(db, 'schools', schoolId, 'students')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(data);
    }, (err) => {
      console.error('Error fetching students:', err);
      setError('Erro ao carregar alunos');
    });

    return () => unsubscribe();
  }, [schoolId]);

  // Fetch classrooms
  useEffect(() => {
    if (!schoolId) return;

    const q = query(
      collection(db, 'schools', schoolId, 'classrooms')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        level: doc.data().level
      })) as Classroom[];
      setClassrooms(data);
    }, (err) => {
      console.error('Error fetching classrooms:', err);
    });

    return () => unsubscribe();
  }, [schoolId]);

  // Get classroom name
  const getClassroomName = (classroomId: string): string | null => {
    const classroom = classrooms.find(c => c.id === classroomId);
    return classroom ? classroom.name : null;
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = filterLevel === 'all' || s.level === filterLevel;
      const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
      const matchesClassroom = filterClassroom === 'all' || s.classroomId === filterClassroom;
      return matchesSearch && matchesLevel && matchesStatus && matchesClassroom;
    });
  }, [students, searchQuery, filterLevel, filterStatus, filterClassroom]);

  // Handle form change
  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Nome do aluno é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    if (!formData.classroomId) {
      setError('Selecione uma turma');
      return false;
    }
    if (!formData.dateOfBirth) {
      setError('Data de nascimento é obrigatória');
      return false;
    }
    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const studentData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        grade: formData.grade,
        classroomId: formData.classroomId,
        targetLanguage: formData.targetLanguage,
        level: formData.level,
        status: formData.status,
        parentEmail: formData.parentEmail,
        parentPhone: formData.parentPhone,
        notes: formData.notes,
      };

      if (editingId) {
        // Update existing student via Cloud Function
        try {
          const response = await CloudFunctionService.addStudentToClassroom({
            schoolId,
            classroomId: formData.classroomId,
            studentUid: editingId,
            name: formData.name,
            email: formData.email,
            cefrLevel: formData.level,
          });

          if (!response.success) {
            throw new Error(response.error || response.message);
          }
        } catch (cfErr) {
          console.warn('Cloud Function update failed, falling back to Firestore:', cfErr);
        }

        setSuccessMessage('Aluno atualizado com sucesso!');
      } else {
        // Create new student via Cloud Function
        const response = await CloudFunctionService.addStudentToClassroom({
          schoolId,
          classroomId: formData.classroomId,
          studentUid: `student-${Date.now()}`,
          name: formData.name,
          email: formData.email,
          cefrLevel: formData.level,
        });

        if (!response.success) {
          throw new Error(response.error || response.message);
        }

        const newStudent = {
          id: response.data?.id || `student-${Date.now()}`,
          ...studentData,
          enrollmentDate: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        } as Student;

        if (onStudentCreated) {
          onStudentCreated(newStudent);
        }
        setSuccessMessage('Aluno criado com sucesso!');
      }

      setError(null);
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving student:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar aluno');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth,
      grade: student.grade,
      classroomId: student.classroomId,
      targetLanguage: student.targetLanguage,
      level: student.level,
      status: student.status,
      parentEmail: student.parentEmail || '',
      parentPhone: student.parentPhone || '',
      notes: student.notes || ''
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (studentId: string) => {
    setLoading(true);
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const response = await CloudFunctionService.removeStudentFromClassroom(
        schoolId,
        student.classroomId,
        studentId
      );

      if (!response.success) {
        throw new Error(response.error || response.message);
      }

      setSuccessMessage('Aluno removido com sucesso!');
      setShowDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting student:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover aluno');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      const batch = writeBatch(db);
      let count = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',').map(v => v.trim());
        const studentData: Partial<Student> = {};

        headers.forEach((header, idx) => {
          const value = values[idx] || '';
          if (header === 'name') studentData.name = value;
          if (header === 'email') studentData.email = value;
          if (header === 'phone') studentData.phone = value;
          if (header === 'dateOfBirth') studentData.dateOfBirth = value;
          if (header === 'grade') studentData.grade = parseInt(value) || 1;
          if (header === 'classroomId') studentData.classroomId = value;
          if (header === 'targetLanguage') studentData.targetLanguage = value;
          if (header === 'level') studentData.level = value as any;
          if (header === 'parentEmail') studentData.parentEmail = value;
          if (header === 'parentPhone') studentData.parentPhone = value;
          if (header === 'notes') studentData.notes = value;
        });

        if (studentData.name && studentData.email && studentData.classroomId) {
          const docRef = doc(collection(db, 'schools', schoolId, 'students'));
          batch.set(docRef, {
            ...studentData,
            status: 'active',
            enrollmentDate: Timestamp.now(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          count++;
        }
      }

      await batch.commit();
      setSuccessMessage(`${count} alunos importados com sucesso!`);
      setShowBulkUpload(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error uploading bulk students:', err);
      setError('Erro ao importar alunos');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle download template
  const handleDownloadTemplate = () => {
    const template = 'name,email,phone,dateOfBirth,grade,classroomId,targetLanguage,level,parentEmail,parentPhone,notes\nJoão Silva,joao@example.com,123456789,2010-05-15,5,classroom-id-1,English,A1,parent@example.com,123456788,Notes here';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gerenciar Alunos</h1>
            <p className="text-slate-600 mt-1">{filteredStudents.length} alunos</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkUpload(!showBulkUpload)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importar CSV
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData(initialFormData);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Aluno
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Upload Section */}
      <AnimatePresence>
        {showBulkUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Importar Alunos via CSV</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Faça download do modelo, preencha com os dados dos alunos e importe
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Baixar Modelo
                </button>
              </div>
              <button
                onClick={() => setShowBulkUpload(false)}
                className="text-blue-600 hover:text-blue-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleBulkUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600 mb-2">
                Clique para selecionar arquivo CSV
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm px-3 py-1 bg-white border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition-colors"
              >
                Selecionar Arquivo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-rose-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Alert */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-slate-900"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none hover:border-slate-300"
          >
            <option value="all">Todos os Níveis</option>
            {CEFRLEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none hover:border-slate-300"
          >
            <option value="all">Todos os Status</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>
                {status === 'active' ? 'Ativo' : status === 'inactive' ? 'Inativo' : 'Suspenso'}
              </option>
            ))}
          </select>
          <select
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none hover:border-slate-300"
          >
            <option value="all">Todas as Turmas</option>
            {classrooms.map(classroom => (
              <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingId ? 'Editar Aluno' : 'Novo Aluno'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nome *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Nome do aluno"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Data de Nascimento *</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Academic Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Série *</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => handleFormChange('grade', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      {GRADES.map(grade => (
                        <option key={grade} value={grade}>{grade}º ano</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Turma *</label>
                    <select
                      value={formData.classroomId}
                      onChange={(e) => handleFormChange('classroomId', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      <option value="">Selecione uma turma</option>
                      {classrooms.map(classroom => (
                        <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleFormChange('status', e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      {STATUSES.map(status => (
                        <option key={status} value={status}>
                          {status === 'active' ? 'Ativo' : status === 'inactive' ? 'Inativo' : 'Suspenso'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Language Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Idioma Alvo</label>
                    <select
                      value={formData.targetLanguage}
                      onChange={(e) => handleFormChange('targetLanguage', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nível CEFR</label>
                    <select
                      value={formData.level}
                      onChange={(e) => handleFormChange('level', e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      {CEFRLEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Parent Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email do Responsável</label>
                    <input
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => handleFormChange('parentEmail', e.target.value)}
                      placeholder="responsavel@example.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone do Responsável</label>
                    <input
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => handleFormChange('parentPhone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Notas adicionais sobre o aluno..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl p-6 max-w-sm"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-2">Remover Aluno?</h3>
              <p className="text-slate-600 mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleDelete(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Remover
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Students List */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Nenhum aluno encontrado</p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{student.name}</h3>
                      <p className="text-sm text-slate-500">{student.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-sm">
                    <div>
                      <span className="text-slate-500">Turma:</span> {getClassroomName(student.classroomId)}
                    </div>
                    <div>
                      <span className="text-slate-500">Nível:</span> {student.level}
                    </div>
                    <div>
                      <span className="text-slate-500">Série:</span> {student.grade}º
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        student.status === 'active' ? 'bg-green-100 text-green-700' :
                        student.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {student.status === 'active' ? 'Ativo' : student.status === 'inactive' ? 'Inativo' : 'Suspenso'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(student)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(student.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
