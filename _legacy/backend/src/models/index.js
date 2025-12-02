const { sequelize, Sequelize } = require('../config/database');

const User = require('./User');
const Organization = require('./Organization');
const Vehicle = require('./Vehicle');
const Device = require('./Device');
const Position = require('./Position');
const Trip = require('./Trip');
const Geofence = require('./Geofence');
const Alert = require('./Alert');
const Command = require('./Command');

// Relationships

// User <-> Organization
User.hasMany(Organization, { foreignKey: 'owner_id' });
Organization.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Organization <-> Vehicle
Organization.hasMany(Vehicle, { foreignKey: 'organization_id' });
Vehicle.belongsTo(Organization, { foreignKey: 'organization_id' });

// Organization <-> Geofence
Organization.hasMany(Geofence, { foreignKey: 'organization_id' });
Geofence.belongsTo(Organization, { foreignKey: 'organization_id' });

// Device <-> Vehicle
Device.hasOne(Vehicle, { foreignKey: 'device_id' });
Vehicle.belongsTo(Device, { foreignKey: 'device_id' });

// Device <-> Command
Device.hasMany(Command, { foreignKey: 'device_id' });
Command.belongsTo(Device, { foreignKey: 'device_id' });

// Vehicle <-> Position
Vehicle.hasMany(Position, { foreignKey: 'vehicle_id' });
Position.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

// Vehicle <-> Trip
Vehicle.hasMany(Trip, { foreignKey: 'vehicle_id' });
Trip.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

// Vehicle <-> Alert
Vehicle.hasMany(Alert, { foreignKey: 'vehicle_id' });
Alert.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

// Sync Database
const syncDatabase = async () => {
    if (process.env.NODE_ENV === 'development') {
        try {
            await sequelize.sync({ alter: true });
            console.log('✅ Database synced successfully (alter: true)');
        } catch (error) {
            console.error('❌ Error syncing database:', error);
        }
    }
};

// syncDatabase(); // Disabled to prevent startup crashes with SQLite

module.exports = {
    sequelize,
    Sequelize,
    User,
    Organization,
    Vehicle,
    Device,
    Position,
    Trip,
    Geofence,
    Alert,
    Command
};
