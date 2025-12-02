import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeofencesService } from './geofences.service';
import { GeofencesController } from './geofences.controller';
import { Geofence } from '../entities/Geofence.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Geofence])],
    controllers: [GeofencesController],
    providers: [GeofencesService],
    exports: [GeofencesService],
})
export class GeofencesModule { }
