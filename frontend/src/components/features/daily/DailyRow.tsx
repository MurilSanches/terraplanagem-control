import { useState, useCallback, useRef, useEffect } from 'react';
import type { DayViewRow, Driver, WorkSite } from '../../../types';
import { dailyApi } from '../../../api/daily.api';
import toast from 'react-hot-toast';

interface Props {
  row: DayViewRow;
  drivers: Driver[];
  workSites: WorkSite[];
  date: string;
  absentDriverIds: string[];
  onSaved: () => void;
}

export default function DailyRow({ row, drivers, workSites, date, absentDriverIds, onSaved }: Props) {
  const { equipment, entry } = row;
  const [driverId, setDriverId] = useState(entry?.driverId ?? '');
  const [workSiteId, setWorkSiteId] = useState(entry?.workSiteId ?? '');
  const [observation, setObservation] = useState(entry?.observation ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update local state when entry changes (e.g. date switches)
  useEffect(() => {
    setDriverId(entry?.driverId ?? '');
    setWorkSiteId(entry?.workSiteId ?? '');
    setObservation(entry?.observation ?? '');
    setSaved(false);
    setError(false);
  }, [entry, date]);

  const save = useCallback(
    async (dId: string, wsId: string, obs: string) => {
      setSaving(true);
      setError(false);
      try {
        await dailyApi.upsert({
          date,
          equipmentId: equipment.id,
          driverId: dId || undefined,
          workSiteId: wsId || undefined,
          observation: obs || undefined,
        });
        setSaved(true);
        onSaved();
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setError(true);
        toast.error('Erro ao salvar linha');
      } finally {
        setSaving(false);
      }
    },
    [date, equipment.id, onSaved],
  );

  const scheduleSave = (dId: string, wsId: string, obs: string) => {
    setSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(dId, wsId, obs), 500);
  };

  const handleDriverChange = (val: string) => {
    setDriverId(val);
    scheduleSave(val, workSiteId, observation);
  };

  const handleWorkSiteChange = (val: string) => {
    setWorkSiteId(val);
    scheduleSave(driverId, val, observation);
  };

  const handleObsChange = (val: string) => {
    setObservation(val);
    scheduleSave(driverId, workSiteId, val);
  };

  const hasEntry = !!(entry || driverId || workSiteId || observation);
  const availableDrivers = drivers.filter((d) => !absentDriverIds.includes(d.id));

  return (
    <tr className={!hasEntry ? 'bg-yellow-50' : 'bg-white'}>
      <td className="px-3 py-2 text-sm font-medium text-gray-800 whitespace-nowrap">
        {equipment.plate ?? equipment.chassis}
      </td>
      <td className="px-3 py-2 text-xs text-gray-500">{equipment.type?.name}</td>

      <td className="px-3 py-2">
        <select
          value={driverId}
          onChange={(e) => handleDriverChange(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">— Sem motorista —</option>
          {availableDrivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </td>

      <td className="px-3 py-2">
        <select
          value={workSiteId}
          onChange={(e) => handleWorkSiteChange(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">— Sem obra —</option>
          {workSites.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
      </td>

      <td className="px-3 py-2">
        <input
          type="text"
          value={observation}
          onChange={(e) => handleObsChange(e.target.value)}
          placeholder="Observação..."
          className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </td>

      <td className="px-3 py-2 text-center w-8">
        {saving && <span className="text-gray-400 text-xs animate-pulse">⏳</span>}
        {saved && !saving && <span className="text-green-500 text-sm">✓</span>}
        {error && !saving && (
          <button
            onClick={() => save(driverId, workSiteId, observation)}
            className="text-red-500 text-xs hover:underline"
            title="Erro ao salvar — clique para tentar novamente"
          >
            ✗
          </button>
        )}
      </td>
    </tr>
  );
}
