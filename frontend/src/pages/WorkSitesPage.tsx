import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { workSitesApi } from '../api/work-sites.api';
import type { WorkSite } from '../types';

export default function WorkSitesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WorkSite | null>(null);
  const [form, setForm] = useState({ name: '', city: '', notes: '' });
  const [search, setSearch] = useState('');

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['work-sites', 'all'],
    queryFn: () => workSitesApi.getAll().then((r) => r.data),
  });

  const filtered = sites.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.city ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', city: '', notes: '' });
    setShowForm(true);
  };

  const openEdit = (s: WorkSite) => {
    setEditing(s);
    setForm({ name: s.name, city: s.city ?? '', notes: s.notes ?? '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await workSitesApi.update(editing.id, form);
      else await workSitesApi.create(form);
      toast.success(editing ? 'Obra atualizada' : 'Obra cadastrada');
      queryClient.invalidateQueries({ queryKey: ['work-sites'] });
      setShowForm(false);
    } catch {
      toast.error('Erro ao salvar obra');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await workSitesApi.remove(id);
      toast.success('Obra desativada');
      queryClient.invalidateQueries({ queryKey: ['work-sites'] });
    } catch {
      toast.error('Erro ao desativar');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Obras</h2>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          + Nova Obra
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h3 className="font-semibold text-gray-800 mb-4">{editing ? 'Editar' : 'Nova'} Obra</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input required type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input type="text" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-3">
        <input
          type="text"
          placeholder="Buscar obra ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nome', 'Cidade', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(s)} className="text-blue-500 hover:text-blue-700 text-xs">Editar</button>
                    {s.isActive && (
                      <button onClick={() => handleDeactivate(s.id)} className="text-red-400 hover:text-red-600 text-xs">Desativar</button>
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
