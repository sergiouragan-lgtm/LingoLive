'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface CadastrarProfessorProps {
  onTeacherAdded: () => void;
}

export default function CadastrarProfessor({ onTeacherAdded }: CadastrarProfessorProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    idioma: '',
    sala: '',
    turno: ''
  });

  const handleSalvar = async () => {
    try {
      const response = await fetch('/api/professores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resultado = await response.json();

      if (!response.ok) {
        alert(`Erro: ${resultado.error}`);
        return;
      }

      alert(resultado.message);
      setFormData({ nome: '', email: '', telefone: '', idioma: '', sala: '', turno: '' });
      onTeacherAdded();
    } catch (err) {
      console.error("Erro ao conectar à API:", err);
      alert("Erro ao cadastrar professor");
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Adicionar Professor</h2>
      <div className="grid grid-cols-2 gap-4">
        <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Nome" className="p-2 border rounded" />
        <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="E-mail" className="p-2 border rounded" />
        <input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} placeholder="Telefone" className="p-2 border rounded" />
        <input value={formData.idioma} onChange={e => setFormData({...formData, idioma: e.target.value})} placeholder="Disciplina" className="p-2 border rounded" />
        <input value={formData.sala} onChange={e => setFormData({...formData, sala: e.target.value})} placeholder="Sala" className="p-2 border rounded" />
        <input value={formData.turno} onChange={e => setFormData({...formData, turno: e.target.value})} placeholder="Turno (ex: Manhã, Tarde)" className="p-2 border rounded" />
        <button onClick={handleSalvar} className="col-span-2 px-4 py-2 bg-indigo-600 text-white rounded flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Adicionar Professor
        </button>
      </div>
    </div>
  );
}
