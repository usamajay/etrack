const express = require('express');
const router = express.Router();
const reportService = require('../services/reports/reportService');
const { authenticate } = require('../middleware/auth');

// GET /daily/:vehicleId - Daily report
router.get('/daily/:vehicleId', authenticate, async (req, res) => {
    try {
        console.log('GET /daily/:vehicleId request received', req.params, req.query);
        const { vehicleId } = req.params;
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'Date is required' });

        const report = await reportService.generateDailyReport(vehicleId, date);
        res.json(report);
    } catch (error) {
        console.error('Daily Report Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /weekly/:vehicleId - Weekly report
router.get('/weekly/:vehicleId', authenticate, async (req, res) => {
    try {
        console.log('GET /weekly/:vehicleId request received', req.params, req.query);
        const { vehicleId } = req.params;
        const { start_date } = req.query;
        if (!start_date) return res.status(400).json({ error: 'Start date is required' });

        const report = await reportService.generateWeeklyReport(vehicleId, start_date);
        res.json(report);
    } catch (error) {
        console.error('Weekly Report Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /monthly/:vehicleId - Monthly report
router.get('/monthly/:vehicleId', authenticate, async (req, res) => {
    try {
        console.log('GET /monthly/:vehicleId request received', req.params, req.query);
        const { vehicleId } = req.params;
        const { month, year } = req.query;
        if (!month || !year) return res.status(400).json({ error: 'Month and Year are required' });

        const report = await reportService.generateMonthlyReport(vehicleId, month, year);
        res.json(report);
    } catch (error) {
        console.error('Monthly Report Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /speed - Speed violations report
router.get('/speed', authenticate, async (req, res) => {
    try {
        const { vehicle_id, start_date, end_date } = req.query;
        if (!vehicle_id || !start_date || !end_date) return res.status(400).json({ error: 'Missing parameters' });

        const report = await reportService.generateSpeedReport(vehicle_id, start_date, end_date);
        res.json(report);
    } catch (error) {
        console.error('Speed Report Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Placeholder for other reports not explicitly in ReportService yet but requested in route
// GET /distance
router.get('/distance', authenticate, async (req, res) => {
    // Reusing daily/weekly logic or implementing specific distance range logic
    // For now, just return 501 Not Implemented or basic info
    res.status(501).json({ message: 'Distance report custom range not yet implemented in service' });
});

// GET /geofence
router.get('/geofence', authenticate, async (req, res) => {
    res.status(501).json({ message: 'Geofence report not yet implemented in service' });
});

// GET /export/:type
router.get('/export/:type', authenticate, async (req, res) => {
    res.status(501).json({ message: 'Export functionality not yet implemented' });
});

module.exports = router;
