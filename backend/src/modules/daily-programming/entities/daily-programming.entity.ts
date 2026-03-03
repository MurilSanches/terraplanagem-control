import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { WorkSite } from '../../work-sites/entities/work-site.entity';
import { User } from '../../users/entities/user.entity';

@Entity('daily_programming')
@Unique(['equipmentId', 'date'])
export class DailyProgramming {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => Equipment, { eager: true })
  @JoinColumn({ name: 'equipment_id' })
  equipment: Equipment;

  @Column({ name: 'equipment_id' })
  equipmentId: string;

  @ManyToOne(() => Driver, { nullable: true, eager: true })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({ name: 'driver_id', nullable: true, type: 'uuid' })
  driverId: string | undefined;

  @ManyToOne(() => WorkSite, { nullable: true, eager: true })
  @JoinColumn({ name: 'work_site_id' })
  workSite: WorkSite;

  @Column({ name: 'work_site_id', nullable: true, type: 'uuid' })
  workSiteId: string | undefined;

  @Column({ nullable: true, type: 'text' })
  observation: string | undefined;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @Column({ name: 'created_by', nullable: true, type: 'uuid' })
  createdBy: string | undefined;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: User;

  @Column({ name: 'updated_by', nullable: true, type: 'uuid' })
  updatedBy: string | undefined;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
