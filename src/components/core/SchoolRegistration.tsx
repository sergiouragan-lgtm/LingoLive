import React, { useState } from 'react';
import { School, AlertCircle } from 'lucide-react';

export const SchoolRegistration: React.FC<{onRegister: (data: any) => void}> = ({ onRegister }) => {
  const [formData, setFormData] = useState({ 
    nome: '', 
    numeroFiscal: '', 
    endereco: '', 
    emailPrincipal: '', 
    telefonePrincipal: '', 
    contactoAlternativo: '', 
    country: 'AO' 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome) newErrors.nome = 'Nome é obrigatório';
    if (!formData.numeroFiscal) newErrors.numeroFiscal = 'NIF é obrigatório';
    if (!formData.endereco) newErrors.endereco = 'Endereço é obrigatório';
    if (!formData.emailPrincipal || !/^\S+@\S+\.\S+$/.test(formData.emailPrincipal)) newErrors.emailPrincipal = 'Email inválido';
    if (!formData.telefonePrincipal) newErrors.telefonePrincipal = 'Telefone é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (validate()) {
      onRegister(formData);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900">
        <School className="text-indigo-600" /> Cadastro de Escola
      </h2>
      <div className="space-y-4">
        {[
          { key: 'nome', placeholder: 'Nome da Escola' },
          { key: 'numeroFiscal', placeholder: 'Número de Identificação Fiscal (NIF)' },
          { key: 'endereco', placeholder: 'Endereço Completo' },
          { key: 'emailPrincipal', placeholder: 'Email Principal', type: 'email' },
          { key: 'telefonePrincipal', placeholder: 'Telefone Principal' },
          { key: 'contactoAlternativo', placeholder: 'Contacto Alternativo' },
        ].map(field => (
          <div key={field.key}>
            <input 
              type={field.type || 'text'} 
              placeholder={field.placeholder} 
              className={`w-full p-3 border rounded-xl ${errors[field.key] ? 'border-red-500' : 'border-slate-200'}`} 
              onChange={e => setFormData({...formData, [field.key]: e.target.value})} 
            />
            {errors[field.key] && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors[field.key]}</p>}
          </div>
        ))}
        <select className="w-full p-3 border border-slate-200 rounded-xl" onChange={e => setFormData({...formData, country: e.target.value})}>
          <option value="AO">Angola</option>
          <option value="MZ">Moçambique</option>
          <option value="ZA">África do Sul</option>
        </select>
        <button onClick={handleRegister} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700">
          Cadastrar e Ir para Pagamento
        </button>
      </div>
    </div>
  );
};
