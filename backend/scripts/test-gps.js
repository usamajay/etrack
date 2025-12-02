const net = require('net');

const client = new net.Socket();
const port = 5001;
const host = 'localhost';

// GT06 Login Packet
// 78 78 0D 01 01 23 45 67 89 AB CD EF 00 01 DC BA 0D 0A
const buffer = Buffer.from([
    0x78, 0x78, // Start
    0x0D,       // Length
    0x01,       // Protocol (Login)
    0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF, // IMEI (0123456789ABCDEF)
    0x00, 0x01, // Serial
    0xDC, 0xBA, // Error (Dummy)
    0x0D, 0x0A  // Stop
]);

client.connect(port, host, function () {
    console.log('Connected to GPS Server');
    client.write(buffer);
});

client.on('data', function (data) {
    console.log('Received response:', data.toString('hex'));
    client.destroy(); // kill client after server's response
});

client.on('close', function () {
    console.log('Connection closed');
});

client.on('error', function (err) {
    console.error('Connection error:', err.message);
});
