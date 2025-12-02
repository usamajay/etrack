const express = require('express');
const router = express.Router();
const { Device, Vehicle, Organization } = require('../models');
const { authenticate } = require('../middleware/auth');

// GET / - Get all devices for organization
router.get('/', authenticate, async (req, res) => {
    try {
        // Get user's organizations
        const organizations = await Organization.findAll({
            where: { owner_id: req.user.id },
            attributes: ['id']
        });
        const orgIds = organizations.map(org => org.id);

        // Find vehicles in these orgs, then find devices attached? 
        // Or just find devices that might be linked to these vehicles?
        // Actually, devices might not be linked to vehicles yet.
        // We need a way to link devices to organizations directly or via vehicles.
        // The schema: Vehicle -> Device. Device doesn't have organization_id directly.
        // So we can only list devices currently assigned to vehicles in user's orgs.
        // OR we should have added organization_id to Device. 
        // For now, let's return devices linked to user's vehicles.

        const vehicles = await Vehicle.findAll({
            where: { organization_id: orgIds },
            include: [{ model: Device }]
        });

        const devices = vehicles.map(v => v.Device).filter(d => d !== null);

        // Also need to handle unassigned devices? 
        // If the user registered them but hasn't assigned them.
        // Without org_id on Device, we can't find unassigned devices belonging to a user easily unless we have another table.
        // Assuming for this MVP, devices are accessed via vehicles.

        res.json(devices);
    } catch (error) {
        console.error('Get Devices Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /:id - Get single device
router.get('/:id', authenticate, async (req, res) => {
    try {
        const device = await Device.findByPk(req.params.id);
        if (!device) return res.status(404).json({ error: 'Device not found' });
        res.json(device);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST / - Register new device
router.post('/', authenticate, async (req, res) => {
    try {
        const { imei, device_model, sim_number } = req.body;

        // Check if IMEI exists
        const existing = await Device.findOne({ where: { imei } });
        if (existing) return res.status(400).json({ error: 'Device with this IMEI already exists' });

        const device = await Device.create({
            imei,
            device_model,
            sim_number
        });
        res.status(201).json(device);
    } catch (error) {
        console.error('Create Device Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /:id - Update device
router.put('/:id', authenticate, async (req, res) => {
    try {
        const device = await Device.findByPk(req.params.id);
        if (!device) return res.status(404).json({ error: 'Device not found' });

        await device.update(req.body);
        res.json(device);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /:id - Remove device
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const device = await Device.findByPk(req.params.id);
        if (!device) return res.status(404).json({ error: 'Device not found' });

        await device.destroy();
        res.json({ message: 'Device deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /:id/status - Get status
router.get('/:id/status', authenticate, async (req, res) => {
    try {
        const device = await Device.findByPk(req.params.id);
        if (!device) return res.status(404).json({ error: 'Device not found' });

        const isOnline = device.last_connection && (new Date() - new Date(device.last_connection) < 5 * 60 * 1000); // 5 mins threshold
        res.json({
            online: isOnline,
            last_seen: device.last_connection
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
