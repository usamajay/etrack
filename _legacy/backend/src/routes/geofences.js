const express = require('express');
const router = express.Router();
const { Geofence, Organization, Vehicle, Position } = require('../models');
const { authenticate } = require('../middleware/auth');
const geofenceService = require('../services/gps/geofenceService');
const positionService = require('../services/gps/positionService');

// GET / - Get all geofences for user's organization
router.get('/', authenticate, async (req, res) => {
    try {
        const organizations = await Organization.findAll({
            where: { owner_id: req.user.id },
            attributes: ['id']
        });
        const orgIds = organizations.map(org => org.id);

        const geofences = await Geofence.findAll({
            where: { organization_id: orgIds }
        });
        res.json(geofences);
    } catch (error) {
        console.error('Get Geofences Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /:id - Get single geofence
router.get('/:id', authenticate, async (req, res) => {
    try {
        const geofence = await Geofence.findByPk(req.params.id);
        if (!geofence) return res.status(404).json({ error: 'Geofence not found' });
        res.json(geofence);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST / - Create new geofence
router.post('/', authenticate, async (req, res) => {
    try {
        const { organization_id, name, type, center_latitude, center_longitude, radius, coordinates, alert_on_entry, alert_on_exit, assigned_vehicles } = req.body;

        // Verify org ownership
        const org = await Organization.findOne({ where: { id: organization_id, owner_id: req.user.id } });
        if (!org) return res.status(403).json({ error: 'Access denied' });

        const geofence = await Geofence.create({
            organization_id, name, type, center_latitude, center_longitude, radius, coordinates, alert_on_entry, alert_on_exit, assigned_vehicles
        });
        res.status(201).json(geofence);
    } catch (error) {
        console.error('Create Geofence Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /:id - Update geofence
router.put('/:id', authenticate, async (req, res) => {
    try {
        const geofence = await Geofence.findByPk(req.params.id);
        if (!geofence) return res.status(404).json({ error: 'Geofence not found' });

        // Verify org ownership
        const org = await Organization.findOne({ where: { id: geofence.organization_id, owner_id: req.user.id } });
        if (!org) return res.status(403).json({ error: 'Access denied' });

        await geofence.update(req.body);
        res.json(geofence);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /:id - Delete geofence
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const geofence = await Geofence.findByPk(req.params.id);
        if (!geofence) return res.status(404).json({ error: 'Geofence not found' });

        const org = await Organization.findOne({ where: { id: geofence.organization_id, owner_id: req.user.id } });
        if (!org) return res.status(403).json({ error: 'Access denied' });

        await geofence.destroy();
        res.json({ message: 'Geofence deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /:id/vehicles - Get vehicles currently inside this geofence
router.get('/:id/vehicles', authenticate, async (req, res) => {
    try {
        const geofence = await Geofence.findByPk(req.params.id);
        if (!geofence) return res.status(404).json({ error: 'Geofence not found' });

        // Get all vehicles for this organization
        const vehicles = await Vehicle.findAll({
            where: { organization_id: geofence.organization_id }
        });

        const insideVehicles = [];
        for (const vehicle of vehicles) {
            const lastPos = await positionService.getLatestPosition(vehicle.id);
            if (lastPos) {
                if (geofenceService.checkGeofence(lastPos.latitude, lastPos.longitude, geofence)) {
                    insideVehicles.push(vehicle);
                }
            }
        }

        res.json(insideVehicles);
    } catch (error) {
        console.error('Get Vehicles in Geofence Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
