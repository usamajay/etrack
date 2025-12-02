import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';

@Entity('devices')
export class Device {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @ManyToOne(() => User, (user) => user.devices, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    // Device identification
    @Column({ unique: true })
    unique_id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    model: string;

    @Column({ nullable: true })
    contact: string;

    @Column({ default: 'car' })
    category: string;

    // Protocol configuration
    @Column({ default: 'gt06' })
    protocol: string;

    // Current status
    @Column({ default: 'unknown' })
    status: string;

    @Column({ nullable: true })
    last_update: Date;

    @Column({ type: 'bigint', nullable: true })
    position_id: number;

    // Grouping
    @Column({ nullable: true })
    group_id: number;

    // Configuration
    @Column({ default: false })
    disabled: boolean;

    @Column({ nullable: true })
    expiration_time: Date;

    // Tracking metrics
    @Column({ type: 'double precision', default: 0 })
    odometer: number;

    @Column({ type: 'double precision', default: 0 })
    engine_hours: number;

    // Custom attributes
    @Column({ type: 'jsonb', default: {} })
    attributes: Record<string, any>;

    // Maintenance tracking
    @Column({ default: 5000 })
    maintenance_interval: number;

    @Column({ type: 'date', nullable: true })
    maintenance_last_date: Date;

    @Column({ type: 'date', nullable: true })
    maintenance_next_date: Date;

    @Column({ type: 'double precision', nullable: true })
    maintenance_odometer: number;

    // Audit
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
