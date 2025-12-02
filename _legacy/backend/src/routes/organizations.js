const express = require('express');
const router = express.Router();
const { Organization } = require('../models');
const { authenticate } = require('../middleware/auth');
const fileService = require('../services/upload/fileService');

// GET / - Get user's organization details
router.get('/', authenticate, async (req, res) => {
    try {
        const org = await Organization.findOne({ where: { owner_id: req.user.id } });
        if (!org) return res.status(404).json({ error: 'Organization not found' });
        res.json(org);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT / - Update organization
router.put('/', authenticate, async (req, res) => {
    try {
        const org = await Organization.findOne({ where: { owner_id: req.user.id } });
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const { name, address, phone } = req.body;
        if (name) org.name = name;
        if (address) org.address = address;
        if (phone) org.phone = phone;

        await org.save();
        res.json(org);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /settings - Get settings
router.get('/settings', authenticate, async (req, res) => {
    try {
        const org = await Organization.findOne({ where: { owner_id: req.user.id } });
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        // Return settings from JSON field, or defaults
        const settings = org.settings || {
            speed_limit: 100,
            timezone: 'UTC',
            units: 'km'
        };
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /settings - Update settings
router.put('/settings', authenticate, async (req, res) => {
    try {
        const org = await Organization.findOne({ where: { owner_id: req.user.id } });
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const { speed_limit, timezone, units } = req.body;

        const currentSettings = org.settings || {};
        const newSettings = {
            ...currentSettings,
            ...(speed_limit !== undefined && { speed_limit }),
            ...(timezone !== undefined && { timezone }),
            ...(units !== undefined && { units })
        };

        org.settings = newSettings;
        await org.save();

        res.json(org.settings);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /stats - Get organization statistics
// Redirect to analytics service
router.get('/stats', authenticate, async (req, res) => {
    // We could use analyticsService here, or redirect client to /api/analytics/organization
    // Let's just redirect internally or call the service if we had access.
    // Since we are in routes, better to keep it clean.
    res.redirect('/api/analytics/organization');
});

// POST /logo - Upload logo
router.post('/logo', authenticate, fileService.getMiddleware('logo'), async (req, res) => {
    try {
        const org = await Organization.findOne({ where: { owner_id: req.user.id } });
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        // We reuse uploadVehicleImage logic or create a new one for logos.
        // Let's assume fileService has a generic method or we use uploadUserAvatar as it resizes to small square.
        // Or better, add uploadLogo to fileService. For now, use uploadUserAvatar (200x200) is fine for logo.
        const logoPath = await fileService.uploadUserAvatar(req.file);

        org.logo_url = logoPath;
        await org.save();

        res.json({ logo_url: logoPath });
    } catch (error) {
        console.error('Logo Upload Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
