const { Vehicle, Device, Alert, Trip, Organization, Position } = require('../../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../models');

class AnalyticsService {

    async getOrganizationStats(orgId) {
        const vehicles = await Vehicle.count({ where: { organization_id: orgId } });

        // Active devices (connected in last 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // We need to join Vehicle -> Device to filter by org
        // Or find all vehicles for org, then count their devices that are active
        const activeDevices = await Device.count({
            include: [{
                model: Vehicle,
                where: { organization_id: orgId }
            }],
            where: {
                last_connection: { [Op.gte]: oneDayAgo }
            }
        });

        const alerts = await Alert.count({
            include: [{
                model: Vehicle,
                where: { organization_id: orgId }
            }],
            where: { is_read: false }
        });

        return {
            total_vehicles: vehicles,
            active_devices: activeDevices,
            unread_alerts: alerts
        };
    }

    async getVehicleStats(vehicleId, period = 'week') {
        const startDate = this.getStartDate(period);

        const trips = await Trip.findAll({
            where: {
                vehicle_id: vehicleId,
                start_time: { [Op.gte]: startDate }
            }
        });

        const totalDistance = trips.reduce((sum, t) => sum + parseFloat(t.distance || 0), 0);
        const totalDuration = trips.reduce((sum, t) => sum + (t.duration || 0), 0); // seconds
        const tripCount = trips.length;

        return {
            period,
            total_distance_km: totalDistance.toFixed(2),
            total_duration_hours: (totalDuration / 3600).toFixed(1),
            trip_count: tripCount
        };
    }

    async getFleetStats(orgId, period = 'week') {
        const startDate = this.getStartDate(period);

        // Aggregate stats for all vehicles in org
        // This might be heavy, better to use raw query or optimized aggregation
        const stats = await Trip.findAll({
            include: [{
                model: Vehicle,
                where: { organization_id: orgId },
                attributes: []
            }],
            where: {
                start_time: { [Op.gte]: startDate }
            },
            attributes: [
                [sequelize.fn('sum', sequelize.col('distance')), 'total_distance'],
                [sequelize.fn('sum', sequelize.col('duration')), 'total_duration'],
                [sequelize.fn('count', sequelize.col('Trip.id')), 'total_trips']
            ],
            raw: true
        });

        return stats[0];
    }

    async getDriverBehavior(vehicleId, period = 'week') {
        const startDate = this.getStartDate(period);

        const speeding = await Alert.count({
            where: {
                vehicle_id: vehicleId,
                type: 'speeding',
                timestamp: { [Op.gte]: startDate }
            }
        });

        const geofence = await Alert.count({
            where: {
                vehicle_id: vehicleId,
                type: 'geofence',
                timestamp: { [Op.gte]: startDate }
            }
        });

        // Harsh braking/acceleration would require analyzing raw positions for g-force
        // For now, we return alert counts
        return {
            speeding_events: speeding,
            geofence_violations: geofence,
            safety_score: Math.max(100 - (speeding * 5 + geofence * 10), 0) // Simple score
        };
    }

    async getPopularRoutes(orgId) {
        // This is complex. Usually requires clustering start/end points.
        // For MVP, we can return most frequent start/end locations (if we had geocoding)
        // Or just return top 5 longest trips

        return await Trip.findAll({
            include: [{
                model: Vehicle,
                where: { organization_id: orgId }
            }],
            order: [['distance', 'DESC']],
            limit: 5
        });
    }

    getStartDate(period) {
        const now = new Date();
        if (period === 'day') return new Date(now.setDate(now.getDate() - 1));
        if (period === 'week') return new Date(now.setDate(now.getDate() - 7));
        if (period === 'month') return new Date(now.setMonth(now.getMonth() - 1));
        return new Date(0); // All time
    }
}

module.exports = new AnalyticsService();
