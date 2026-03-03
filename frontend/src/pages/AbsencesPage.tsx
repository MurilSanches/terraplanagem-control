import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { driversApi } from '../api/drivers.api';
import type { DriverAbsence } from '../types';

const REASON_LABEL: Record<string, string> = {
  sick: 'Doença',
  vacation: 'Férias',
  other: 'Outro',
};

const REASON_COLOR: Record<string, string> = {
  sick: 'bg-red-100 text-red-700',
  vacation: 'bg-blue-100 text-blue-700',
  other: 'bg-gray-100 text-gray-700',
};

const today = new Date().toISOString().split('T')[0];

export default function AbsencesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    driverId: '',
    reason: 'sick',
    startDate: today,
    endDate: today,
    notes: '',
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers', 'all'],
    queryFn: () => driversApi.getAll().then((r) => r.data),
  });

  // Fetch all absences by querying each driver — simplified: fetch today's absent
  const { data: absentToday = [] } = useQuery({
    queryKey: ['drivers', 'absent', today],
    queryFn: () => driversApi.getAbsent(today).then((r) => r.data),
  });

  // Per-driver absences: fetched on demand
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const { data: driverAbsences = [], isLoading: loadingAbsences } = useQuery({
    queryKey: ['absences', selectedDriver],
    queryFn: () => driversApi.getAbsences(selectedDriver).then((r) => r.data),
    enabled: !!selectedDriver,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.driverId) return toast.error('Selecione um motorista');
    try {
      await driversApi.createAbsence(form.driverId, {
        reason: form.reason,
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes || undefined,
      });
      toast.success('Ausência registrada');
      setShowForm(false);
      setForm({ driverId: '', reason: 'sick', startDate: today, endDate: today, notes: '' });
      queryClient.invalidateQueries({ queryKey: ['drivers', 'absent'] });
      if (selectedDriver === form.driverId) {
        queryClient.invalidateQueries({ queryKey: ['absences', selectedDriver] });
      }
    } catch {
      toast.error('Erro ao registrar ausência');
    }
  };

  const handleDelete = async (driverId: string, absenceId: string) => {
    try {
      await driversApi.removeAbsence(driverId, absenceId);
      toast.success('Ausência removida');
      queryClient.invalidateQueries({ queryKey: ['absences', driverId] });
      queryClient.invalidateQueries({ queryKey: ['drivers', 'absent'] });
    } catch {
      toast.error('Erro ao remover ausência');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Ausências de Motoristas</h2>
          <p className="text-sm text-gray-500">Registre doenças, férias e outros afastamentos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + Nova Ausência
        </button>
      </div>

      {/* Today's absences banner */}
      {absentToday.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <strong>Ausentes hoje ({today}):</strong>{' '}
          {absentToday.map((d) => d.name).join(', ')}
        </div>
      )}

      {/* New absence form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Registrar Ausência</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motorista</label>
              <select
                required
                value={form.driverId}
                onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <select
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="sick">Doença</option>
                <option value="vacation">Férias</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data início</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data fim</label>
              <input
                type="date"
                required
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observação (opcional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Driver absences lookup */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Consultar ausências por motorista</h3>
        <select
          value={selectedDriver}
          onChange={(e) => setSelectedDriver(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
        >
          <option value="">Selecione um motorista...</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {selectedDriver && (
          loadingAbsences ? (
            <p className="text-sm text-gray-400">Carregando...</p>
          ) : driverAbsences.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma ausência registrada</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase border-b">
                <tr>
                  <th className="pb-2 text-left">Motivo</th>
                  <th className="pb-2 text-left">Início</th>
                  <th className="pb-2 text-left">Fim</th>
                  <th className="pb-2 text-left">Observação</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {driverAbsences.map((abs: DriverAbsence) => (
                  <tr key={abs.id}>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REASON_COLOR[abs.reason]}`}>
                        {REASON_LABEL[abs.reason]}
                      </span>
                    </td>
                    <td className="py-2">{abs.startDate}</td>
                    <td className="py-2">{abs.endDate}</td>
                    <td className="py-2 text-gray-500">{abs.notes ?? '—'}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDelete(selectedDriver, abs.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}
