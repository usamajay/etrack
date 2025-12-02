const rateLimit = require('express-rate-limit');

// Login Rate Limit: 5 attempts per 15 minutes per IP
const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: { error: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// General API Rate Limit: 100 requests per 15 minutes per user (or IP if not auth)
const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later' },
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user ? req.user.id : req.ip;
    }
});

// Command Rate Limit: 10 commands per minute per device
// Note: This is tricky because we need deviceId from body or params.
// express-rate-limit keyGenerator can handle this.
const commandRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: { error: 'Too many commands sent to this device, please wait' },
    keyGenerator: (req) => {
        // Try to find deviceId in params or body
        const deviceId = req.params.deviceId || req.body.deviceId || req.body.device_id;
        return deviceId ? `command_${deviceId}` : req.ip;
    }
});

module.exports = {
    loginRateLimit,
    apiRateLimit,
    commandRateLimit
};
