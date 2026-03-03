import api from './axios-instance';
import type { Equipment, EquipmentType } from '../types';

export const equipmentApi = {
  getTypes: () => api.get<EquipmentType[]>('/equipment-types'),
  getAll: (params?: { status?: string; typeId?: number; search?: string }) =>
    api.get<Equipment[]>('/equipment', { params }),
  getOne: (id: string) => api.get<Equipment>(`/equipment/${id}`),
  create: (data: Partial<Equipment>) => api.post<Equipment>('/equipment', data),
  update: (id: string, data: Partial<Equipment>) =>
    api.patch<Equipment>(`/equipment/${id}`, data),
  remove: (id: string) => api.delete(`/equipment/${id}`),
};
