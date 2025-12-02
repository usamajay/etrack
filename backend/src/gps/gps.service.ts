import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/Device.entity';
import { Position } from '../entities/Position.entity';
import { EventsGateway } from '../events/events.gateway';
import { GeofencesService } from '../geofences/geofences.service';
import { AlertsService } from '../alerts/alerts.service';
import { EventType } from '../entities/Event.entity';
import * as net from 'net';

@Injectable()
export class GpsService {
    private readonly logger = new Logger(GpsService.name);

    constructor(
        @InjectRepository(Device)
        private deviceRepository: Repository<Device>,
        @InjectRepository(Position)
        private positionRepository: Repository<Position>,
        private readonly eventsGateway: EventsGateway,
        private readonly geofencesService: GeofencesService,
        private readonly alertsService: AlertsService,
    ) { }

    async processData(data: any, socket: net.Socket | null) {
        try {
            // Log raw data for debugging
            this.logger.debug(`Processing data: ${JSON.stringify(data)}`);

            if (!data.deviceId) {
                this.logger.warn('No deviceId in data');
                return;
            }

            // Find device by unique_id (IMEI)
            const device = await this.deviceRepository.findOne({
                where: { unique_id: data.deviceId },
            });

            if (!device) {
                this.logger.warn(`Device not found: ${data.deviceId}`);
                return;
            }

            // Save to DB
            const position = new Position();
            position.device_id = device.id;
            position.latitude = data.latitude;
            position.longitude = data.longitude;
            position.speed = data.speed;
            position.course = data.course;
            position.fix_time = data.fixTime || new Date();
            position.device_time = data.deviceTime || new Date();
            position.attributes = data.attributes || {};
            position.protocol = data.protocol || 'unknown';

            // Create a Point geometry (WKT)
            position.geom = `POINT(${data.longitude} ${data.latitude})`;

            const savedPosition = await this.positionRepository.save(position);

            // Check Geofences and trigger events
            const activeGeofences = await this.geofencesService.checkGeofence(data.latitude, data.longitude);

            for (const geofence of activeGeofences) {
                const stateResult = await this.alertsService.trackGeofenceState(
                    device.id,
                    geofence.id,
                    true, // inside
                );

                if (stateResult.changed && stateResult.eventType === EventType.GEOFENCE_ENTER) {
                    this.logger.log(`🚨 Device ${device.name} ENTERED geofence: ${geofence.name}`);

                    const event = await this.alertsService.createEvent(
                        EventType.GEOFENCE_ENTER,
                        device,
                        {
                            geofenceName: geofence.name,
                            latitude: data.latitude,
                            longitude: data.longitude,
                            speed: data.speed,
                        },
                        geofence.id,
                        savedPosition.id,
                    );

                    await this.alertsService.checkAlertRules(event);
                }
            }

            // Emit to WebSocket
            this.eventsGateway.emitNewPosition(data);

        } catch (error) {
            this.logger.error(`Error processing GPS data: ${error.message}`);
        }
    }
}
