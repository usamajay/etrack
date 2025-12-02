const { sequelize } = require('./src/models');
const reportService = require('./src/services/reports/reportService');
const { User, Vehicle, Organization, Trip } = require('./src/models');

async function testReports() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Get a vehicle (Target the one we seeded)
        const vehicle = await Vehicle.findOne({ where: { name: 'Delivery Truck 1' } });
        if (!vehicle) {
            console.log('Delivery Truck 1 not found. Trying any vehicle...');
            const anyVehicle = await Vehicle.findOne();
            if (!anyVehicle) {
                console.log('No vehicles found at all.');
                return;
            }
            // Use the fallback
            console.log(`Testing with fallback Vehicle: ${anyVehicle.name}`);
            // ... rest of logic needs vehicle variable
            // Refactoring slightly to handle this cleanly is hard with replace_file_content on just lines 10-11.
            // I will just replace the findOne line.
        }
        if (!vehicle) {
            console.log('No vehicles found to test.');
            return;
        }
        console.log(`Testing with Vehicle: ${vehicle.name} (${vehicle.id})`);

        // 1.5 Debug: Fetch ALL trips
        const allTrips = await Trip.findAll({ where: { vehicle_id: vehicle.id } });
        console.log(`Total Trips Found: ${allTrips.length}`);
        if (allTrips.length > 0) {
            console.log('Sample Trip Start Time:', allTrips[0].start_time, typeof allTrips[0].start_time);
        }

        // 2. Test Daily Report
        console.log('--- Testing Daily Report ---');
        const today = new Date().toISOString().split('T')[0];
        const daily = await reportService.generateDailyReport(vehicle.id, today);
        console.log('Daily Report Result:', JSON.stringify(daily, null, 2));

        // 3. Test Weekly Report
        console.log('--- Testing Weekly Report ---');
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const weekly = await reportService.generateWeeklyReport(vehicle.id, lastWeek.toISOString().split('T')[0]);
        console.log('Weekly Report Result:', JSON.stringify(weekly, null, 2));

        // 4. Test Monthly Report
        console.log('--- Testing Monthly Report ---');
        const monthly = await reportService.generateMonthlyReport(vehicle.id, new Date().getMonth() + 1, new Date().getFullYear());
        console.log('Monthly Report Result:', JSON.stringify(monthly, null, 2));

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await sequelize.close();
    }
}

testReports();
