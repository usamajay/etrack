import { Injectable } from '@nestjs/common';
import { AbstractDecoder, DecodeResult, Position, LoginResult } from './abstract.decoder';

@Injectable()
export class Gt06Decoder extends AbstractDecoder {
    // Protocol numbers
    private static readonly PROTOCOL_LOGIN = 0x01;
    private static readonly PROTOCOL_POSITION = 0x12;
    private static readonly PROTOCOL_HEARTBEAT = 0x13;
    private static readonly PROTOCOL_ALARM = 0x16;
    private static readonly PROTOCOL_STATUS = 0x19;
    private static readonly PROTOCOL_GPS_LBS = 0x22;

    constructor() {
        super('GT06');
    }

    /**
     * Main decode method
     */
    async decode(buffer: Buffer): Promise<DecodeResult> {
        const result: DecodeResult = {
            success: false,
            positions: [],
            bytesConsumed: 0,
        };

        try {
            // Check minimum length
            if (buffer.length < 10) {
                return result;
            }

            // Check start bits
            if (buffer[0] !== 0x78 || buffer[1] !== 0x78) {
                this.logger.warn('Invalid start bits');
                return result;
            }

            // Read packet length
            const length = buffer[2];
            const packetLength = length + 5; // +2 start, +2 CRC, +1 length itself

            // Check if we have complete packet
            if (buffer.length < packetLength) {
                return result; // Wait for more data
            }

            // Extract packet
            const packet = buffer.slice(0, packetLength);

            // Verify CRC
            if (!this.verifyChecksum(packet)) {
                this.logger.warn('CRC verification failed');
                result.bytesConsumed = packetLength; // Skip bad packet
                return result;
            }

            // Read protocol number
            const protocol = packet[3];

            // Read serial number
            const serial = packet.readUInt16BE(packet.length - 6);

            this.logger.debug(`GT06 packet - Protocol: 0x${protocol.toString(16)}, Serial: ${serial}`);

            // Parse based on protocol
            switch (protocol) {
                case Gt06Decoder.PROTOCOL_LOGIN:
                    result.response = this.handleLogin(packet, serial);
                    break;

                case Gt06Decoder.PROTOCOL_HEARTBEAT:
                    result.response = this.handleHeartbeat(packet, serial);
                    break;

                case Gt06Decoder.PROTOCOL_POSITION:
                case Gt06Decoder.PROTOCOL_GPS_LBS:
                case Gt06Decoder.PROTOCOL_ALARM:
                    const position = this.parsePosition(packet);
                    if (position) {
                        result.positions.push(position);
                        result.response = this.buildPositionResponse(serial);
                    }
                    break;

                default:
                    this.logger.warn(`Unknown protocol: 0x${protocol.toString(16)}`);
            }

            result.success = true;
            result.bytesConsumed = packetLength;

        } catch (error) {
            this.logger.error('Decode error:', error);
            result.bytesConsumed = buffer.length; // Skip entire buffer on error
        }

        return result;
    }

    /**
     * Handle login packet
     */
    private handleLogin(packet: Buffer, serial: number): Buffer {
        // Extract IMEI (8 bytes BCD)
        const imeiBytes = packet.slice(4, 12);
        const imei = this.readBcd(imeiBytes, 0, 8);

        this.logger.log(`Device login - IMEI: ${imei}`);

        // Build login response
        return this.buildResponse('login', serial);
    }

    /**
     * Handle heartbeat packet
     */
    private handleHeartbeat(packet: Buffer, serial: number): Buffer {
        this.logger.debug('Heartbeat received');
        return this.buildResponse('heartbeat', serial);
    }

    /**
     * Parse position packet
     */
    protected parsePosition(packet: Buffer): Position | null {
        try {
            let position: Position = {
                deviceId: '',
                protocol: 'gt06',
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

            let index = 4; // Start after header

            // Parse date/time (6 bytes)
            const year = packet[index++];
            const month = packet[index++];
            const day = packet[index++];
            const hour = packet[index++];
            const minute = packet[index++];
            const second = packet[index++];

            position.deviceTime = this.parseDateTime(year, month, day, hour, minute, second);
            position.fixTime = position.deviceTime;

            // Parse GPS info length
            const gpsLength = packet[index++];

            // Parse satellites
            position.satellites = gpsLength & 0x0f;

            // Parse latitude (4 bytes)
            const latitudeRaw = packet.readUInt32BE(index);
            index += 4;
            position.latitude = latitudeRaw / 1800000.0;

            // Parse longitude (4 bytes)
            const longitudeRaw = packet.readUInt32BE(index);
            index += 4;
            position.longitude = longitudeRaw / 1800000.0;

            // Parse speed (1 byte)
            position.speed = packet[index++];

            // Parse course and status (2 bytes)
            const courseStatus = packet.readUInt16BE(index);
            index += 2;

            position.course = courseStatus & 0x03ff; // 10 bits

            // Parse status bits
            const statusBits = (courseStatus >> 10) & 0x3f;
            position.valid = (statusBits & 0x20) === 0; // GPS positioned bit
            position.attributes.gpsFixed = (statusBits & 0x20) === 0;
            position.attributes.east = (statusBits & 0x08) !== 0;
            position.attributes.south = (statusBits & 0x04) !== 0;

            // Apply hemisphere
            if (position.attributes.south) {
                position.latitude = -position.latitude;
            }
            if (!position.attributes.east) {
                position.longitude = -position.longitude;
            }

            // Parse LBS (Location Based Service - cell tower info)
            if (index < packet.length - 6) {
                const mcc = packet.readUInt16BE(index);
                index += 2;
                const mnc = packet[index++];
                const lac = packet.readUInt16BE(index);
                index += 2;
                const cellId = packet.readUInt32BE(index) & 0x00ffffff;
                index += 3;

                position.attributes.mcc = mcc;
                position.attributes.mnc = mnc;
                position.attributes.lac = lac;
                position.attributes.cid = cellId;
            }

            return position;

        } catch (error) {
            this.logger.error('Error parsing position:', error);
            return null;
        }
    }

    /**
     * Parse login packet
     */
    protected parseLogin(buffer: Buffer): LoginResult {
        const imeiBytes = buffer.slice(4, 12);
        const imei = this.readBcd(imeiBytes, 0, 8);
        return { deviceId: imei, success: true };
    }

    /**
     * Build response packet
     */
    protected buildResponse(type: string, serial: number): Buffer {
        let response: Buffer;

        if (type === 'login') {
            // Login response: 0x78 0x78 0x05 0x01 serial CRC 0x0D 0x0A
            response = Buffer.alloc(10);
            response[0] = 0x78;
            response[1] = 0x78;
            response[2] = 0x05; // length
            response[3] = 0x01; // login protocol
            response.writeUInt16BE(serial, 4);
        } else if (type === 'heartbeat') {
            // Heartbeat response: 0x78 0x78 0x05 0x13 serial CRC 0x0D 0x0A
            response = Buffer.alloc(10);
            response[0] = 0x78;
            response[1] = 0x78;
            response[2] = 0x05;
            response[3] = 0x13;
            response.writeUInt16BE(serial, 4);
        } else {
            // Position response: 0x78 0x78 0x05 protocol serial CRC 0x0D 0x0A
            response = Buffer.alloc(10);
            response[0] = 0x78;
            response[1] = 0x78;
            response[2] = 0x05;
            response[3] = 0x12; // position protocol
            response.writeUInt16BE(serial, 4);
        }

        // Calculate CRC
        const crc = this.calculateCrc16(response, 2, 6);
        response.writeUInt16BE(crc, 6);

        // Stop bits
        response[8] = 0x0d;
        response[9] = 0x0a;

        return response;
    }

    /**
     * Build position response
     */
    private buildPositionResponse(serial: number): Buffer {
        return this.buildResponse('position', serial);
    }

    /**
     * Verify CRC16 checksum
     */
    protected verifyChecksum(buffer: Buffer): boolean {
        const length = buffer[2];
        const calculatedCrc = this.calculateCrc16(buffer, 2, length + 1);
        const packetCrc = buffer.readUInt16BE(length + 1);
        return calculatedCrc === packetCrc;
    }
}
