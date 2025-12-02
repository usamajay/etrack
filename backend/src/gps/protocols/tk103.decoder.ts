import { Injectable } from '@nestjs/common';
import { AbstractDecoder, DecodeResult, Position, LoginResult } from './abstract.decoder';

@Injectable()
export class Tk103Decoder extends AbstractDecoder {
    constructor() {
        super('TK103');
    }

    async decode(buffer: Buffer): Promise<DecodeResult> {
        const result: DecodeResult = {
            success: false,
            positions: [],
            bytesConsumed: 0,
        };

        try {
            // Find message start '(' and end ')'
            const startIndex = buffer.indexOf(0x28); // '('
            if (startIndex === -1) {
                result.bytesConsumed = buffer.length;
                return result;
            }

            const endIndex = buffer.indexOf(0x29, startIndex); // ')'
            if (endIndex === -1) {
                return result; // Wait for complete message
            }

            const message = buffer.slice(startIndex, endIndex + 1).toString('ascii');
            result.bytesConsumed = endIndex + 1;

            this.logger.debug(`TK103: ${message}`);

            // Remove parentheses
            const data = message.substring(1, message.length - 1);

            // Extract device ID (first 12 digits)
            const deviceId = data.substring(0, 12);

            // Extract command (next 4 characters)
            const command = data.substring(12, 16);

            this.logger.debug(`Device: ${deviceId}, Command: ${command}`);

            // Handle different commands
            if (command === 'BP00') {
                // Handshake
                result.response = this.buildHandshakeResponse(deviceId);
            } else if (command.startsWith('BR')) {
                // Position data
                const position = this.parsePositionData(deviceId, data.substring(16));
                if (position) {
                    result.positions.push(position);
                    result.response = this.buildPositionResponse(deviceId);
                }
            }

            result.success = true;

        } catch (error) {
            this.logger.error('Decode error:', error);
            result.bytesConsumed = buffer.length;
        }

        return result;
    }

    /**
     * Parse position data
     */
    private parsePositionData(deviceId: string, data: string): Position | null {
        try {
            // Format: HHMMSS[A/V]LAT[N/S]LON[E/W]SPEEDCOURSE[DDMMYY]...

            const position: Position = {
                deviceId,
                protocol: 'tk103',
                deviceTime: new Date(),
                fixTime: new Date(),
                latitude: 0,
                longitude: 0,
                altitude: 0,
                speed: 0,
                course: 0,
                valid: false,
                attributes: {},
            };

            let index = 0;

            // Parse time (HHMMSS)
            const time = data.substr(index, 6);
            index += 6;
            const hour = parseInt(time.substr(0, 2));
            const minute = parseInt(time.substr(2, 2));
            const second = parseInt(time.substr(4, 2));

            // Parse validity
            position.valid = data[index] === 'A';
            index += 1;

            // Parse latitude (DDMM.MMMM)
            const latStr = data.substr(index, 9);
            index += 9;
            const latDeg = parseInt(latStr.substr(0, 2));
            const latMin = parseFloat(latStr.substr(2));
            position.latitude = latDeg + latMin / 60;

            // Parse latitude hemisphere
            if (data[index] === 'S') {
                position.latitude = -position.latitude;
            }
            index += 1;

            // Parse longitude (DDDMM.MMMM)
            const lonStr = data.substr(index, 10);
            index += 10;
            const lonDeg = parseInt(lonStr.substr(0, 3));
            const lonMin = parseFloat(lonStr.substr(3));
            position.longitude = lonDeg + lonMin / 60;

            // Parse longitude hemisphere
            if (data[index] === 'W') {
                position.longitude = -position.longitude;
            }
            index += 1;

            // Parse speed (knots)
            const speedStr = data.substr(index, 5);
            index += 5;
            position.speed = parseFloat(speedStr) * 1.852; // Convert to km/h

            // Parse course
            const courseStr = data.substr(index, 6);
            index += 6;
            position.course = parseFloat(courseStr);

            // Parse date (DDMMYY)
            const dateStr = data.substr(index, 6);
            index += 6;
            const day = parseInt(dateStr.substr(0, 2));
            const month = parseInt(dateStr.substr(2, 2));
            const year = parseInt(dateStr.substr(4, 2));

            position.deviceTime = this.parseDateTime(year, month, day, hour, minute, second);
            position.fixTime = position.deviceTime;

            // Parse status bits (if available)
            if (data.length > index) {
                position.attributes.status = data.substr(index);
            }

            return position;

        } catch (error) {
            this.logger.error('Error parsing position data:', error);
            return null;
        }
    }

    /**
     * Build handshake response
     */
    private buildHandshakeResponse(deviceId: string): Buffer {
        const response = `(${deviceId}AP05)`;
        return Buffer.from(response, 'ascii');
    }

    /**
     * Build position response
     */
    private buildPositionResponse(deviceId: string): Buffer {
        const response = `(${deviceId}AS01)`;
        return Buffer.from(response, 'ascii');
    }

    protected parseLogin(buffer: Buffer): LoginResult {
        return { deviceId: '', success: true };
    }

    protected parsePosition(buffer: Buffer): Position | null {
        return null;
    }

    protected buildResponse(type: string, data?: any): Buffer {
        return Buffer.alloc(0);
    }

    protected verifyChecksum(buffer: Buffer): boolean {
        return true;
    }
}
