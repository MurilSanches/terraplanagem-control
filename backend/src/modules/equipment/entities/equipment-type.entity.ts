import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Equipment } from './equipment.entity';

@Entity('equipment_types')
export class EquipmentType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80, unique: true })
  name: string;

  @OneToMany(() => Equipment, (eq) => eq.type)
  equipment: Equipment[];
}
