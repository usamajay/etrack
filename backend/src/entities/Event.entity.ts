import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Device } from './Device.entity';
import { Geofence } from './Geofence.entity';
import { Position } from './Position.entity';

export enum EventType {
    GEOFENCE_ENTER = 'geofence_enter',
    GEOFENCE_EXIT = 'geofence_exit',
    SPEEDING = 'speeding',
    DEVICE_OFFLINE = 'device_offline',
    DEVICE_ONLINE = 'device_online',
    CUSTOM = 'custom',
}

@Entity('events')
@Index(['device', 'timestamp'])
@Index(['type', 'timestamp'])
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: EventType,
    })
    type: EventType;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    device: Device;

    @ManyToOne(() => Geofence, { nullable: true, onDelete: 'SET NULL' })
    geofence: Geofence | null;

    @ManyToOne(() => Position, { nullable: true, onDelete: 'SET NULL' })
    position: Position | null;

    @Column({ type: 'jsonb', default: {} })
    data: Record<string, any>;

    @Column()
    @Index()
    timestamp: Date;

    @CreateDateColumn()
    created_at: Date;
}
