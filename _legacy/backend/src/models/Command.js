const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Command = sequelize.define('Command', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    device_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'devices',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('locate', 'lock', 'unlock', 'restart'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'sent', 'acknowledged', 'failed'),
        defaultValue: 'pending'
    },
    sent_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    acknowledged_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    response: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'commands',
    underscored: true,
    timestamps: true
});

module.exports = Command;
