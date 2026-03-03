export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface EquipmentType {
  id: number;
  name: string;
}

export interface Equipment {
  id: string;
  plate?: string;
  chassis?: string;
  type: EquipmentType;
  typeId: number;
  brand?: string;
  model?: string;
  status: 'active' | 'maintenance' | 'inactive';
  notes?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  status: 'active' | 'inactive' | 'vacation';
  notes?: string;
  absences?: DriverAbsence[];
}

export interface DriverAbsence {
  id: string;
  driverId: string;
  reason: 'sick' | 'vacation' | 'other';
  startDate: string;
  endDate: string;
  notes?: string;
  createdAt: string;
}

export interface WorkSite {
  id: string;
  name: string;
  city?: string;
  isActive: boolean;
  notes?: string;
}

export interface DailyEntry {
  id: string;
  date: string;
  equipmentId: string;
  equipment: Equipment;
  driverId?: string;
  driver?: Driver;
  workSiteId?: string;
  workSite?: WorkSite;
  observation?: string;
}

export interface DayViewRow {
  equipment: Equipment;
  entry: DailyEntry | null;
}
