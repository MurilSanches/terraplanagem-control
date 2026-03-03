import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';
import { dailyApi } from '../api/daily.api';
import { driversApi } from '../api/drivers.api';
import { workSitesApi } from '../api/work-sites.api';
import DailyRow from '../components/features/daily/DailyRow';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function DailyPage() {
  const [date, setDate] = useState(todayStr);
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['daily', date],
    queryFn: () => dailyApi.getDayView(date).then((r) => r.data),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers', 'active'],
    queryFn: () => driversApi.getAll({ status: 'active' }).then((r) => r.data),
  });

  const { data: workSites = [] } = useQuery({
    queryKey: ['work-sites', 'active'],
    queryFn: () => workSitesApi.getAll({ isActive: 'true' }).then((r) => r.data),
  });

  const { data: absentDrivers = [] } = useQuery({
    queryKey: ['drivers', 'absent', date],
    queryFn: () => driversApi.getAbsent(date).then((r) => r.data),
  });

  const absentIds = absentDrivers.map((d) => d.id);

  const handleCopyYesterday = async () => {
    const yesterday = format(subDays(new Date(date + 'T12:00:00'), 1), 'yyyy-MM-dd');
    try {
      const res = await dailyApi.copyFrom(yesterday, date);
      const { copied } = res.data as { copied: number; skipped: number };
      toast.success(`${copied} entradas copiadas de ${yesterday}`);
      queryClient.invalidateQueries({ queryKey: ['daily', date] });
    } catch {
      toast.error('Erro ao copiar programação');
    }
  };

  const handleExportCsv = () => {
    const url = `${import.meta.env.VITE_API_BASE_URL}/daily/report?startDate=${date}&endDate=${date}&format=csv`;
    window.open(url, '_blank');
  };

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['daily', date] });
  }, [queryClient, date]);

  const assigned = rows.filter((r) => r.entry).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Programação Diária</h2>
          <p className="text-sm text-gray-500">
            {assigned}/{rows.length} equipamentos alocados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCopyYesterday}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-3 py-1.5 rounded-lg"
          >
            Copiar de ontem
          </button>
          <button
            onClick={handleExportCsv}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-3 py-1.5 rounded-lg"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {absentIds.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <strong>⚠️ Motoristas ausentes hoje:</strong>{' '}
          {absentDrivers.map((d) => d.name).join(', ')}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Placa</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">Motorista</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-56">Obra</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Observação</th>
                  <th className="px-3 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <DailyRow
                    key={row.equipment.id}
                    row={row}
                    drivers={drivers}
                    workSites={workSites}
                    date={date}
                    absentDriverIds={absentIds}
                    onSaved={handleRefresh}
                  />
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                      Nenhum equipamento ativo cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
