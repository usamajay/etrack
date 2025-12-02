const { Vehicle, Trip, Position, Alert, Organization, User, Device, sequelize } = require('./src/models');
const bcrypt = require('bcryptjs');

async function seedData() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Find ANY existing user to attach data to (likely the logged-in user)
        let user = await User.findOne();
        if (!user) {
            console.log('No users found. Creating a default user.');
            const hashedPassword = await bcrypt.hash('password123', 10);
            user = await User.create({
                email: 'admin@etrack.com',
                password_hash: hashedPassword,
                full_name: 'Admin User',
                role: 'admin'
            });
        }
        console.log(`Seeding data for user: ${user.email} (${user.id})`);

        let org = await Organization.findOne({ where: { owner_id: user.id } });
        if (!org) {
            org = await Organization.create({
                name: 'My Fleet',
                owner_id: user.id
            });
            console.log('Created organization for user.');
        }

        // 2. Create Device
        let device = await Device.findOne({ where: { imei: '123456789012345' } });
        if (!device) {
            device = await Device.create({
                imei: '123456789012345',
                device_model: 'GT06',
                sim_number: '1234567890',
                is_active: true
            });
            console.log('Created demo device.');
        }

        // 3. Create Vehicle
        let vehicle = await Vehicle.findOne({ where: { registration_number: 'DEMO-001' } });
        if (!vehicle) {
            vehicle = await Vehicle.create({
                organization_id: org.id,
                name: 'Delivery Truck 1',
                registration_number: 'DEMO-001',
                model: 'Volvo FH16',
                is_active: true,
                device_id: device.id
            });
            console.log('Created demo vehicle.');
        }

        // 4. Create Trips (Past 7 days)
        const tripsToCreate = 5;
        for (let i = 0; i < tripsToCreate; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const startTime = new Date(date);
            startTime.setHours(8, 0, 0);
            const endTime = new Date(date);
            endTime.setHours(10, 0, 0);

            const trip = await Trip.create({
                vehicle_id: vehicle.id,
                start_time: startTime,
                end_time: endTime,
                start_latitude: 51.505,
                start_longitude: -0.09,
                end_latitude: 51.625,
                end_longitude: 0.03,
                distance: 50 + Math.random() * 20,
                duration: 120,
                max_speed: 80 + Math.random() * 10,
                average_speed: 40 + Math.random() * 5
            });

            // Positions for this trip
            const positions = [];
            let lat = 51.505;
            let lon = -0.09;
            for (let j = 0; j <= 60; j++) {
                lat += 0.002;
                lon += 0.002;
                positions.push({
                    vehicle_id: vehicle.id,
                    trip_id: trip.id,
                    latitude: lat,
                    longitude: lon,
                    speed: 40 + Math.random() * 40, // Some speeding
                    heading: 45,
                    timestamp: new Date(startTime.getTime() + j * 120000) // 2 min intervals
                });
            }
            await Position.bulkCreate(positions);
            console.log(`Created trip ${trip.id} with positions.`);
        }

        // 5. Create Alerts
        const alertTypes = ['speeding', 'geofence', 'offline'];
        for (let i = 0; i < 10; i++) {
            const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
            const date = new Date();
            date.setHours(date.getHours() - i * 2);

            await Alert.create({
                vehicle_id: vehicle.id,
                type: type,
                severity: type === 'speeding' ? 'high' : type === 'geofence' ? 'medium' : 'low',
                message: `${type === 'speeding' ? 'Speed limit exceeded' : type === 'geofence' ? 'Exited safe zone' : 'Signal lost'}`,
                timestamp: date,
                is_read: i > 5, // Some read, some unread
                data: type === 'speeding' ? { speed: 95, limit: 80 } : type === 'geofence' ? { geofence_name: 'Warehouse Zone' } : {}
            });
        }
        console.log('Created dummy alerts.');

        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await sequelize.close();
    }
}

seedData();
