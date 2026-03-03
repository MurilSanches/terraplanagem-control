import api from './axios-instance';
import type { Driver, DriverAbsence } from '../types';

export const driversApi = {
  getAll: (params?: { status?: string; search?: string }) =>
    api.get<Driver[]>('/drivers', { params }),
  getOne: (id: string) => api.get<Driver>(`/drivers/${id}`),
  getAvailable: (date: string) =>
    api.get<Driver[]>('/drivers/available', { params: { date } }),
  getAbsent: (date: string) =>
    api.get<Driver[]>('/drivers/absent', { params: { date } }),
  create: (data: Partial<Driver>) => api.post<Driver>('/drivers', data),
  update: (id: string, data: Partial<Driver>) =>
    api.patch<Driver>(`/drivers/${id}`, data),
  remove: (id: string) => api.delete(`/drivers/${id}`),

  getAbsences: (driverId: string) =>
    api.get<DriverAbsence[]>(`/drivers/${driverId}/absences`),
  createAbsence: (
    driverId: string,
    data: { reason: string; startDate: string; endDate: string; notes?: string },
  ) => api.post<DriverAbsence>(`/drivers/${driverId}/absences`, data),
  removeAbsence: (driverId: string, absenceId: string) =>
    api.delete(`/drivers/${driverId}/absences/${absenceId}`),
};
