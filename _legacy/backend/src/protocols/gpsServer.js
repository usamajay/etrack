require('dotenv').config();
const net = require('net');
const { Device, Position, Alert } = require('../models');
const parser = require('./parsers/gt06Parser');
const positionService = require('../services/gps/positionService');
const alertService = require('../services/alerts/alertService');
const redisService = require('../services/cache/redisService'); // Use RedisService

const PORT = process.env.GPS_PORT || 5023;

const sessions = new Map(); // Map<IMEI, Socket>
const socketToImei = new Map(); // Map<Socket, IMEI>

const server = net.createServer((socket) => {
    console.log(`Device connected: ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on('data', async (data) => {
        try {
            const packet = parser.parse(data);
            if (!packet) return;

            switch (packet.type) {
                case 'login':
                    handleLogin(socket, packet);
                    break;
                case 'location':
                    await handleLocation(socket, packet);
                    break;
                case 'heartbeat':
                    handleHeartbeat(socket, packet);
                    break;
                case 'alarm':
                    await handleAlarm(socket, packet);
                    break;
            }
        } catch (error) {
            console.error('Error parsing data:', error);
        }
    });

    socket.on('close', () => {
        const imei = socketToImei.get(socket);
        if (imei) {
            console.log(`Device disconnected: ${imei}`);
            sessions.delete(imei);
            socketToImei.delete(socket);
        } else {
            console.log('Unknown device disconnected');
        }
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err.message);
    });
});

// Handle Login
function handleLogin(socket, packet) {
    const { imei, serialNumber } = packet;
    console.log(`Device login: ${imei}`);

    sessions.set(imei, socket);
    socketToImei.set(socket, imei);

    // Send response
    const response = parser.createResponse(serialNumber, 0x01);
    socket.write(response);
}

// Handle Location
async function handleLocation(socket, packet) {
    const imei = socketToImei.get(socket);
    if (!imei) return;

    const device = await Device.findOne({ where: { imei } });
    if (!device) {
        console.warn(`Location received for unknown device IMEI: ${imei}`);
        return;
    }

    // Save Position
    const positionData = {
        vehicle_id: null,
        latitude: packet.latitude,
        longitude: packet.longitude,
        speed: packet.speed,
        course: packet.course,
        satellites: packet.satellites,
        timestamp: packet.timestamp
    };

    const vehicle = await device.getVehicle();

    if (vehicle) {
        positionData.vehicle_id = vehicle.id;
        const position = await positionService.savePosition(positionData);

        await device.update({ last_connection: new Date() });

        await alertService.checkSpeedingAlert(vehicle, position, 100);
        await alertService.checkGeofenceAlert(vehicle, position);

        // Publish to Redis via RedisService
        await redisService.publish('position_updates', JSON.stringify({
            vehicleId: vehicle.id,
            position
        }));
    }
}

// Handle Heartbeat
function handleHeartbeat(socket, packet) {
    const { serialNumber } = packet;
    const response = parser.createResponse(serialNumber, 0x13);
    socket.write(response);
}

// Handle Alarm
async function handleAlarm(socket, packet) {
    const imei = socketToImei.get(socket);
    if (!imei) return;

    const { serialNumber, alarmCode } = packet;
    console.log(`Alarm from ${imei}: Code ${alarmCode}`);

    const response = parser.createResponse(serialNumber, 0x16);
    socket.write(response);
}

// Listen for Commands (Mock implementation for now as RedisService doesn't support subscribe yet in memory mode)
// In a real scenario, we'd need a separate Redis client for subscription or a robust IPC mechanism.
// For now, we'll skip the subscription part if using memory mode.

server.listen(PORT, () => {
    console.log(`GPS TCP Server running on port ${PORT}`);
});
