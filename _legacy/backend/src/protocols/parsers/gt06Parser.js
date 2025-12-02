class GT06Parser {

    parse(buffer) {
        if (buffer[0] !== 0x78 || buffer[1] !== 0x78) {
            throw new Error('Invalid start bytes');
        }

        const length = buffer[2];
        const protocol = buffer[3];

        // Basic validation of length (simplified)
        // if (buffer.length < length + 5) throw new Error('Buffer too short');

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
                console.warn(`Unknown protocol: 0x${protocol.toString(16)}`);
                return null;
        }
    }

    parseLogin(buffer) {
        // Format: Start(2) + Length(1) + Protocol(1) + IMEI(8) + Serial(2) + Error(2) + Stop(2)
        const imeiBytes = buffer.slice(4, 12);
        let imei = '';
        for (let i = 0; i < 8; i++) {
            let b = imeiBytes[i].toString(16).padStart(2, '0');
            // GT06 IMEI encoding is a bit specific, usually just BCD or direct hex string. 
            // Often the first digit is ignored if it's 0x0.
            // For standard GT06, it's often just the hex representation.
            imei += b;
        }
        // Remove leading char if it's an extra nibble, but usually 15 digits.
        // Let's assume standard hex string for now.

        const serialNumber = buffer.readUInt16BE(12);

        return {
            type: 'login',
            imei: imei.substring(1), // Usually 15 digits, so skip first nibble if 16 chars
            serialNumber
        };
    }

    parseHeartbeat(buffer) {
        // Format: Start(2) + Length(1) + Protocol(1) + Info(1) + Voltage(2) + GSM(1) + Serial(2) + ...
        const serialNumber = buffer.readUInt16BE(buffer.length - 6); // Serial is usually near end before Checksum/Stop

        return {
            type: 'heartbeat',
            serialNumber
        };
    }

    parseLocation(buffer) {
        // Simplified parsing logic for GT06 Location Packet
        // This is complex in reality due to bit manipulation for lat/lon/flags

        // Example offsets (Standard GT06):
        // Date/Time: 6 bytes (Year, Month, Day, Hour, Min, Sec)
        // Satellites: 1 byte (first nibble length, second nibble sats)
        // Lat: 4 bytes
        // Lon: 4 bytes
        // Speed: 1 byte
        // Course: 2 bytes (status + course)

        const year = buffer[4];
        const month = buffer[5];
        const day = buffer[6];
        const hour = buffer[7];
        const minute = buffer[8];
        const second = buffer[9];

        const timestamp = new Date(Date.UTC(2000 + year, month - 1, day, hour, minute, second));

        // Satellites info at index 10
        const satellites = buffer[10] & 0x0F;

        // Lat/Lon are 4 bytes each, usually in 1/30000 minutes or similar specific encoding
        // For this mock, let's assume standard 32-bit integer / 1800000.0 * 100 or similar.
        // GT06: (Degrees * 60 + Minutes) * 30000

        const rawLat = buffer.readUInt32BE(11);
        const rawLon = buffer.readUInt32BE(15);

        const latitude = (rawLat / 30000.0) / 60.0;
        const longitude = (rawLon / 30000.0) / 60.0;

        const speed = buffer[19]; // usually km/h

        const rawCourse = buffer.readUInt16BE(20);
        const course = rawCourse & 0x03FF; // 10 bits for course

        const serialNumber = buffer.readUInt16BE(buffer.length - 6);

        return {
            type: 'location',
            latitude,
            longitude,
            speed,
            course,
            satellites,
            timestamp,
            serialNumber
        };
    }

    parseAlarm(buffer) {
        const serialNumber = buffer.readUInt16BE(buffer.length - 6);
        // Alarm type is usually at a specific offset
        const alarmType = buffer[4]; // Example offset

        return {
            type: 'alarm',
            alarmCode: alarmType,
            serialNumber
        };
    }

    createResponse(serialNumber, type) {
        // GT06 response packet
        // Start(2) + Length(1) + Protocol(1) + Serial(2) + Error(2) + Stop(2)
        const buffer = Buffer.alloc(10);
        buffer.writeUInt16BE(0x7878, 0); // Start
        buffer.writeUInt8(0x05, 2); // Length
        buffer.writeUInt8(type, 3); // Protocol (same as received usually)
        buffer.writeUInt16BE(serialNumber, 4); // Serial

        // CRC Checksum (Simplified: just dummy here or implement CRC-ITU)
        // For now, just 0x0000
        buffer.writeUInt16BE(0x0000, 6); // Error Check

        buffer.writeUInt16BE(0x0D0A, 8); // Stop

        return buffer;
    }
}

module.exports = new GT06Parser();
