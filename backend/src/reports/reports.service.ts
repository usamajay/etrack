import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Position } from '../entities/Position.entity';
import { Event, EventType } from '../entities/Event.entity';
import { Device } from '../entities/Device.entity';

export interface Trip {
    id: string;
    deviceId: number;
    startTime: Date;
    endTime: Date;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    distance: number; // in km
    duration: number; // in minutes
    maxSpeed: number;
    avgSpeed: number;
    positions: Position[];
}

export interface DistanceReport {
    deviceId: number;
    deviceName: string;
    startDate: Date;
    endDate: Date;
    totalDistance: number; // in km
    dailyBreakdown: {
        date: string;
        distance: number;
    }[];
}

export interface SpeedReport {
    deviceId: number;
    deviceName: string;
    startDate: Date;
    endDate: Date;
    maxSpeed: number;
    avgSpeed: number;
    overspeedViolations: {
        timestamp: Date;
        speed: number;
        latitude: number;
        longitude: number;
    }[];
    speedDistribution: {
        range: string; // e.g., "0-20", "20-40"
        count: number;
    }[];
}

export interface GeofenceActivityReport {
    deviceId: number;
    deviceName: string;
    startDate: Date;
    endDate: Date;
    events: {
        id: string;
        type: EventType;
        geofenceName: string;
        timestamp: Date;
        latitude: number;
        longitude: number;
    }[];
    summary: {
        totalEntries: number;
        totalExits: number;
        geofences: {
            name: string;
            entries: number;
            exits: number;
        }[];
    };
}

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);

    constructor(
        @InjectRepository(Position)
        private positionRepository: Repository<Position>,
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(Device)
        private deviceRepository: Repository<Device>,
    ) { }

    /**
     * Get trip history for a device
     */
    async getTripHistory(
        deviceId: number,
        startDate: Date,
        endDate: Date,
    ): Promise<Trip[]> {
        // Get all positions for the time range
        const positions = await this.positionRepository.find({
            where: {
                device_id: deviceId,
                fix_time: Between(startDate, endDate),
            },
            order: { fix_time: 'ASC' },
        });

        if (positions.length === 0) {
            return [];
        }

        // Detect trips (movement periods)
        const trips: Trip[] = [];
        let currentTrip: Partial<Trip> | null = null;
        let lastPosition: Position | null = null;

        for (const position of positions) {
            const speed = position.speed || 0;

            // Trip starts when speed > 5 km/h
            if (!currentTrip && speed > 5) {
                currentTrip = {
                    id: `trip_${position.id}`,
                    deviceId,
                    startTime: position.fix_time,
                    startLat: position.latitude,
                    startLng: position.longitude,
                    positions: [position],
                    maxSpeed: speed,
                    distance: 0,
                };
            }
            // Trip continues
            else if (currentTrip && speed > 0) {
                currentTrip.positions!.push(position);
                currentTrip.maxSpeed = Math.max(currentTrip.maxSpeed!, speed);

                // Calculate distance from last position
                if (lastPosition) {
                    const dist = this.calculateDistance(
                        lastPosition.latitude,
                        lastPosition.longitude,
                        position.latitude,
                        position.longitude,
                    );
                    currentTrip.distance! += dist;
                }
            }
            // Trip ends when stopped for a while (speed = 0)
            else if (currentTrip && speed === 0) {
                // Check if stopped for more than 5 minutes
                const timeDiff = position.fix_time.getTime() - lastPosition!.fix_time.getTime();
                if (timeDiff > 5 * 60 * 1000) {
                    // End trip
                    currentTrip.endTime = lastPosition!.fix_time;
                    currentTrip.endLat = lastPosition!.latitude;
                    currentTrip.endLng = lastPosition!.longitude;
                    currentTrip.duration = Math.round(
                        (currentTrip.endTime.getTime() - currentTrip.startTime!.getTime()) / 60000,
                    );
                    currentTrip.avgSpeed = currentTrip.distance! / (currentTrip.duration! / 60);

                    trips.push(currentTrip as Trip);
                    currentTrip = null;
                }
            }

            lastPosition = position;
        }

        // Close last trip if still open
        if (currentTrip && lastPosition) {
            currentTrip.endTime = lastPosition.fix_time;
            currentTrip.endLat = lastPosition.latitude;
            currentTrip.endLng = lastPosition.longitude;
            currentTrip.duration = Math.round(
                (currentTrip.endTime.getTime() - currentTrip.startTime!.getTime()) / 60000,
            );
            currentTrip.avgSpeed = currentTrip.distance! / (currentTrip.duration! / 60);
            trips.push(currentTrip as Trip);
        }

        return trips;
    }

    /**
     * Get distance report
     */
    async getDistanceReport(
        deviceId: number,
        startDate: Date,
        endDate: Date,
    ): Promise<DistanceReport> {
        const device = await this.deviceRepository.findOne({ where: { id: deviceId } });
        const trips = await this.getTripHistory(deviceId, startDate, endDate);

        const totalDistance = trips.reduce((sum, trip) => sum + trip.distance, 0);

        // Group by day
        const dailyMap = new Map<string, number>();
        for (const trip of trips) {
            const day = trip.startTime.toISOString().split('T')[0];
            dailyMap.set(day, (dailyMap.get(day) || 0) + trip.distance);
        }

        const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, distance]) => ({
            date,
            distance: Math.round(distance * 100) / 100,
        }));

        return {
            deviceId,
            deviceName: device?.name || 'Unknown',
            startDate,
            endDate,
            totalDistance: Math.round(totalDistance * 100) / 100,
            dailyBreakdown,
        };
    }

    /**
     * Get speed report
     */
    async getSpeedReport(
        deviceId: number,
        startDate: Date,
        endDate: Date,
        speedLimit: number = 100,
    ): Promise<SpeedReport> {
        const device = await this.deviceRepository.findOne({ where: { id: deviceId } });
        const positions = await this.positionRepository.find({
            where: {
                device_id: deviceId,
                fix_time: Between(startDate, endDate),
            },
            order: { fix_time: 'ASC' },
        });

        if (positions.length === 0) {
            return {
                deviceId,
                deviceName: device?.name || 'Unknown',
                startDate,
                endDate,
                maxSpeed: 0,
                avgSpeed: 0,
                overspeedViolations: [],
                speedDistribution: [],
            };
        }

        const speeds = positions.map(p => p.speed || 0);
        const maxSpeed = Math.max(...speeds);
        const avgSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;

        // Find overspeed violations
        const overspeedViolations = positions
            .filter(p => (p.speed || 0) > speedLimit)
            .map(p => ({
                timestamp: p.fix_time,
                speed: p.speed || 0,
                latitude: p.latitude,
                longitude: p.longitude,
            }));

        // Speed distribution
        const ranges = [
            { range: '0-20', min: 0, max: 20 },
            { range: '20-40', min: 20, max: 40 },
            { range: '40-60', min: 40, max: 60 },
            { range: '60-80', min: 60, max: 80 },
            { range: '80-100', min: 80, max: 100 },
            { range: '100+', min: 100, max: Infinity },
        ];

        const speedDistribution = ranges.map(r => ({
            range: r.range,
            count: speeds.filter(s => s >= r.min && s < r.max).length,
        }));

        return {
            deviceId,
            deviceName: device?.name || 'Unknown',
            startDate,
            endDate,
            maxSpeed: Math.round(maxSpeed),
            avgSpeed: Math.round(avgSpeed),
            overspeedViolations,
            speedDistribution,
        };
    }

    /**
     * Get geofence activity report
     */
    async getGeofenceActivityReport(
        deviceId: number,
        startDate: Date,
        endDate: Date,
    ): Promise<GeofenceActivityReport> {
        const device = await this.deviceRepository.findOne({ where: { id: deviceId } });
        const events = await this.eventRepository.find({
            where: {
                device: { id: deviceId },
                type: Between(EventType.GEOFENCE_ENTER, EventType.GEOFENCE_EXIT) as any,
                timestamp: Between(startDate, endDate),
            },
            relations: ['geofence'],
            order: { timestamp: 'ASC' },
        });

        const formattedEvents = events.map(e => ({
            id: e.id,
            type: e.type,
            geofenceName: e.geofence?.name || 'Unknown',
            timestamp: e.timestamp,
            latitude: e.data.latitude || 0,
            longitude: e.data.longitude || 0,
        }));

        // Calculate summary
        const geofenceMap = new Map<string, { entries: number; exits: number }>();
        let totalEntries = 0;
        let totalExits = 0;

        for (const event of events) {
            const name = event.geofence?.name || 'Unknown';
            if (!geofenceMap.has(name)) {
                geofenceMap.set(name, { entries: 0, exits: 0 });
            }

            if (event.type === EventType.GEOFENCE_ENTER) {
                geofenceMap.get(name)!.entries++;
                totalEntries++;
            } else if (event.type === EventType.GEOFENCE_EXIT) {
                geofenceMap.get(name)!.exits++;
                totalExits++;
            }
        }

        const geofences = Array.from(geofenceMap.entries()).map(([name, stats]) => ({
            name,
            ...stats,
        }));

        return {
            deviceId,
            deviceName: device?.name || 'Unknown',
            startDate,
            endDate,
            events: formattedEvents,
            summary: {
                totalEntries,
                totalExits,
                geofences,
            },
        };
    }

    /**
     * Calculate distance between two points (Haversine formula)
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
            Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(degrees: number): number {
        return (degrees * Math.PI) / 180;
    }
}
