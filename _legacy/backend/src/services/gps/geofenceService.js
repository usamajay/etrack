const positionService = require('./positionService');
const { Geofence, Organization, Vehicle } = require('../../models');

class GeofenceService {
    /**
     * Check if point is inside geofence
     */
    checkGeofence(latitude, longitude, geofence) {
        if (geofence.type === 'circle') {
            return this.checkCircleGeofence(
                latitude,
                longitude,
                parseFloat(geofence.center_latitude),
                parseFloat(geofence.center_longitude),
                parseFloat(geofence.radius)
            );
        } else if (geofence.type === 'polygon') {
            return this.checkPolygonGeofence(latitude, longitude, geofence.coordinates);
        }
        return false;
    }

    /**
     * Check if point inside circle
     */
    checkCircleGeofence(lat, lon, centerLat, centerLon, radius) {
        const distance = positionService.calculateDistance(lat, lon, centerLat, centerLon);
        // distance is in km, radius is usually in meters. Convert radius to km.
        return distance <= (radius / 1000);
    }

    /**
     * Check if point inside polygon using ray casting
     * coordinates: [[lat, lon], [lat, lon], ...]
     */
    checkPolygonGeofence(lat, lon, coordinates) {
        let inside = false;
        for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
            const xi = parseFloat(coordinates[i][0]), yi = parseFloat(coordinates[i][1]);
            const xj = parseFloat(coordinates[j][0]), yj = parseFloat(coordinates[j][1]);

            const intersect = ((yi > lon) !== (yj > lon))
                && (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    /**
     * Check all geofences and return violations (or just status)
     * This is typically called when a new position is received.
     */
    async getViolations(vehicleId, position) {
        try {
            const vehicle = await Vehicle.findByPk(vehicleId);
            if (!vehicle) return [];

            const geofences = await Geofence.findAll({
                where: {
                    organization_id: vehicle.organization_id,
                    is_active: true
                }
            });

            const violations = [];
            for (const geofence of geofences) {
                const isInside = this.checkGeofence(position.latitude, position.longitude, geofence);
                // Logic depends on what we want to alert on: Entering? Exiting?
                // For now, let's just return which geofences the vehicle is currently INSIDE.
                // The AlertService will decide if this is a change of state (Enter/Exit).
                if (isInside) {
                    violations.push(geofence);
                }
            }
            return violations;
        } catch (error) {
            console.error('Error checking violations:', error);
            return [];
        }
    }
}

module.exports = new GeofenceService();
