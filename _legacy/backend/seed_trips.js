const { Vehicle, Trip, Position, sequelize } = require('./src/models');

async function seedTrips() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Find a vehicle
        const vehicle = await Vehicle.findOne();
        if (!vehicle) {
            console.log('No vehicle found. Please create a vehicle first.');
            return;
        }

        console.log(`Seeding trips for vehicle: ${vehicle.name} (${vehicle.id})`);

        // Create a trip
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - 2);
        const endTime = new Date();
        endTime.setHours(endTime.getHours() - 1);

        const trip = await Trip.create({
            vehicle_id: vehicle.id,
            start_time: startTime,
            end_time: endTime,
            status: 'completed',
            distance: 15.5,
            duration: 60,
            max_speed: 85,
            average_speed: 45,
            start_location: 'London, UK',
            end_location: 'Watford, UK'
        });

        console.log(`Created trip: ${trip.id}`);

        // Create positions for the trip
        const positions = [];
        let lat = 51.505;
        let lon = -0.09;

        for (let i = 0; i <= 60; i++) {
            lat += 0.001;
            lon += 0.001;
            positions.push({
                vehicle_id: vehicle.id,
                trip_id: trip.id,
                latitude: lat,
                longitude: lon,
                speed: 40 + Math.random() * 20,
                heading: 45,
                timestamp: new Date(startTime.getTime() + i * 60000)
            });
        }

        await Position.bulkCreate(positions);
        console.log(`Created ${positions.length} positions for the trip.`);

        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await sequelize.close();
    }
}

seedTrips();
