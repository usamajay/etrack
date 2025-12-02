const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Geofence = sequelize.define('Geofence', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    organization_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'organizations',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('circle', 'polygon'),
        allowNull: false
    },
    center_latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        comment: 'Required for circle type'
    },
    center_longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        comment: 'Required for circle type'
    },
    radius: {
        type: DataTypes.DECIMAL,
        allowNull: true,
        comment: 'Radius in meters, required for circle type'
    },
    coordinates: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Required for polygon type'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    alert_on_entry: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    alert_on_exit: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    assigned_vehicles: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
}, {
    tableName: 'geofences',
    underscored: true,
    timestamps: true
});

module.exports = Geofence;
