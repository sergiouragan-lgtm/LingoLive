import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Edit2, Trash2, Search, X, Save, AlertCircle, Upload,
  CheckCircle2, Loader, RefreshCw, Download, Award, Mail,
  Phone, User, BookOpen, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../../firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query,
  where, onSnapshot, Timestamp, getDocs, writeBatch
} from 'firebase/firestore';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  certifications: string;
  yearsOfExperience: number;
  status: 'active' | 'inactive' | 'onLeave';
  hireDate: string;
  specializations: string[];
  bio?: string;
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
  subjects: string;
  certifications: string;
  yearsOfExperience: number;
  status: 'active' | 'inactive' | 'onLeave';
  hireDate: string;
  specializations: string;
  bio: string;
}

interface TeacherManagerProps {
  schoolId: string;
  onTeacherCreated?: (teacher: Teacher) => void;
}

const LANGUAGES = ['English', 'French', 'Spanish', 'Chinese', 'Portuguese', 'German', 'Italian', 'Japanese'];
const SPECIALIZATIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Conversação', 'Pronúncia', 'Gramática', 'Escrita'];
const STATUSES = ['active', 'inactive', 'onLeave'] as const;

const initialFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  subjects: '',
  certifications: '',
  yearsOfExperience: 0,
  status: 'active',
  hireDate: '',
  specializations: '',
  bio: ''
};

export const TeacherManager: React.FC<TeacherManagerProps> = ({
  schoolId,
  onTeacherCreated
}) => {
  // State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterExperience, setFilterExperience] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch teachers
  useEffect(() => {
    if (!schoolId) return;

    const q = query(
      collection(db, 'schools', schoolId, 'teachers')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Teacher[];
      setTeachers(data);
    }, (err) => {
      console.error('Error fetching teachers:', err);
      setError('Erro ao carregar professores');
    });

    return () => unsubscribe();
  }, [schoolId]);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesExperience = filterExperience === 'all' ||
        (filterExperience === '0-2' && t.yearsOfExperience <= 2) ||
        (filterExperience === '3-5' && t.yearsOfExperience >= 3 && t.yearsOfExperience <= 5) ||
        (filterExperience === '5+' && t.yearsOfExperience > 5);
      return matchesSearch && matchesStatus && matchesExperience;
    });
  }, [teachers, searchQuery, filterStatus, filterExperience]);

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
      setError('Nome do professor é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    if (!formData.subjects.trim()) {
      setError('Selecione pelo menos uma disciplina');
      return false;
    }
    if (!formData.hireDate) {
      setError('Data de contratação é obrigatória');
      return false;
    }
    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const subjectsArray = formData.subjects
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const specializationsArray = formData.specializations
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const teacherData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subjects: subjectsArray,
        certifications: formData.certifications,
        yearsOfExperience: formData.yearsOfExperience,
        status: formData.status,
        hireDate: formData.hireDate,
        specializations: specializationsArray,
        bio: formData.bio,
      };

      if (editingId) {
        // Update existing teacher
        const teacherRef = doc(db, 'schools', schoolId, 'teachers', editingId);
        await updateDoc(teacherRef, {
          ...teacherData,
          updatedAt: Timestamp.now(),
        });
        setSuccessMessage('Professor atualizado com sucesso!');
      } else {
        // Create new teacher
        const docRef = await addDoc(
          collection(db, 'schools', schoolId, 'teachers'),
          {
            ...teacherData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }
        );

        const newTeacher = {
          id: docRef.id,
          ...teacherData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        } as Teacher;

        if (onTeacherCreated) {
          onTeacherCreated(newTeacher);
        }
        setSuccessMessage('Professor criado com sucesso!');
      }

      setError(null);
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving teacher:', err);
      setError('Erro ao salvar professor');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      subjects: teacher.subjects.join(', '),
      certifications: teacher.certifications,
      yearsOfExperience: teacher.yearsOfExperience,
      status: teacher.status,
      hireDate: teacher.hireDate,
      specializations: teacher.specializations.join(', '),
      bio: teacher.bio || ''
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (teacherId: string) => {
    setLoading(true);
    try {
      const teacherRef = doc(db, 'schools', schoolId, 'teachers', teacherId);
      await deleteDoc(teacherRef);
      setSuccessMessage('Professor removido com sucesso!');
      setShowDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting teacher:', err);
      setError('Erro ao remover professor');
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
        const teacherData: Partial<Teacher> = {};

        headers.forEach((header, idx) => {
          const value = values[idx] || '';
          if (header === 'name') teacherData.name = value;
          if (header === 'email') teacherData.email = value;
          if (header === 'phone') teacherData.phone = value;
          if (header === 'subjects') teacherData.subjects = value.split(';').map(s => s.trim()).filter(s => s);
          if (header === 'certifications') teacherData.certifications = value;
          if (header === 'yearsOfExperience') teacherData.yearsOfExperience = parseInt(value) || 0;
          if (header === 'hireDate') teacherData.hireDate = value;
          if (header === 'specializations') teacherData.specializations = value.split(';').map(s => s.trim()).filter(s => s);
          if (header === 'bio') teacherData.bio = value;
        });

        if (teacherData.name && teacherData.email && teacherData.subjects && teacherData.subjects.length > 0) {
          const docRef = doc(collection(db, 'schools', schoolId, 'teachers'));
          batch.set(docRef, {
            ...teacherData,
            status: 'active',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          count++;
        }
      }

      await batch.commit();
      setSuccessMessage(`${count} professores importados com sucesso!`);
      setShowBulkUpload(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error uploading bulk teachers:', err);
      setError('Erro ao importar professores');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle download template
  const handleDownloadTemplate = () => {
    const template = 'name,email,phone,subjects,certifications,yearsOfExperience,hireDate,specializations,bio\nMaria Silva,maria@example.com,123456789,English;French,CELTA,5,2020-01-15,B1;B2;C1,Especialista em conversação';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teachers-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gerenciar Professores</h1>
            <p className="text-slate-600 mt-1">{filteredTeachers.length} professores</p>
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
              Novo Professor
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
                <h3 className="font-semibold text-blue-900 mb-2">Importar Professores via CSV</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Faça download do modelo, preencha com os dados dos professores e importe
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="onLeave">Em Licença</option>
          </select>
          <select
            value={filterExperience}
            onChange={(e) => setFilterExperience(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Toda Experiência</option>
            <option value="0-2">0-2 Anos</option>
            <option value="3-5">3-5 Anos</option>
            <option value="5+">5+ Anos</option>
          </select>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredTeachers.map((teacher, index) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{teacher.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      teacher.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : teacher.status === 'onLeave'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {teacher.status === 'active' ? 'Ativo' : teacher.status === 'onLeave' ? 'Em Licença' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(teacher)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(teacher.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${teacher.email}`} className="hover:text-blue-600">
                    {teacher.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4" />
                  {teacher.phone}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <BookOpen className="w-4 h-4" />
                  {teacher.subjects.join(', ')}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Award className="w-4 h-4" />
                  {teacher.yearsOfExperience} anos
                </div>
                {teacher.certifications && (
                  <div className="text-slate-600">
                    <span className="font-medium">Certificações:</span> {teacher.certifications}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTeachers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum professor encontrado</p>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingId ? 'Editar Professor' : 'Novo Professor'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nome do professor"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Telefone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Disciplinas *</label>
                  <input
                    type="text"
                    value={formData.subjects}
                    onChange={(e) => handleFormChange('subjects', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="English, French (separe com vírgulas)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Certificações</label>
                    <input
                      type="text"
                      value={formData.certifications}
                      onChange={(e) => handleFormChange('certifications', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="CELTA, TEFL, etc"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Anos de Experiência</label>
                    <input
                      type="number"
                      value={formData.yearsOfExperience}
                      onChange={(e) => handleFormChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Data de Contratação *</label>
                    <input
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => handleFormChange('hireDate', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleFormChange('status', e.target.value as any)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="onLeave">Em Licença</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Especializações</label>
                  <input
                    type="text"
                    value={formData.specializations}
                    onChange={(e) => handleFormChange('specializations', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="A1, A2, B1, B2, C1, C2 (separe com vírgulas)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Biografia</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleFormChange('bio', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                    placeholder="Informações sobre o professor"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar
                    </>
                  )}
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
                Remover Professor?
              </h3>
              <p className="text-slate-600 text-center mb-6">
                Esta ação não pode ser desfeita. O professor será removido permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:bg-slate-400"
                >
                  {loading ? 'Removendo...' : 'Remover'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
