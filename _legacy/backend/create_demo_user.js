const { Vehicle, Trip, Position, Alert, Organization, User, Device, sequelize } = require('./src/models');
const bcrypt = require('bcryptjs');

async function createDemoUser() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Create/Update Demo User
        const email = 'demo@etrack.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        let user = await User.findOne({ where: { email } });
        if (!user) {
            user = await User.create({
                email,
                password_hash: hashedPassword,
                full_name: 'Demo User',
                role: 'admin'
            });
            console.log(`Created user: ${email}`);
        } else {
            await user.update({ password_hash: hashedPassword });
            console.log(`Updated password for user: ${email}`);
        }

        // 2. Create Organization
        let org = await Organization.findOne({ where: { owner_id: user.id } });
        if (!org) {
            org = await Organization.create({
                name: 'Demo Fleet',
                owner_id: user.id
            });
            console.log('Created demo organization.');
        }

        // 3. Create Device
        let device = await Device.findOne({ where: { imei: '999999999999999' } });
        if (!device) {
            device = await Device.create({
                imei: '999999999999999',
                device_model: 'DemoTracker',
                sim_number: '0000000000',
                is_active: true
            });
            console.log('Created demo device.');
        }

        // 4. Create Vehicle
        let vehicle = await Vehicle.findOne({ where: { registration_number: 'DEMO-TRUCK' } });
        if (!vehicle) {
            vehicle = await Vehicle.create({
                organization_id: org.id,
                name: 'Demo Truck',
                registration_number: 'DEMO-TRUCK',
                model: 'Generic Truck',
                is_active: true,
                device_id: device.id
            });
            console.log('Created demo vehicle.');
        } else {
            // Ensure it belongs to the demo org
            await vehicle.update({ organization_id: org.id, device_id: device.id });
        }

        // 5. Create Trips (Past 5 days)
        console.log('Seeding trips...');
        for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const startTime = new Date(date);
            startTime.setHours(9, 0, 0);
            const endTime = new Date(date);
            endTime.setHours(11, 0, 0);

            // Check if trip already exists to avoid duplicates on re-run
            const existingTrip = await Trip.findOne({
                where: {
                    vehicle_id: vehicle.id,
                    start_time: startTime
                }
            });

            if (!existingTrip) {
                const trip = await Trip.create({
                    vehicle_id: vehicle.id,
                    start_time: startTime,
                    end_time: endTime,
                    start_latitude: 40.7128,
                    start_longitude: -74.0060,
                    end_latitude: 40.7306,
                    end_longitude: -73.9352,
                    distance: 15.5,
                    duration: 120,
                    max_speed: 85,
                    average_speed: 45
                });

                // Positions
                const positions = [];
                let lat = 40.7128;
                let lon = -74.0060;
                for (let j = 0; j <= 20; j++) {
                    lat += 0.001;
                    lon += 0.001;
                    positions.push({
                        vehicle_id: vehicle.id,
                        trip_id: trip.id,
                        latitude: lat,
                        longitude: lon,
                        speed: 40 + Math.random() * 20,
                        heading: 45,
                        timestamp: new Date(startTime.getTime() + j * 60000)
                    });
                }
                await Position.bulkCreate(positions);
            }
        }

        // 6. Create Alerts
        console.log('Seeding alerts...');
        const alertTypes = ['speeding', 'geofence', 'offline'];
        for (let i = 0; i < 5; i++) {
            const type = alertTypes[i % 3];
            await Alert.create({
                vehicle_id: vehicle.id,
                type: type,
                severity: type === 'speeding' ? 'high' : 'medium',
                message: `Demo ${type} alert`,
                timestamp: new Date(),
                is_read: false,
                data: {}
            });
        }

        console.log('----------------------------------------');
        console.log('DEMO ACCOUNT READY');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('----------------------------------------');

    } catch (error) {
        console.error('Demo setup failed:', error);
    } finally {
        await sequelize.close();
    }
}

createDemoUser();
