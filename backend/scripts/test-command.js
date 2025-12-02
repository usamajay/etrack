// Test script to send commands to GPS devices
// Run with: node scripts/test-command.js

const axios = require('axios');

async function testCommand() {
    try {
        // First, login to get JWT token
        console.log('📝 Logging in...');
        const loginResponse = await axios.post('http://localhost:3001/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });

        const token = loginResponse.data.access_token;
        console.log('✅ Logged in successfully\n');

        // Get device ID
        console.log('📋 Fetching devices...');
        const devicesResponse = await axios.get('http://localhost:3001/devices', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (devicesResponse.data.length === 0) {
            console.log('❌ No devices found! Please add a device first.');
            return;
        }

        const device = devicesResponse.data[0];
        console.log(`✅ Found device: ${device.name} (ID: ${device.id})\n`);

        // Send command
        console.log('🚀 Sending REQUEST_LOCATION command...');
        const commandResponse = await axios.post(
            `http://localhost:3001/commands/device/${device.id}`,
            {
                type: 'request_location'
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Command sent successfully!\n');
        console.log('Command Details:');
        console.log('  ID:', commandResponse.data.id);
        console.log('  Type:', commandResponse.data.type);
        console.log('  Status:', commandResponse.data.status);
        console.log('  Created:', commandResponse.data.created_at);

        // Check command status
        console.log('\n⏳ Checking command status...');
        setTimeout(async () => {
            try {
                const statusResponse = await axios.get(
                    `http://localhost:3001/commands/${commandResponse.data.id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                console.log('\n📊 Command Status:');
                console.log('  Status:', statusResponse.data.status);
                if (statusResponse.data.sent_at) {
                    console.log('  Sent at:', statusResponse.data.sent_at);
                }
                if (statusResponse.data.error_message) {
                    console.log('  Error:', statusResponse.data.error_message);
                }
            } catch (error) {
                console.error('Error checking status:', error.message);
            }
        }, 2000);

    } catch (error) {
        if (error.response) {
            console.error('❌ Error:', error.response.data.message || error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// Run the test
testCommand();
