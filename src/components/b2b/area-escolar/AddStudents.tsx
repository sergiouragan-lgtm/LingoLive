import React, { useState, useEffect } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { auth } from '@/firebase';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMonitoring } from '@/hooks/useMonitoring';

interface AddStudentsProps {
  onCancel: () => void;
  onSave: (studentNames: string[]) => void;
}

export const AddStudents: React.FC<AddStudentsProps> = ({ onCancel, onSave }) => {
  const [studentNames, setStudentNames] = useState('');
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('add_students_form_viewed', {
        formType: 'bulk_student_import'
      });
    }
  }, [userId, trackEvent]);

  const handleSave = () => {
    const studentsArray = studentNames.split(',').map(n => n.trim()).filter(n => n);
    if (userId) {
      trackEvent('add_students_submitted', {
        formType: 'bulk_student_import',
        studentCount: studentsArray.length,
        hasStudents: studentsArray.length > 0
      });
    }
    onSave(studentsArray);
  };

  const handleCancel = () => {
    const studentsArray = studentNames.split(',').map(n => n.trim()).filter(n => n);
    if (userId) {
      trackEvent('add_students_cancelled', {
        formType: 'bulk_student_import',
        entriesStarted: studentsArray.length
      });
    }
    onCancel();
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="text-primary" /> Adicionar Alunos
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nomes dos Alunos (separados por vírgula)</label>
          <textarea
            value={studentNames}
            onChange={(e) => setStudentNames(e.target.value)}
            className="w-full px-4 py-2 bg-slate-100 rounded-xl border focus:border-primary outline-none h-32"
            placeholder="Ex: João Silva, Maria Souza, Pedro Santos"
          />
        </div>
        <div className="flex gap-4 pt-4">
          <button onClick={handleCancel} className="flex-1 py-2 rounded-xl text-slate-600 border hover:bg-slate-50 transition">Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" /> Adicionar Alunos
          </button>
        </div>
      </div>
    </div>
  );
};
