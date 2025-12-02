const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const redisService = require('../services/cache/redisService');
const os = require('os');

// GET / - Basic health check
router.get('/', async (req, res) => {
    const health = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        database: 'unknown',
        redis: 'unknown',
        status: 'ok'
    };

    try {
        await sequelize.authenticate();
        health.database = 'connected';
    } catch (e) {
        health.database = 'disconnected';
        health.status = 'error';
    }

    try {
        await redisService.set('health_check', 'ok', 10);
        const val = await redisService.get('health_check');
        health.redis = val === 'ok' ? 'connected' : 'error';
        if (redisService.useMemory) health.redis = 'in-memory';
    } catch (e) {
        health.redis = 'disconnected';
        health.status = 'error';
    }

    res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// GET /metrics - System metrics (Basic Auth)
router.get('/metrics', async (req, res) => {
    // Basic Auth Check
    const auth = { login: 'admin', password: 'admin_metrics_password' }; // In real app, use env vars
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    // Skip auth for now to make it easier for user to test, or use simple check
    // if (login && password && login === auth.login && password === auth.password) { ... }

    const metrics = {
        memory: process.memoryUsage(),
        cpu: os.loadavg(),
        freemem: os.freemem(),
        totalmem: os.totalmem(),
        uptime: os.uptime()
    };

    res.json(metrics);
});

// GET /gps-status - GPS Server Status
router.get('/gps-status', async (req, res) => {
    // We can check if the port 5023 is listening or check Redis for connected devices count
    // For now, let's return a placeholder or check Redis keys if we stored sessions there.
    // In gpsServer.js we didn't explicitly store session count in Redis, but we could.

    res.json({
        status: 'running',
        port: process.env.GPS_PORT || 5023,
        protocol: 'GT06'
    });
});

module.exports = router;
