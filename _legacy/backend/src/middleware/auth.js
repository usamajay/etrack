const jwt = require('jsonwebtoken');
const { User, Vehicle, Organization } = require('../models');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required. Missing or invalid token.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findByPk(decoded.id);
        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'User not found or inactive.' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

const requireVehicleAccess = async (req, res, next) => {
    try {
        const vehicleId = req.params.id || req.params.vehicleId || req.body.vehicle_id;

        if (!vehicleId) {
            return res.status(400).json({ error: 'Vehicle ID is required.' });
        }

        const vehicle = await Vehicle.findByPk(vehicleId, {
            include: [{
                model: Organization,
                attributes: ['owner_id']
            }]
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found.' });
        }

        // Check if user owns the organization that owns the vehicle
        // Note: In a more complex system, we would check for organization membership/roles
        if (vehicle.Organization.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. You do not own this vehicle.' });
        }

        req.vehicle = vehicle;
        next();
    } catch (error) {
        console.error('Vehicle access check error:', error);
        return res.status(500).json({ error: 'Internal server error during access check.' });
    }
};

module.exports = { authenticate, requireVehicleAccess };
