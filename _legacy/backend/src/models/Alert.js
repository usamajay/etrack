const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Alert = sequelize.define('Alert', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    vehicle_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'vehicles',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('speeding', 'geofence', 'offline'),
        allowNull: false
    },
    severity: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    data: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'alerts',
    underscored: true,
    timestamps: true,
    indexes: [
        {
            fields: ['vehicle_id']
        },
        {
            fields: ['timestamp']
        }
    ]
});

module.exports = Alert;
