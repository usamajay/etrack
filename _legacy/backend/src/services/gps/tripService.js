const { Trip, Position } = require('../../models');
const { Op } = require('sequelize');
const positionService = require('./positionService');

class TripService {
    /**
     * Create new trip when vehicle starts moving
     */
    async createTrip(vehicleId, startPosition) {
        try {
            // Check if there is already an active trip
            const activeTrip = await this.getActiveTrip(vehicleId);
            if (activeTrip) {
                return activeTrip;
            }

            const trip = await Trip.create({
                vehicle_id: vehicleId,
                start_time: startPosition.timestamp || new Date(),
                start_latitude: startPosition.latitude,
                start_longitude: startPosition.longitude,
            });

            return trip;
        } catch (error) {
            console.error('Error creating trip:', error);
            throw error;
        }
    }

    /**
     * End trip and calculate stats
     */
    async endTrip(tripId, endPosition) {
        try {
            const trip = await Trip.findByPk(tripId);
            if (!trip) {
                throw new Error('Trip not found');
            }

            // Get all positions for this trip to calculate stats
            const positions = await positionService.getPositionHistory(
                trip.vehicle_id,
                trip.start_time,
                endPosition.timestamp || new Date()
            );

            const stats = this.calculateTripStats(positions);

            await trip.update({
                end_time: endPosition.timestamp || new Date(),
                end_latitude: endPosition.latitude,
                end_longitude: endPosition.longitude,
                distance: stats.distance,
                max_speed: stats.maxSpeed,
                average_speed: stats.avgSpeed,
                duration: stats.duration
            });

            return trip;
        } catch (error) {
            console.error('Error ending trip:', error);
            throw error;
        }
    }

    /**
     * Get active/ongoing trip for vehicle
     */
    async getActiveTrip(vehicleId) {
        try {
            return await Trip.findOne({
                where: {
                    vehicle_id: vehicleId,
                    end_time: null
                }
            });
        } catch (error) {
            console.error('Error getting active trip:', error);
            throw error;
        }
    }

    /**
     * Get all trips in date range
     */
    async getTripsByVehicle(vehicleId, startDate, endDate) {
        try {
            const whereClause = {
                vehicle_id: vehicleId
            };

            if (startDate && endDate) {
                whereClause.start_time = {
                    [Op.between]: [startDate, endDate]
                };
            }

            return await Trip.findAll({
                where: whereClause,
                order: [['start_time', 'DESC']]
            });
        } catch (error) {
            console.error('Error getting trips:', error);
            throw error;
        }
    }

    /**
     * Calculate distance, max speed, average speed from position array
     */
    calculateTripStats(positions) {
        if (!positions || positions.length < 2) {
            return { distance: 0, maxSpeed: 0, avgSpeed: 0, duration: 0 };
        }

        let totalDistance = 0;
        let maxSpeed = 0;
        let totalSpeed = 0;

        for (let i = 0; i < positions.length - 1; i++) {
            const p1 = positions[i];
            const p2 = positions[i + 1];

            const dist = positionService.calculateDistance(
                parseFloat(p1.latitude), parseFloat(p1.longitude),
                parseFloat(p2.latitude), parseFloat(p2.longitude)
            );
            totalDistance += dist;

            const speed = parseFloat(p1.speed || 0);
            if (speed > maxSpeed) maxSpeed = speed;
            totalSpeed += speed;
        }

        // Check last point speed
        const lastSpeed = parseFloat(positions[positions.length - 1].speed || 0);
        if (lastSpeed > maxSpeed) maxSpeed = lastSpeed;
        totalSpeed += lastSpeed;

        const avgSpeed = totalSpeed / positions.length;

        const startTime = new Date(positions[0].timestamp).getTime();
        const endTime = new Date(positions[positions.length - 1].timestamp).getTime();
        const duration = (endTime - startTime) / 1000; // seconds

        return {
            distance: parseFloat(totalDistance.toFixed(2)),
            maxSpeed: parseFloat(maxSpeed.toFixed(2)),
            avgSpeed: parseFloat(avgSpeed.toFixed(2)),
            duration: Math.round(duration)
        };
    }
}

module.exports = new TripService();
