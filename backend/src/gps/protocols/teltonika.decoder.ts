import { Injectable } from '@nestjs/common';
import { AbstractDecoder, DecodeResult, Position, LoginResult } from './abstract.decoder';

@Injectable()
export class TeltonikaDecoder extends AbstractDecoder {
    constructor() {
        super('Teltonika');
    }

    async decode(buffer: Buffer): Promise<DecodeResult> {
        const result: DecodeResult = {
            success: false,
            positions: [],
            bytesConsumed: 0,
        };

        try {
            // Check minimum length
            if (buffer.length < 12) {
                return result;
            }

            // Check for IMEI packet (0x000F for 15-byte IMEI)
            if (buffer.readUInt32BE(0) === 0x000F) {
                return this.handleImeiPacket(buffer);
            }

            // Parse AVL Data Packet
            return this.parseAvlData(buffer);

        } catch (error) {
            this.logger.error('Decode error:', error);
            result.bytesConsumed = buffer.length;
        }

        return result;
    }

    /**
     * Handle IMEI identification packet
     */
    private handleImeiPacket(buffer: Buffer): DecodeResult {
        const result: DecodeResult = {
            success: false,
            positions: [],
            bytesConsumed: 0,
        };

        if (buffer.length < 17) {
            return result;
        }

        // Read IMEI length (should be 15)
        const imeiLength = buffer.readUInt16BE(0);

        if (imeiLength !== 15 || buffer.length < 2 + imeiLength) {
            return result;
        }

        // Read IMEI
        const imei = buffer.slice(2, 2 + imeiLength).toString('ascii');

        this.logger.log(`Teltonika IMEI: ${imei}`);

        // Send acknowledgment (0x01)
        result.response = Buffer.from([0x01]);
        result.bytesConsumed = 2 + imeiLength;
        result.success = true;

        return result;
    }

    /**
     * Parse AVL Data Packet
     */
    private parseAvlData(buffer: Buffer): DecodeResult {
        const result: DecodeResult = {
            success: false,
            positions: [],
            bytesConsumed: 0,
        };

        if (buffer.length < 12) {
            return result;
        }

        let index = 0;

        // Read preamble (4 bytes) - should be 0x00000000
        const preamble = buffer.readUInt32BE(index);
        index += 4;

        if (preamble !== 0) {
            this.logger.warn('Invalid preamble');
            return result;
        }

        // Read data length (4 bytes)
        const dataLength = buffer.readUInt32BE(index);
        index += 4;

        // Check if we have complete packet
        if (buffer.length < 8 + dataLength + 4) {
            return result; // Wait for more data
        }

        // Read Codec ID (1 byte)
        const codecId = buffer[index];
        index += 1;

        this.logger.debug(`Codec: 0x${codecId.toString(16)}`);

        // Read number of records (1 byte)
        const numberOfRecords = buffer[index];
        index += 1;

        // Parse records
        for (let i = 0; i < numberOfRecords; i++) {
            const position = this.parseAvlRecord(buffer, index, codecId);
            if (position.position) {
                result.positions.push(position.position);
            }
            index = position.nextIndex;
        }

        // Read number of records again (1 byte) - should match
        const numberOfRecords2 = buffer[index];
        index += 1;

        if (numberOfRecords !== numberOfRecords2) {
            this.logger.warn('Record count mismatch');
        }

        // Read CRC (4 bytes)
        const crc = buffer.readUInt32BE(index);
        index += 4;

        // Verify CRC
        const calculatedCrc = this.calculateCrc16(buffer, 8, 8 + dataLength);
        if (crc !== calculatedCrc) {
            this.logger.warn('CRC mismatch');
        }

        // Build response (acknowledge with number of records)
        result.response = Buffer.alloc(4);
        result.response.writeUInt32BE(numberOfRecords, 0);

        result.bytesConsumed = index;
        result.success = true;

        return result;
    }

    /**
     * Parse single AVL record
     */
    private parseAvlRecord(buffer: Buffer, startIndex: number, codecId: number): {
        position: Position | null;
        nextIndex: number;
    } {
        let index = startIndex;

        try {
            const position: Position = {
                deviceId: '',
                protocol: 'teltonika',
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

            // Read timestamp (8 bytes, milliseconds since epoch)
            const timestamp = Number(buffer.readBigUInt64BE(index));
            index += 8;
            position.deviceTime = new Date(timestamp);
            position.fixTime = position.deviceTime;

            // Read priority (1 byte)
            const priority = buffer[index];
            index += 1;
            position.attributes.priority = priority;

            // Read GPS Element
            // Longitude (4 bytes, signed)
            position.longitude = buffer.readInt32BE(index) / 10000000;
            index += 4;

            // Latitude (4 bytes, signed)
            position.latitude = buffer.readInt32BE(index) / 10000000;
            index += 4;

            // Altitude (2 bytes, signed, meters)
            position.altitude = buffer.readInt16BE(index);
            index += 2;

            // Angle/Course (2 bytes)
            position.course = buffer.readUInt16BE(index);
            index += 2;

            // Satellites (1 byte)
            position.satellites = buffer[index];
            index += 1;

            // Speed (2 bytes, km/h)
            position.speed = buffer.readUInt16BE(index);
            index += 2;

            // GPS validity
            position.valid = position.satellites > 0;

            // Read IO Element
            if (codecId === 0x08) {
                // Codec 8
                const ioResult = this.parseIoElements(buffer, index);
                position.attributes = { ...position.attributes, ...ioResult.attributes };
                index = ioResult.nextIndex;
            } else if (codecId === 0x8E) {
                // Codec 8 Extended
                const ioResult = this.parseIoElementsExtended(buffer, index);
                position.attributes = { ...position.attributes, ...ioResult.attributes };
                index = ioResult.nextIndex;
            }

            return { position, nextIndex: index };

        } catch (error) {
            this.logger.error('Error parsing AVL record:', error);
            return { position: null, nextIndex: index };
        }
    }

    /**
     * Parse IO Elements (Codec 8)
     */
    private parseIoElements(buffer: Buffer, startIndex: number): {
        attributes: Record<string, any>;
        nextIndex: number;
    } {
        let index = startIndex;
        const attributes: Record<string, any> = {};

        try {
            // Read Event IO ID (1 byte)
            const eventId = buffer[index];
            index += 1;
            if (eventId !== 0) {
                attributes.event = eventId;
            }

            // Read Total IO Elements (1 byte)
            const totalElements = buffer[index];
            index += 1;

            // Read 1-byte IO elements
            let count = buffer[index];
            index += 1;
            for (let i = 0; i < count; i++) {
                const id = buffer[index];
                index += 1;
                const value = buffer[index];
                index += 1;
                attributes[`io${id}`] = value;

                // Map common IDs
                this.mapIoElement(attributes, id, value);
            }

            // Read 2-byte IO elements
            count = buffer[index];
            index += 1;
            for (let i = 0; i < count; i++) {
                const id = buffer[index];
                index += 1;
                const value = buffer.readUInt16BE(index);
                index += 2;
                attributes[`io${id}`] = value;
                this.mapIoElement(attributes, id, value);
            }

            // Read 4-byte IO elements
            count = buffer[index];
            index += 1;
            for (let i = 0; i < count; i++) {
                const id = buffer[index];
                index += 1;
                const value = buffer.readUInt32BE(index);
                index += 4;
                attributes[`io${id}`] = value;
                this.mapIoElement(attributes, id, value);
            }

            // Read 8-byte IO elements
            count = buffer[index];
            index += 1;
            for (let i = 0; i < count; i++) {
                const id = buffer[index];
                index += 1;
                const value = Number(buffer.readBigUInt64BE(index));
                index += 8;
                attributes[`io${id}`] = value;
                this.mapIoElement(attributes, id, value);
            }

        } catch (error) {
            this.logger.error('Error parsing IO elements:', error);
        }

        return { attributes, nextIndex: index };
    }

    /**
     * Parse IO Elements Extended (Codec 8E)
     */
    private parseIoElementsExtended(buffer: Buffer, startIndex: number): {
        attributes: Record<string, any>;
        nextIndex: number;
    } {
        let index = startIndex;
        const attributes: Record<string, any> = {};

        try {
            // Read Event IO ID (2 bytes for extended)
            const eventId = buffer.readUInt16BE(index);
            index += 2;
            if (eventId !== 0) {
                attributes.event = eventId;
            }

            // Read Total IO Elements (2 bytes)
            const totalElements = buffer.readUInt16BE(index);
            index += 2;

            // Similar structure to Codec 8, but with 2-byte IDs
            // ... (implementation similar to parseIoElements but with 2-byte IDs)

        } catch (error) {
            this.logger.error('Error parsing IO elements extended:', error);
        }

        return { attributes, nextIndex: index };
    }

    /**
     * Map Teltonika IO element IDs to meaningful names
     */
    private mapIoElement(attributes: Record<string, any>, id: number, value: number): void {
        switch (id) {
            case 1:
                attributes.ignition = value === 1;
                break;
            case 9:
                attributes.analog1 = value;
                break;
            case 66:
                attributes.power = value / 1000; // mV to V
                break;
            case 67:
                attributes.battery = value / 1000;
                break;
            case 80:
                attributes.dataMode = value;
                break;
            case 113:
                attributes.battery = value / 10; // Battery voltage
                break;
            case 181:
                attributes.hdop = value / 10;
                break;
            case 182:
                attributes.pdop = value / 10;
                break;
            case 200:
                attributes.sleep = value;
                break;
            case 239:
                attributes.ignition = value === 1;
                break;
            case 240:
                attributes.movement = value === 1;
                break;
            // Add more mappings as needed
        }
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
        return true; // CRC checked in parseAvlData
    }
}
