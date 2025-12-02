const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics/analyticsService');
const { authenticate } = require('../middleware/auth');
const { Organization } = require('../models');

// GET /organization - Get organization overview stats
router.get('/organization', authenticate, async (req, res) => {
    try {
        // Find user's organization (assuming single org for now)
        const org = await Organization.findOne({ where: { owner_id: req.user.id } });
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const stats = await analyticsService.getOrganizationStats(org.id);
        res.json(stats);
    } catch (error) {
        console.error('Org Stats Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /vehicle/:vehicleId - Get vehicle statistics
router.get('/vehicle/:vehicleId', authenticate, async (req, res) => {
    try {
        const { period } = req.query;
        const stats = await analyticsService.getVehicleStats(req.params.vehicleId, period);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /fleet - Get fleet-wide statistics
router.get('/fleet', authenticate, async (req, res) => {
    try {
        const org = await Organization.findOne({ where: { owner_id: req.user.id } });
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const { period } = req.query;
        const stats = await analyticsService.getFleetStats(org.id, period);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /driver/:vehicleId - Get driver behavior
router.get('/driver/:vehicleId', authenticate, async (req, res) => {
    try {
        const { period } = req.query;
        const stats = await analyticsService.getDriverBehavior(req.params.vehicleId, period);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /routes - Get popular routes
router.get('/routes', authenticate, async (req, res) => {
    try {
        const org = await Organization.findOne({ where: { owner_id: req.user.id } });
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const routes = await analyticsService.getPopularRoutes(org.id);
        res.json(routes);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /dashboard - Get all dashboard stats in one call
router.get('/dashboard', authenticate, async (req, res) => {
    try {
        const org = await Organization.findOne({ where: { owner_id: req.user.id } });
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const [orgStats, fleetStats, routes] = await Promise.all([
            analyticsService.getOrganizationStats(org.id),
            analyticsService.getFleetStats(org.id, 'week'),
            analyticsService.getPopularRoutes(org.id)
        ]);

        res.json({
            overview: orgStats,
            fleet_weekly: fleetStats,
            top_routes: routes
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
