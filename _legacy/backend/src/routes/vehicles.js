const express = require('express');
const router = express.Router();
const { Vehicle, Organization, Position, Device } = require('../models');
const { authenticate, requireVehicleAccess } = require('../middleware/auth');

// GET / - Get all vehicles for user's organization(s)
router.get('/', authenticate, async (req, res) => {
    try {
        // Find organizations owned by user
        const organizations = await Organization.findAll({
            where: { owner_id: req.user.id },
            attributes: ['id']
        });

        const orgIds = organizations.map(org => org.id);

        const vehicles = await Vehicle.findAll({
            where: { organization_id: orgIds },
            include: [
                { model: Device, attributes: ['imei', 'is_active'] },
                { model: Organization, attributes: ['name'] }
            ]
        });

        res.json(vehicles);
    } catch (error) {
        console.error('Get Vehicles Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /:id - Get single vehicle
router.get('/:id', authenticate, requireVehicleAccess, async (req, res) => {
    try {
        // req.vehicle is already populated by middleware
        const vehicle = await Vehicle.findByPk(req.params.id, {
            include: [
                { model: Device },
                { model: Organization }
            ]
        });
        res.json(vehicle);
    } catch (error) {
        console.error('Get Vehicle Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST / - Create new vehicle
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, registration_number, model, color, organization_id, device_id } = req.body;

        // Verify organization ownership
        const organization = await Organization.findOne({
            where: { id: organization_id, owner_id: req.user.id }
        });

        if (!organization) {
            return res.status(403).json({ error: 'Invalid organization or access denied' });
        }

        const vehicle = await Vehicle.create({
            name,
            registration_number,
            model,
            color,
            organization_id,
            device_id
        });

        res.status(201).json(vehicle);
    } catch (error) {
        console.error('Create Vehicle Error:', error);
        console.error('Request Body:', req.body); // Log the payload causing the error
        res.status(500).json({ error: error.message || 'Server error' }); // Send more detail for debugging (optional, or keep generic)
    }
});

// PUT /:id - Update vehicle
router.put('/:id', authenticate, requireVehicleAccess, async (req, res) => {
    try {
        const { name, registration_number, model, color, device_id } = req.body;
        const vehicle = req.vehicle; // From middleware

        await vehicle.update({
            name,
            registration_number,
            model,
            color,
            device_id
        });

        res.json(vehicle);
    } catch (error) {
        console.error('Update Vehicle Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /:id - Delete vehicle
router.delete('/:id', authenticate, requireVehicleAccess, async (req, res) => {
    try {
        const vehicle = req.vehicle; // From middleware
        await vehicle.destroy();
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Delete Vehicle Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /:id/position - Get latest position
router.get('/:id/position', authenticate, requireVehicleAccess, async (req, res) => {
    try {
        const position = await Position.findOne({
            where: { vehicle_id: req.params.id },
            order: [['timestamp', 'DESC']]
        });

        if (!position) {
            return res.status(404).json({ message: 'No position data found' });
        }

        res.json(position);
    } catch (error) {
        console.error('Get Position Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
