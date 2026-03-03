import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dailyApi } from '../api/daily.api';
import { equipmentApi } from '../api/equipment.api';
import { driversApi } from '../api/drivers.api';
import { workSitesApi } from '../api/work-sites.api';
import type { DailyEntry } from '../types';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    startDate: todayStr(),
    endDate: todayStr(),
    equipmentId: '',
    driverId: '',
    workSiteId: '',
  });
  const [applied, setApplied] = useState({ ...filters });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment', 'all'],
    queryFn: () => equipmentApi.getAll().then((r) => r.data),
  });
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers', 'all'],
    queryFn: () => driversApi.getAll().then((r) => r.data),
  });
  const { data: workSites = [] } = useQuery({
    queryKey: ['work-sites', 'all'],
    queryFn: () => workSitesApi.getAll().then((r) => r.data),
  });

  const { data: entries = [], isFetching } = useQuery({
    queryKey: ['report', applied],
    queryFn: () =>
      dailyApi
        .report({ ...applied, format: 'json' })
        .then((r) => r.data as DailyEntry[]),
  });

  const handleExportCsv = async () => {
    const res = await dailyApi.report({ ...applied, format: 'csv' });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `programacao_${applied.startDate}_${applied.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Relatórios / Histórico</h2>
        <button
          onClick={handleExportCsv}
          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-3 py-1.5 rounded-lg"
        >
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data início</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data fim</label>
            <input
              type="date"
              value={filters.endDate}
              min={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Equipamento</label>
            <select
              value={filters.equipmentId}
              onChange={(e) => setFilters((f) => ({ ...f, equipmentId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.plate ?? eq.chassis}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Motorista</label>
            <select
              value={filters.driverId}
              onChange={(e) => setFilters((f) => ({ ...f, driverId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Obra</label>
            <select
              value={filters.workSiteId}
              onChange={(e) => setFilters((f) => ({ ...f, workSiteId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">Todas</option>
              {workSites.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => setApplied({ ...filters })}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg"
        >
          Filtrar
        </button>
      </div>

      {/* Results table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isFetching ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Placa</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Motorista</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Obra</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{e.date}</td>
                    <td className="px-4 py-2">{e.equipment?.plate ?? e.equipment?.chassis}</td>
                    <td className="px-4 py-2 text-gray-500">{e.equipment?.type?.name}</td>
                    <td className="px-4 py-2">{e.driver?.name ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-2">{e.workSite?.name ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-2 text-gray-500">{e.observation ?? '—'}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Nenhum resultado encontrado para os filtros selecionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {entries.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {entries.length} registro(s) encontrado(s)
          </div>
        )}
      </div>
    </div>
  );
}
