const net = require('net');

// Simulate a device entering a geofence
// Make sure you have created a geofence in the UI first!

const client = new net.Socket();

client.connect(5001, 'localhost', () => {
    console.log('Connected to GPS Server');

    // GT06 Login Packet
    const loginPacket = Buffer.from('78780D01012345678901234500018C230D0A', 'hex');
    client.write(loginPacket);
    console.log('Sent login packet');

    setTimeout(() => {
        // GT06 Location Packet - Adjust these coordinates to be INSIDE your geofence!
        // Example: If your geofence is around London (51.5, -0.1), use coordinates like:
        // Latitude: 51.505 (N), Longitude: -0.09 (W)

        // This is a simplified GT06 location packet
        // You may need to adjust the coordinates in hex format
        const locationPacket = Buffer.from('787822120B081D112E10CC027AC7EB0C46584900148F01CC00287D001FB8000380810D0A', 'hex');
        client.write(locationPacket);
        console.log('Sent location packet (inside geofence)');

        setTimeout(() => {
            client.destroy();
            console.log('Connection closed');
        }, 2000);
    }, 1000);
});

client.on('data', (data) => {
    console.log('Received:', data.toString('hex'));
});

client.on('error', (err) => {
    console.error('Connection error:', err.message);
});
