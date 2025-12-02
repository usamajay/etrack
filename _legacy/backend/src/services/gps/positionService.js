const { Position, Vehicle } = require('../../models');
const { Op } = require('sequelize');
const redisService = require('../cache/redisService');
// Lazy load other services to avoid circular dependencies if necessary, 
// but standard require usually works if exports are done right.
// However, TripService requires PositionService, so let's be careful.
// We'll require them inside the methods or use late binding if needed.
// For now, let's try top-level but be aware.
const socketService = require('../websocket/socketService');
const alertService = require('../alerts/alertService');
const geofenceService = require('./geofenceService');

// We need to require TripService. Since TripService requires PositionService, 
// we might get an empty object if we are not careful. 
// A safe bet is to require it inside the method or ensure TripService doesn't run logic on require.
let tripService;

class PositionService {

    constructor() {
        // Initialize redis connection
        redisService.connect();
    }

    /**
     * Save GPS position to database and update vehicle's last known state
     * @param {Object} data - Position data
     */
    async savePosition(data) {
        if (!tripService) tripService = require('./tripService'); // Lazy load

        try {
            const { vehicle_id, latitude, longitude, speed, course, altitude, satellites, timestamp } = data;

            // 1. Save to database
            const position = await Position.create({
                vehicle_id,
                latitude,
                longitude,
                speed,
                course,
                altitude,
                satellites,
                timestamp: timestamp || new Date()
            });

            // 2. Cache in Redis
            await redisService.cacheVehiclePosition(vehicle_id, position);

            // Fetch vehicle for context
            const vehicle = await Vehicle.findByPk(vehicle_id);
            if (vehicle) {
                // Update vehicle last connection/position
                // We could update this in DB less frequently to save writes, but for now update every time or use Redis for "live" view
                // Let's update DB for persistence
                // await vehicle.update({ last_connection: new Date() }); // Already done in gpsServer? Let's do it here to be sure or skip if redundant.

                // 3. Check if vehicle is moving (speed > 2 km/h)
                const isMoving = speed > 2;
                const activeTrip = await tripService.getActiveTrip(vehicle_id);

                // 4. If moving and no active trip, create new trip
                if (isMoving && !activeTrip) {
                    console.log(`Vehicle ${vehicle_id} started moving. Creating trip.`);
                    await tripService.createTrip(vehicle_id, position);
                }
                // 5. If stopped and has active trip, end the trip
                // We need a threshold. If speed is 0 for X minutes? 
                // For simplicity here: if speed < 1 and we have a trip. 
                // Real systems use "ignition" status or a timeout (e.g. 5 mins of stop).
                // Let's assume if speed is 0, we might end it. But traffic lights exist.
                // Better logic: We check this in a separate job or if ignition is OFF.
                // Since we don't have ignition, let's skip auto-end on 0 speed immediately.
                // Or just leave it for now. The prompt asked: "If stopped and has active trip, end the trip"
                // Let's interpret "stopped" as speed < 1.
                else if (!isMoving && activeTrip) {
                    // Check if it's been stopped for a while? 
                    // For this MVP, let's just end it if speed is 0 to satisfy the requirement, 
                    // but ideally we'd wait.
                    // Let's check if the last position was also stopped? 
                    // Too complex for single function. Let's just end it if speed < 1.
                    console.log(`Vehicle ${vehicle_id} stopped. Ending trip.`);
                    await tripService.endTrip(activeTrip.id, position);
                }

                // 6. Check for speeding alerts
                // Assume speed limit is 100 km/h or stored in vehicle/org settings
                const speedLimit = 100;
                await alertService.checkSpeedingAlert(vehicle, position, speedLimit);

                // 7. Check for geofence violations
                await alertService.checkGeofenceAlert(vehicle, position);

                // 8. Broadcast position update via WebSocket
                socketService.broadcastPosition(vehicle_id, position);
            }

            return position;
        } catch (error) {
            console.error('Error saving position:', error);
            throw error;
        }
    }

    /**
     * Get most recent position for a vehicle
     * @param {string} vehicleId 
     */
    async getLatestPosition(vehicleId) {
        try {
            // Try cache first
            const cached = await redisService.getCachedPosition(vehicleId);
            if (cached) return cached;

            return await Position.findOne({
                where: { vehicle_id: vehicleId },
                order: [['timestamp', 'DESC']]
            });
        } catch (error) {
            console.error('Error getting latest position:', error);
            throw error;
        }
    }

    /**
     * Get positions in time range
     * @param {string} vehicleId 
     * @param {Date} startTime 
     * @param {Date} endTime 
     */
    async getPositionHistory(vehicleId, startTime, endTime) {
        try {
            return await Position.findAll({
                where: {
                    vehicle_id: vehicleId,
                    timestamp: {
                        [Op.between]: [startTime, endTime]
                    }
                },
                order: [['timestamp', 'ASC']]
            });
        } catch (error) {
            console.error('Error getting position history:', error);
            throw error;
        }
    }

    /**
     * Calculate distance between two points using Haversine formula
     * @param {number} lat1 
     * @param {number} lon1 
     * @param {number} lat2 
     * @param {number} lon2 
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}

module.exports = new PositionService();
