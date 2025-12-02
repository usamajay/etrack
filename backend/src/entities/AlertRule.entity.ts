import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User.entity';
import { Device } from './Device.entity';
import { Geofence } from './Geofence.entity';
import { EventType } from './Event.entity';

@Entity('alert_rules')
export class AlertRule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: EventType,
    })
    type: EventType;

    @ManyToOne(() => User, (user) => user.alertRules, { onDelete: 'CASCADE' })
    user: User;

    @ManyToMany(() => Device)
    @JoinTable()
    devices: Device[];

    @ManyToMany(() => Geofence)
    @JoinTable()
    geofences: Geofence[];

    @Column({ type: 'jsonb', default: {} })
    conditions: Record<string, any>; // e.g., { speedThreshold: 100, timeRange: '08:00-18:00' }

    @Column({ type: 'simple-array' })
    notification_channels: string[]; // ['email', 'sms', 'push', 'webhook']

    @Column({ type: 'jsonb', default: {} })
    notification_config: Record<string, any>; // { email: ['user@example.com'], sms: ['+1234567890'] }

    @Column({ default: true })
    enabled: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
