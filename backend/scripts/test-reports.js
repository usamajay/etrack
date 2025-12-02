// Test script for reports API
// Run with: node scripts/test-reports.js

const axios = require('axios');

async function testReports() {
    try {
        // Login
        console.log('📝 Logging in...');
        const loginResponse = await axios.post('http://localhost:3001/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });

        const token = loginResponse.data.access_token;
        console.log('✅ Logged in successfully\n');

        // Get device
        const devicesResponse = await axios.get('http://localhost:3001/devices', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (devicesResponse.data.length === 0) {
            console.log('❌ No devices found!');
            return;
        }

        const device = devicesResponse.data[0];
        console.log(`📱 Testing reports for device: ${device.name} (ID: ${device.id})\n`);

        // Date range (last 7 days)
        const endDate = new Date();
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const headers = { Authorization: `Bearer ${token}` };
        const params = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };

        // Test Trip History
        console.log('🚗 Fetching Trip History...');
        const tripsResponse = await axios.get(
            `http://localhost:3001/reports/trips/${device.id}`,
            { headers, params }
        );
        console.log(`   Found ${tripsResponse.data.length} trips`);
        if (tripsResponse.data.length > 0) {
            const trip = tripsResponse.data[0];
            console.log(`   First trip: ${trip.distance.toFixed(2)} km, ${trip.duration} min\n`);
        } else {
            console.log('   No trips found in this period\n');
        }

        // Test Distance Report
        console.log('📏 Fetching Distance Report...');
        const distanceResponse = await axios.get(
            `http://localhost:3001/reports/distance/${device.id}`,
            { headers, params }
        );
        console.log(`   Total distance: ${distanceResponse.data.totalDistance} km`);
        console.log(`   Daily breakdown: ${distanceResponse.data.dailyBreakdown.length} days\n`);

        // Test Speed Report
        console.log('🚦 Fetching Speed Report...');
        const speedResponse = await axios.get(
            `http://localhost:3001/reports/speed/${device.id}`,
            { headers, params: { ...params, speedLimit: 100 } }
        );
        console.log(`   Max speed: ${speedResponse.data.maxSpeed} km/h`);
        console.log(`   Avg speed: ${speedResponse.data.avgSpeed} km/h`);
        console.log(`   Overspeed violations: ${speedResponse.data.overspeedViolations.length}\n`);

        // Test Geofence Activity
        console.log('📍 Fetching Geofence Activity...');
        const geofenceResponse = await axios.get(
            `http://localhost:3001/reports/geofence-activity/${device.id}`,
            { headers, params }
        );
        console.log(`   Total entries: ${geofenceResponse.data.summary.totalEntries}`);
        console.log(`   Total exits: ${geofenceResponse.data.summary.totalExits}\n`);

        // Test Summary
        console.log('📊 Fetching Device Summary...');
        const summaryResponse = await axios.get(
            `http://localhost:3001/reports/summary/${device.id}`,
            { headers, params }
        );
        console.log('   Summary:');
        console.log(`     Trips: ${summaryResponse.data.trips.total}`);
        console.log(`     Distance: ${summaryResponse.data.trips.totalDistance} km`);
        console.log(`     Max Speed: ${summaryResponse.data.speed.max} km/h`);
        console.log(`     Speed Violations: ${summaryResponse.data.speed.violations}`);
        console.log(`     Geofence Entries: ${summaryResponse.data.geofences.totalEntries}\n`);

        console.log('✅ All reports fetched successfully!');

    } catch (error) {
        if (error.response) {
            console.error('❌ Error:', error.response.data.message || error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testReports();
