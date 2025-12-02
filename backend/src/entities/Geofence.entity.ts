import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './User.entity';
import type { Geometry } from 'geojson';

@Entity('geofences')
export class Geofence {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: ['circle', 'polygon'],
        default: 'circle',
    })
    type: 'circle' | 'polygon';

    // For Polygons: Store the full geometry
    @Index({ spatial: true })
    @Column({
        type: 'geometry',
        spatialFeatureType: 'Geometry',
        srid: 4326,
        nullable: true,
    })
    area: Geometry;

    // For Circles: Store center point and radius (in meters)
    @Column({ type: 'float', nullable: true })
    radius: number;

    @Column({
        type: 'geometry',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
    })
    center: Geometry;

    @ManyToOne(() => User, (user) => user.geofences, { onDelete: 'CASCADE' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
