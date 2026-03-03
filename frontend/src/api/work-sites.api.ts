import api from './axios-instance';
import type { WorkSite } from '../types';

export const workSitesApi = {
  getAll: (params?: { search?: string; isActive?: string }) =>
    api.get<WorkSite[]>('/work-sites', { params }),
  getOne: (id: string) => api.get<WorkSite>(`/work-sites/${id}`),
  create: (data: Partial<WorkSite>) => api.post<WorkSite>('/work-sites', data),
  update: (id: string, data: Partial<WorkSite>) =>
    api.patch<WorkSite>(`/work-sites/${id}`, data),
  remove: (id: string) => api.delete(`/work-sites/${id}`),
};
