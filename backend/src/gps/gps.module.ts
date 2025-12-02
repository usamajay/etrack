import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpsService } from './gps.service';
import { GpsGateway } from './gps.gateway';
import { Device } from '../entities/Device.entity';
import { Position } from '../entities/Position.entity';
import { EventsModule } from '../events/events.module';
import { ProtocolFactory } from './protocols/protocol.factory';
import { Gt06Decoder } from './protocols/gt06.decoder';
import { H02Decoder } from './protocols/h02.decoder';
import { Tk103Decoder } from './protocols/tk103.decoder';
import { TeltonikaDecoder } from './protocols/teltonika.decoder';
import { GeofencesModule } from '../geofences/geofences.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Position]), EventsModule, GeofencesModule, AlertsModule],
  providers: [
    GpsService,
    GpsGateway,
    ProtocolFactory,
    Gt06Decoder,
    H02Decoder,
    Tk103Decoder,
    TeltonikaDecoder,
  ],
  exports: [GpsService, GpsGateway],
})
export class GpsModule { }
