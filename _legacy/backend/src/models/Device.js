const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Device = sequelize.define('Device', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    imei: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
        validate: {
            len: [15, 15]
        }
    },
    device_model: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sim_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    last_connection: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'devices',
    underscored: true,
    timestamps: true
});

module.exports = Device;
