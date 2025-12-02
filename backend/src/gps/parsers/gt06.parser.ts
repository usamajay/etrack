import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class Gt06Parser {
    private readonly logger = new Logger(Gt06Parser.name);

    parse(buffer: Buffer) {
        if (buffer[0] !== 0x78 || buffer[1] !== 0x78) {
            // throw new Error('Invalid start bytes');
            // Instead of throwing, maybe return null or log
            return null;
        }

        const length = buffer[2];
        const protocol = buffer[3];

        switch (protocol) {
            case 0x01: // Login
                return this.parseLogin(buffer);
            case 0x12: // Location
            case 0x22: // Location
                return this.parseLocation(buffer);
            case 0x13: // Heartbeat
                return this.parseHeartbeat(buffer);
            case 0x16: // Alarm
                return this.parseAlarm(buffer);
            default:
                this.logger.warn(`Unknown protocol: 0x${protocol.toString(16)}`);
                return null;
        }
    }

    private parseLogin(buffer: Buffer) {
        // Format: Start(2) + Length(1) + Protocol(1) + IMEI(8) + Serial(2) + Error(2) + Stop(2)
        const imeiBytes = buffer.slice(4, 12);
        let imei = '';
        for (let i = 0; i < 8; i++) {
            let b = imeiBytes[i].toString(16).padStart(2, '0');
            imei += b;
        }

        const serialNumber = buffer.readUInt16BE(12);

        return {
            type: 'login',
            imei: imei.substring(1), // Usually 15 digits
            serialNumber,
        };
    }

    private parseHeartbeat(buffer: Buffer) {
        const serialNumber = buffer.readUInt16BE(buffer.length - 6);
        return {
            type: 'heartbeat',
            serialNumber,
        };
    }

    private parseLocation(buffer: Buffer) {
        const year = buffer[4];
        const month = buffer[5];
        const day = buffer[6];
        const hour = buffer[7];
        const minute = buffer[8];
        const second = buffer[9];

        const timestamp = new Date(Date.UTC(2000 + year, month - 1, day, hour, minute, second));

        const satellites = buffer[10] & 0x0f;

        const rawLat = buffer.readUInt32BE(11);
        const rawLon = buffer.readUInt32BE(15);

        // GT06: (Degrees * 60 + Minutes) * 30000
        const latitude = rawLat / 30000.0 / 60.0;
        const longitude = rawLon / 30000.0 / 60.0;

        const speed = buffer[19]; // usually km/h

        const rawCourse = buffer.readUInt16BE(20);
        const course = rawCourse & 0x03ff; // 10 bits for course

        const serialNumber = buffer.readUInt16BE(buffer.length - 6);

        return {
            type: 'location',
            latitude,
            longitude,
            speed,
            course,
            satellites,
            timestamp,
            serialNumber,
        };
    }

    private parseAlarm(buffer: Buffer) {
        const serialNumber = buffer.readUInt16BE(buffer.length - 6);
        const alarmType = buffer[4];

        return {
            type: 'alarm',
            alarmCode: alarmType,
            serialNumber,
        };
    }

    createResponse(serialNumber: number, type: number): Buffer {
        const buffer = Buffer.alloc(10);
        buffer.writeUInt16BE(0x7878, 0); // Start
        buffer.writeUInt8(0x05, 2); // Length
        buffer.writeUInt8(type, 3); // Protocol
        buffer.writeUInt16BE(serialNumber, 4); // Serial
        buffer.writeUInt16BE(0x0000, 6); // Error Check (Dummy CRC)
        buffer.writeUInt16BE(0x0d0a, 8); // Stop
        return buffer;
    }
}
