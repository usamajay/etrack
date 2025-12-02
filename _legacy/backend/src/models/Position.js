const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Position = sequelize.define('Position', {
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
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false
    },
    speed: {
        type: DataTypes.DECIMAL,
        defaultValue: 0
    },
    course: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    altitude: {
        type: DataTypes.DECIMAL,
        allowNull: true
    },
    satellites: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'positions',
    underscored: true,
    timestamps: true,
    updatedAt: false, // Position data is usually immutable
    indexes: [
        {
            fields: ['vehicle_id']
        },
        {
            fields: ['timestamp']
        }
    ]
});

module.exports = Position;
