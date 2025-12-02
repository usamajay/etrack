const express = require('express');
const router = express.Router();
const tripService = require('../services/gps/tripService');
const { authenticate } = require('../middleware/auth');
const { Trip } = require('../models');

// GET / - Get all trips
router.get('/', authenticate, async (req, res) => {
    try {
        const { vehicle_id, start_date, end_date } = req.query;

        if (!vehicle_id) {
            return res.status(400).json({ error: 'vehicle_id is required' });
        }

        const trips = await tripService.getTripsByVehicle(vehicle_id, start_date, end_date);
        res.json(trips);
    } catch (error) {
        console.error('Get Trips Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /active/:vehicleId - Get active trip
router.get('/active/:vehicleId', authenticate, async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const trip = await tripService.getActiveTrip(vehicleId);

        if (!trip) {
            return res.status(404).json({ message: 'No active trip found' });
        }

        res.json(trip);
    } catch (error) {
        console.error('Get Active Trip Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /:id - Get single trip
router.get('/:id', authenticate, async (req, res) => {
    try {
        const trip = await Trip.findByPk(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        res.json(trip);
    } catch (error) {
        console.error('Get Trip Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /:id/stats - Get trip stats
router.get('/:id/stats', authenticate, async (req, res) => {
    try {
        const trip = await Trip.findByPk(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        // If stats are already in trip model, return them
        // Otherwise calculate them on the fly (though we usually save them on endTrip)
        res.json({
            distance: trip.distance,
            duration: trip.duration,
            max_speed: trip.max_speed,
            average_speed: trip.average_speed
        });
    } catch (error) {
        console.error('Get Trip Stats Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
