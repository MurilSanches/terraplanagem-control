import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { driversApi } from '../api/drivers.api';
import type { Driver } from '../types';

const STATUS_LABEL: Record<string, string> = { active: 'Ativo', inactive: 'Inativo', vacation: 'Férias' };
const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  vacation: 'bg-blue-100 text-blue-700',
};

export default function DriversPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState<{ name: string; phone: string; status: 'active' | 'inactive' | 'vacation'; notes: string }>({ name: '', phone: '', status: 'active', notes: '' });

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers', 'all'],
    queryFn: () => driversApi.getAll().then((r) => r.data),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', phone: '', status: 'active', notes: '' });
    setShowForm(true);
  };

  const openEdit = (d: Driver) => {
    setEditing(d);
    setForm({ name: d.name, phone: d.phone ?? '', status: d.status, notes: d.notes ?? '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await driversApi.update(editing.id, form);
      else await driversApi.create(form);
      toast.success(editing ? 'Motorista atualizado' : 'Motorista cadastrado');
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setShowForm(false);
    } catch {
      toast.error('Erro ao salvar motorista');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await driversApi.remove(id);
      toast.success('Motorista desativado');
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    } catch {
      toast.error('Erro ao desativar');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Motoristas</h2>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          + Novo Motorista
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h3 className="font-semibold text-gray-800 mb-4">{editing ? 'Editar' : 'Novo'} Motorista</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' | 'vacation' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="vacation">Férias</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nome', 'Telefone', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-gray-500">{d.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[d.status]}`}>
                      {STATUS_LABEL[d.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(d)} className="text-blue-500 hover:text-blue-700 text-xs">Editar</button>
                    {d.status === 'active' && (
                      <button onClick={() => handleDeactivate(d.id)} className="text-red-400 hover:text-red-600 text-xs">Desativar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
