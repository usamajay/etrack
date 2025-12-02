const { Alert, Vehicle, Organization } = require('../../models');
const geofenceService = require('../gps/geofenceService');

class AlertService {
    /**
     * Create new alert
     */
    async createAlert(vehicleId, type, message, severity, data) {
        try {
            return await Alert.create({
                vehicle_id: vehicleId,
                type,
                message,
                severity,
                data,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error creating alert:', error);
        }
    }

    /**
     * Check if vehicle is speeding
     */
    async checkSpeedingAlert(vehicle, position, speedLimit) {
        if (position.speed > speedLimit) {
            await this.createAlert(
                vehicle.id,
                'speeding',
                `Vehicle ${vehicle.name} is speeding: ${position.speed} km/h (Limit: ${speedLimit})`,
                'high',
                { speed: position.speed, limit: speedLimit, location: { lat: position.latitude, lon: position.longitude } }
            );
        }
    }

    /**
     * Check geofence violations
     * This logic assumes we want to alert when INSIDE a geofence (e.g. Restricted Zone)
     * OR we could track state to alert on ENTER/EXIT.
     * For simplicity here: Alert if inside a "Restricted" geofence (if we had that type)
     * OR just log which geofences it is in.
     * 
     * Let's implement a simple "Geofence Entry" alert for now.
     * To do this properly, we need previous state. 
     * For this stateless check, we'll just check if it's currently inside any geofence.
     */
    async checkGeofenceAlert(vehicle, position) {
        const insideGeofences = await geofenceService.getViolations(vehicle.id, position);

        if (insideGeofences.length > 0) {
            // In a real system, check if it was ALREADY inside to avoid spamming alerts
            // Here we just create an alert for demonstration
            for (const geofence of insideGeofences) {
                await this.createAlert(
                    vehicle.id,
                    'geofence',
                    `Vehicle ${vehicle.name} is inside geofence: ${geofence.name}`,
                    'medium',
                    { geofence_id: geofence.id, geofence_name: geofence.name }
                );
            }
        }
    }

    /**
     * Check if vehicle hasn't sent data in 30 minutes
     */
    async checkOfflineAlert(vehicle) {
        if (!vehicle.last_connection) return;

        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        if (new Date(vehicle.last_connection) < thirtyMinutesAgo) {
            await this.createAlert(
                vehicle.id,
                'offline',
                `Vehicle ${vehicle.name} is offline since ${vehicle.last_connection}`,
                'medium',
                { last_seen: vehicle.last_connection }
            );
        }
    }

    /**
     * Get all unread alerts for organization
     */
    async getUnreadAlerts(organizationId) {
        // Find all vehicles in org
        const vehicles = await Vehicle.findAll({ where: { organization_id: organizationId }, attributes: ['id'] });
        const vehicleIds = vehicles.map(v => v.id);

        return await Alert.findAll({
            where: {
                vehicle_id: vehicleIds,
                is_read: false
            },
            order: [['timestamp', 'DESC']],
            include: [{ model: Vehicle, attributes: ['name', 'registration_number'] }]
        });
    }

    /**
     * Mark alert as read
     */
    async markAsRead(alertId) {
        const alert = await Alert.findByPk(alertId);
        if (alert) {
            alert.is_read = true;
            await alert.save();
        }
        return alert;
    }
}

module.exports = new AlertService();
