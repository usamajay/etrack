const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Trip = sequelize.define('Trip', {
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
    start_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    start_latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false
    },
    start_longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false
    },
    end_latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
    },
    end_longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
    },
    distance: {
        type: DataTypes.DECIMAL,
        defaultValue: 0
    },
    max_speed: {
        type: DataTypes.DECIMAL,
        defaultValue: 0
    },
    average_speed: {
        type: DataTypes.DECIMAL,
        defaultValue: 0
    },
    duration: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Duration in seconds'
    }
}, {
    tableName: 'trips',
    underscored: true,
    timestamps: true
});

module.exports = Trip;
