import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EquipmentType } from './equipment-type.entity';

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, nullable: true })
  plate: string;

  @Column({ length: 50, nullable: true })
  chassis: string;

  @ManyToOne(() => EquipmentType, { eager: true })
  @JoinColumn({ name: 'equipment_type_id' })
  type: EquipmentType;

  @Column({ name: 'equipment_type_id' })
  typeId: number;

  @Column({ length: 60, nullable: true })
  brand: string;

  @Column({ length: 80, nullable: true })
  model: string;

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
