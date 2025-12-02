const express = require('express');
const router = express.Router();
const { Alert, Vehicle, Organization } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET / - Get all alerts
router.get('/', authenticate, async (req, res) => {
    try {
        const { vehicle_id, type, is_read } = req.query;

        // Get user's organizations
        const organizations = await Organization.findAll({
            where: { owner_id: req.user.id },
            attributes: ['id']
        });
        const orgIds = organizations.map(org => org.id);

        // Get vehicles in these organizations
        const vehicles = await Vehicle.findAll({
            where: { organization_id: orgIds },
            attributes: ['id']
        });
        const vehicleIds = vehicles.map(v => v.id);

        const whereClause = {
            vehicle_id: vehicleIds
        };

        if (vehicle_id) whereClause.vehicle_id = vehicle_id; // Filter specific vehicle if requested (and allowed)
        if (type) whereClause.type = type;
        if (is_read !== undefined) whereClause.is_read = is_read === 'true';

        const alerts = await Alert.findAll({
            where: whereClause,
            order: [['timestamp', 'DESC']],
            include: [{ model: Vehicle, attributes: ['name', 'registration_number'] }]
        });

        res.json(alerts);
    } catch (error) {
        console.error('Get Alerts Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /unread - Get unread alerts count
router.get('/unread', authenticate, async (req, res) => {
    try {
        const organizations = await Organization.findAll({
            where: { owner_id: req.user.id },
            attributes: ['id']
        });
        const orgIds = organizations.map(org => org.id);

        const vehicles = await Vehicle.findAll({
            where: { organization_id: orgIds },
            attributes: ['id']
        });
        const vehicleIds = vehicles.map(v => v.id);

        const count = await Alert.count({
            where: {
                vehicle_id: vehicleIds,
                is_read: false
            }
        });

        res.json({ count });
    } catch (error) {
        console.error('Get Unread Count Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /:id - Get single alert
router.get('/:id', authenticate, async (req, res) => {
    try {
        const alert = await Alert.findByPk(req.params.id, {
            include: [{ model: Vehicle }]
        });

        if (!alert) return res.status(404).json({ error: 'Alert not found' });

        // Check access via vehicle -> organization -> owner
        const vehicle = await Vehicle.findByPk(alert.vehicle_id);
        const org = await Organization.findOne({
            where: { id: vehicle.organization_id, owner_id: req.user.id }
        });

        if (!org) return res.status(403).json({ error: 'Access denied' });

        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /:id/read - Mark alert as read
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const alert = await Alert.findByPk(req.params.id);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });

        // Check access
        const vehicle = await Vehicle.findByPk(alert.vehicle_id);
        const org = await Organization.findOne({
            where: { id: vehicle.organization_id, owner_id: req.user.id }
        });

        if (!org) return res.status(403).json({ error: 'Access denied' });

        await alert.update({ is_read: true });
        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /:id - Delete alert
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const alert = await Alert.findByPk(req.params.id);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });

        // Check access
        const vehicle = await Vehicle.findByPk(alert.vehicle_id);
        const org = await Organization.findOne({
            where: { id: vehicle.organization_id, owner_id: req.user.id }
        });

        if (!org) return res.status(403).json({ error: 'Access denied' });

        await alert.destroy();
        res.json({ message: 'Alert deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
