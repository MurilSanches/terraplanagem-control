import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DriverAbsence } from './driver-absence.entity';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @OneToMany(() => DriverAbsence, (absence) => absence.driver, { cascade: true })
  absences: DriverAbsence[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
