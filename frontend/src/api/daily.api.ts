import api from './axios-instance';
import type { DayViewRow, DailyEntry } from '../types';

export const dailyApi = {
  getDayView: (date: string) =>
    api.get<DayViewRow[]>('/daily', { params: { date } }),

  upsert: (data: {
    date: string;
    equipmentId: string;
    driverId?: string;
    workSiteId?: string;
    observation?: string;
  }) => api.post<DailyEntry>('/daily', data),

  bulkUpsert: (entries: Array<{
    date: string;
    equipmentId: string;
    driverId?: string;
    workSiteId?: string;
    observation?: string;
  }>) => api.post<DailyEntry[]>('/daily/bulk', { entries }),

  copyFrom: (sourceDate: string, targetDate?: string) =>
    api.post(`/daily/copy-from/${sourceDate}`, {}, { params: { targetDate } }),

  remove: (id: string) => api.delete(`/daily/${id}`),

  report: (params: {
    startDate: string;
    endDate: string;
    equipmentId?: string;
    driverId?: string;
    workSiteId?: string;
    format?: 'json' | 'csv';
  }) => api.get('/daily/report', { params, responseType: params.format === 'csv' ? 'blob' : 'json' }),
};
