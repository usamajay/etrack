import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Device } from './Device.entity';
import { ApiKey } from './ApiKey.entity';
import { Geofence } from './Geofence.entity';
import { AlertRule } from './AlertRule.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password_hash: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ default: 'user' })
    role: string;

    // Company info
    @Column({ nullable: true })
    company_name: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ nullable: true })
    city: string;

    @Column({ default: 'Pakistan' })
    country: string;

    @Column({ default: 'Asia/Karachi' })
    timezone: string;

    @Column({ default: 'en' })
    language: string;

    // Account status
    @Column({ default: true })
    is_active: boolean;

    @Column({ default: false })
    is_verified: boolean;

    @Column({ nullable: true })
    email_verified_at: Date;

    // Subscription & limits
    @Column({ default: 'free' })
    subscription_plan: string;

    @Column({ nullable: true })
    subscription_expires_at: Date;

    @Column({ default: 5 })
    device_limit: number;

    @Column({ default: 1 })
    user_limit: number;

    @Column({ default: false })
    api_access: boolean;

    // UI Preferences
    @Column({ default: 'google' })
    map_provider: string;

    @Column({ default: 'km' })
    distance_unit: string;

    @Column({ default: 'kmh' })
    speed_unit: string;

    @Column({ default: 'liter' })
    volume_unit: string;

    @Column({ default: true })
    timezone_auto: boolean;

    // Custom attributes
    @Column({ type: 'jsonb', default: {} })
    attributes: Record<string, any>;

    // Security
    @Column({ default: false })
    two_factor_enabled: boolean;

    @Column({ nullable: true })
    two_factor_secret: string;

    @Column({ nullable: true })
    last_login_at: Date;

    @Column({ type: 'inet', nullable: true })
    last_login_ip: string;

    @Column({ default: 0 })
    failed_login_attempts: number;

    @Column({ nullable: true })
    locked_until: Date;

    // Audit
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    // Relations
    @OneToMany(() => Device, (device) => device.user)
    devices: Device[];

    @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
    api_keys: ApiKey[];

    @OneToMany(() => Geofence, (geofence) => geofence.user)
    geofences: Geofence[];

    @OneToMany(() => AlertRule, (alertRule) => alertRule.user)
    alertRules: AlertRule[];
}
