import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private reportsService: ReportsService) { }

    @Get('trips/:deviceId')
    async getTripHistory(
        @Param('deviceId', ParseIntPipe) deviceId: number,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        return this.reportsService.getTripHistory(deviceId, start, end);
    }

    @Get('distance/:deviceId')
    async getDistanceReport(
        @Param('deviceId', ParseIntPipe) deviceId: number,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        return this.reportsService.getDistanceReport(deviceId, start, end);
    }

    @Get('speed/:deviceId')
    async getSpeedReport(
        @Param('deviceId', ParseIntPipe) deviceId: number,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('speedLimit') speedLimit?: string,
    ) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const limit = speedLimit ? parseInt(speedLimit) : 100;

        return this.reportsService.getSpeedReport(deviceId, start, end, limit);
    }

    @Get('geofence-activity/:deviceId')
    async getGeofenceActivity(
        @Param('deviceId', ParseIntPipe) deviceId: number,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        return this.reportsService.getGeofenceActivityReport(deviceId, start, end);
    }

    @Get('summary/:deviceId')
    async getDeviceSummary(
        @Param('deviceId', ParseIntPipe) deviceId: number,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const [trips, distance, speed, geofenceActivity] = await Promise.all([
            this.reportsService.getTripHistory(deviceId, start, end),
            this.reportsService.getDistanceReport(deviceId, start, end),
            this.reportsService.getSpeedReport(deviceId, start, end),
            this.reportsService.getGeofenceActivityReport(deviceId, start, end),
        ]);

        return {
            deviceId,
            deviceName: distance.deviceName,
            period: { startDate: start, endDate: end },
            trips: {
                total: trips.length,
                totalDistance: distance.totalDistance,
                totalDuration: trips.reduce((sum, t) => sum + t.duration, 0),
            },
            speed: {
                max: speed.maxSpeed,
                avg: speed.avgSpeed,
                violations: speed.overspeedViolations.length,
            },
            geofences: {
                totalEntries: geofenceActivity.summary.totalEntries,
                totalExits: geofenceActivity.summary.totalExits,
            },
        };
    }
}
