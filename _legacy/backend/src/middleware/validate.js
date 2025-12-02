const Joi = require('joi');

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({ error: errorMessage });
        }
        next();
    };
};

const schemas = {
    register: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        full_name: Joi.string().required(),
        phone: Joi.string().optional().allow(''),
        role: Joi.string().valid('user', 'admin').optional()
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    vehicle: Joi.object({
        name: Joi.string().required(),
        registration_number: Joi.string().required(),
        model: Joi.string().optional().allow(''),
        color: Joi.string().optional().allow(''),
        device_id: Joi.string().uuid().optional().allow(null),
        organization_id: Joi.string().uuid().optional() // Usually set by auth middleware, but if passed in body
    }),

    device: Joi.object({
        imei: Joi.string().length(15).pattern(/^[0-9]+$/).required(),
        device_model: Joi.string().required(),
        sim_number: Joi.string().optional().allow('')
    }),

    geofence: Joi.object({
        name: Joi.string().required(),
        type: Joi.string().valid('circle', 'polygon').required(),
        center_latitude: Joi.number().when('type', { is: 'circle', then: Joi.required(), otherwise: Joi.optional() }),
        center_longitude: Joi.number().when('type', { is: 'circle', then: Joi.required(), otherwise: Joi.optional() }),
        radius: Joi.number().when('type', { is: 'circle', then: Joi.required(), otherwise: Joi.optional() }),
        coordinates: Joi.array().items(
            Joi.object({
                latitude: Joi.number().required(),
                longitude: Joi.number().required()
            })
        ).when('type', { is: 'polygon', then: Joi.required(), otherwise: Joi.optional() })
    }),

    command: Joi.object({
        device_id: Joi.string().uuid().required(),
        type: Joi.string().valid('locate', 'lock', 'unlock', 'restart', 'set_interval').required()
    })
};

module.exports = {
    validate,
    schemas
};
