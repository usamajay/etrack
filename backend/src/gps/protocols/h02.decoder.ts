import { Injectable } from '@nestjs/common';
import { AbstractDecoder, DecodeResult, Position, LoginResult } from './abstract.decoder';

@Injectable()
export class H02Decoder extends AbstractDecoder {
    constructor() {
        super('H02');
    }

    async decode(buffer: Buffer): Promise<DecodeResult> {
        const result: DecodeResult = {
            success: false,
            positions: [],
            bytesConsumed: 0,
        };

        try {
            // Check if ASCII or Binary
            if (buffer[0] === 0x2a) { // '*' - ASCII format
                return this.decodeAscii(buffer);
            } else if (buffer[0] === 0x24) { // '$' - Binary format
                return this.decodeBinary(buffer);
            }

            return result;

        } catch (error) {
            this.logger.error('Decode error:', error);
            result.bytesConsumed = buffer.length;
        }

        return result;
    }

    /**
     * Decode ASCII format
  */
    private decodeAscii(buffer: Buffer): DecodeResult {
        const result: DecodeResult = {
            success: false,
            positions: [],
            bytesConsumed: 0,
        };

        // Find message end (#)
        const endIndex = buffer.indexOf(0x23); // '#'
        if (endIndex === -1) {
            return result; // Wait for complete message
        }

        const message = buffer.slice(0, endIndex + 1).toString('ascii');
        result.bytesConsumed = endIndex + 1;

        this.logger.debug(`H02 ASCII: ${message}`);

        // Parse message
        // Format: *HQ,IMEI,V1,HHMMSS,A/V,LAT,N/S,LON,E/W,SPEED,COURSE,DDMMYY,STATUS#
        const parts = message.substring(1, message.length - 1).split(',');

        if (parts.length < 13) {
            this.logger.warn('Invalid message format');
            return result;
        }

        try {
            const position: Position = {
                deviceId: parts[1], // IMEI
                protocol: 'h02',
                deviceTime: new Date(),
                fixTime: new Date(),
                latitude: 0,
                longitude: 0,
                altitude: 0,
                speed: 0,
                course: 0,
                valid: parts[4] === 'A', // A = valid, V = invalid
                attributes: {},
            };

            // Parse time (HHMMSS)
            const time = parts[3];
            const hour = parseInt(time.substr(0, 2));
            const minute = parseInt(time.substr(2, 2));
            const second = parseInt(time.substr(4, 2));

            // Parse date (DDMMYY)
            const date = parts[11];
            const day = parseInt(date.substr(0, 2));
            const month = parseInt(date.substr(2, 2));
            const year = parseInt(date.substr(4, 2));

            position.deviceTime = this.parseDateTime(year, month, day, hour, minute, second);
            position.fixTime = position.deviceTime;

            // Parse latitude (DDMM.MMMM)
            const latStr = parts[5];
            const latDeg = parseInt(latStr.substr(0, 2));
            const latMin = parseFloat(latStr.substr(2));
            position.latitude = latDeg + latMin / 60;
            if (parts[6] === 'S') {
                position.latitude = -position.latitude;
            }

            // Parse longitude (DDDMM.MMMM)
            const lonStr = parts[7];
            const lonDeg = parseInt(lonStr.substr(0, 3));
            const lonMin = parseFloat(lonStr.substr(3));
            position.longitude = lonDeg + lonMin / 60;
            if (parts[8] === 'W') {
                position.longitude = -position.longitude;
            }

            // Speed (knots)
            position.speed = parseFloat(parts[9]) * 1.852; // Convert to km/h

            // Course
            position.course = parseFloat(parts[10]);

            // Status (hex string)
            position.attributes.status = parts[12];

            result.positions.push(position);
            result.success = true;

        } catch (error) {
            this.logger.error('Error parsing ASCII message:', error);
        }

        return result;
    }

    /**
     * Decode Binary format
     */
    private decodeBinary(buffer: Buffer): DecodeResult {
        const result: DecodeResult = {
            success: false,
            positions: [],
            bytesConsumed: 0,
        };

        // Minimum packet length
        if (buffer.length < 30) {
            return result;
        }

        // Binary format parsing (implementation depends on specific variant)
        // This is a simplified version

        try {
            // TODO: Implement binary parsing based on device documentation

            result.bytesConsumed = 30; // Adjust based on actual packet size
            result.success = true;

        } catch (error) {
            this.logger.error('Error parsing binary message:', error);
        }

        return result;
    }

    protected parseLogin(buffer: Buffer): LoginResult {
        // H02 doesn't have separate login
        return { deviceId: '', success: true };
    }

    protected parsePosition(buffer: Buffer): Position | null {
        // Handled in decode method
        return null;
    }

    protected buildResponse(type: string, data?: any): Buffer {
        // H02 usually doesn't require responses
        return Buffer.alloc(0);
    }

    protected verifyChecksum(buffer: Buffer): boolean {
        // ASCII format doesn't have checksum
        return true;
    }
}
