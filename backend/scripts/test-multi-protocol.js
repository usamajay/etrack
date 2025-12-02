const net = require('net');

const HOST = 'localhost';
const PORT = 5001;

function sendPacket(name, data) {
    const client = new net.Socket();

    client.connect(PORT, HOST, () => {
        console.log(`[${name}] Connected`);
        console.log(`[${name}] Sending: ${data.toString()}`);
        client.write(data);
    });

    client.on('data', (data) => {
        console.log(`[${name}] Received: ${data.toString()}`);
        client.destroy(); // Kill client after server's response
    });

    client.on('close', () => {
        console.log(`[${name}] Connection closed`);
    });

    client.on('error', (err) => {
        console.error(`[${name}] Error: ${err.message}`);
    });
}

// Simulate TK103 Packet
// (123456789012BP00) -> Handshake
const tk103Handshake = Buffer.from('(123456789012BP00)', 'ascii');
setTimeout(() => sendPacket('TK103', tk103Handshake), 1000);

// Simulate H02 Packet (ASCII)
// *HQ,123456789012345,V1,123456,A,3210.0000,N,12310.0000,E,0.00,0,010121,FFFFFFFF#
const h02Packet = Buffer.from('*HQ,123456789012345,V1,123456,A,3210.0000,N,12310.0000,E,0.00,0,010121,FFFFFFFF#', 'ascii');
setTimeout(() => sendPacket('H02', h02Packet), 2000);
