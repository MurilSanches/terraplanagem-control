import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { equipmentApi } from '../api/equipment.api';
import type { Equipment } from '../types';

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  maintenance: 'Manutenção',
  inactive: 'Inativo',
};
const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-500',
};

export default function EquipmentPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [form, setForm] = useState<{ plate: string; chassis: string; typeId: string; brand: string; model: string; status: 'active' | 'maintenance' | 'inactive'; notes: string }>({ plate: '', chassis: '', typeId: '', brand: '', model: '', status: 'active', notes: '' });

  const { data: types = [] } = useQuery({
    queryKey: ['equipment-types'],
    queryFn: () => equipmentApi.getTypes().then((r) => r.data),
  });
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment', 'all'],
    queryFn: () => equipmentApi.getAll().then((r) => r.data),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ plate: '', chassis: '', typeId: '', brand: '', model: '', status: 'active', notes: '' });
    setShowForm(true);
  };

  const openEdit = (eq: Equipment) => {
    setEditing(eq);
    setForm({
      plate: eq.plate ?? '',
      chassis: eq.chassis ?? '',
      typeId: String(eq.typeId),
      brand: eq.brand ?? '',
      model: eq.model ?? '',
      status: eq.status,
      notes: eq.notes ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plate && !form.chassis) return toast.error('Informe placa ou chassi');
    try {
      const payload = { ...form, typeId: parseInt(form.typeId) || undefined };
      if (editing) await equipmentApi.update(editing.id, payload);
      else await equipmentApi.create(payload);
      toast.success(editing ? 'Equipamento atualizado' : 'Equipamento cadastrado');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setShowForm(false);
    } catch {
      toast.error('Erro ao salvar equipamento');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await equipmentApi.remove(id);
      toast.success('Equipamento desativado');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    } catch {
      toast.error('Erro ao desativar');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Equipamentos</h2>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          + Novo Equipamento
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h3 className="font-semibold text-gray-800 mb-4">{editing ? 'Editar' : 'Novo'} Equipamento</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Placa', key: 'plate', placeholder: 'EHP0B94' },
              { label: 'Chassi', key: 'chassis', placeholder: 'Opcional se tiver placa' },
              { label: 'Marca', key: 'brand', placeholder: '' },
              { label: 'Modelo', key: 'model', placeholder: '' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type="text"
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                required
                value={form.typeId}
                onChange={(e) => setForm((f) => ({ ...f, typeId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'active' | 'maintenance' | 'inactive' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="active">Ativo</option>
                <option value="maintenance">Manutenção</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
                Salvar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg">
                Cancelar
              </button>
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
                {['Placa/Chassi', 'Tipo', 'Marca', 'Modelo', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipment.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{eq.plate ?? eq.chassis}</td>
                  <td className="px-4 py-3 text-gray-500">{eq.type?.name}</td>
                  <td className="px-4 py-3">{eq.brand ?? '—'}</td>
                  <td className="px-4 py-3">{eq.model ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[eq.status]}`}>
                      {STATUS_LABEL[eq.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(eq)} className="text-blue-500 hover:text-blue-700 text-xs">Editar</button>
                    {eq.status === 'active' && (
                      <button onClick={() => handleDeactivate(eq.id)} className="text-red-400 hover:text-red-600 text-xs">Desativar</button>
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
