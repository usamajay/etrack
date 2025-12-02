import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Geofence } from '../entities/Geofence.entity';
import { User } from '../entities/User.entity';
import { CreateGeofenceDto } from './dto/create-geofence.dto';

@Injectable()
export class GeofencesService {
    constructor(
        @InjectRepository(Geofence)
        private geofencesRepository: Repository<Geofence>,
    ) { }

    async create(createGeofenceDto: CreateGeofenceDto, user: User): Promise<Geofence> {
        const geofence = this.geofencesRepository.create({
            ...createGeofenceDto,
            user,
        });
        return this.geofencesRepository.save(geofence);
    }

    async findAll(user: User): Promise<Geofence[]> {
        return this.geofencesRepository.find({
            where: { user: { id: user.id } },
        });
    }

    async findOne(id: string, user: User): Promise<Geofence | null> {
        return this.geofencesRepository.findOne({
            where: { id, user: { id: user.id } },
        });
    }

    async remove(id: string, user: User): Promise<void> {
        await this.geofencesRepository.delete({ id, user: { id: user.id } });
    }

    /**
     * Check if a point is inside any geofence
     * @param latitude 
     * @param longitude 
     * @param userId Optional: check only specific user's geofences
     */
    async checkGeofence(latitude: number, longitude: number, userId?: string): Promise<Geofence[]> {
        // PostGIS query to check containment
        // ST_Contains(area, point) OR (type='circle' AND ST_Distance(center, point) <= radius)

        // Note: ST_Distance returns degrees for geometry type 4326. 
        // For meters, we should cast to geography or use ST_Distance_Sphere (deprecated) or ST_DistanceSphere.
        // However, TypeORM's query builder with spatial functions can be tricky.
        // A simpler approach for circles is to use ST_DWithin(center::geography, point::geography, radius)

        const query = this.geofencesRepository.createQueryBuilder('geofence')
            .where(`
        (type = 'polygon' AND ST_Contains(area, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)))
        OR
        (type = 'circle' AND ST_DWithin(center::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, radius))
      `, { lat: latitude, lon: longitude });

        if (userId) {
            query.andWhere('geofence.userId = :userId', { userId });
        }

        return query.getMany();
    }
}
