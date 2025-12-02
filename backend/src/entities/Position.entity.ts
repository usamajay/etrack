import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Device } from './Device.entity';

@Entity('positions')
@Index(['device_id', 'device_time'])
@Index(['device_time'])
export class Position {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column()
    device_id: number;

    @ManyToOne(() => Device, (device) => device.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'device_id' })
    device: Device;

    @Column()
    protocol: string;

    // Timestamps
    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    server_time: Date;

    @Column()
    device_time: Date;

    @Column()
    fix_time: Date;

    // Location (PostGIS geometry)
    @Column({
        type: 'geometry',
        spatialFeatureType: 'Point',
        srid: 4326,
    })
    @Index({ spatial: true })
    geom: string; // GeoJSON or WKT

    @Column({ type: 'double precision' })
    latitude: number;

    @Column({ type: 'double precision' })
    longitude: number;

    @Column({ type: 'double precision', default: 0 })
    altitude: number;

    // Movement data
    @Column({ type: 'double precision', default: 0 })
    speed: number;

    @Column({ type: 'double precision', default: 0 })
    course: number;

    // GPS quality indicators
    @Column({ type: 'double precision', nullable: true })
    accuracy: number;

    @Column({ nullable: true })
    satellites: number;

    @Column({ type: 'double precision', nullable: true })
    hdop: number;

    // Network info
    @Column({ type: 'jsonb', nullable: true })
    network: Record<string, any>;

    // All other sensor data
    @Column({ type: 'jsonb', default: {} })
    attributes: Record<string, any>;

    // Data validity
    @Column({ default: true })
    valid: boolean;

    @Column({ default: false })
    outdated: boolean;

    @CreateDateColumn()
    created_at: Date;
}
