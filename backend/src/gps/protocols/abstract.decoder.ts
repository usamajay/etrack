import { Logger } from '@nestjs/common';

export interface DecodeResult {
    success: boolean;
    positions: Position[];
    response?: Buffer;
    bytesConsumed: number;
    error?: string;
}

export interface LoginResult {
    deviceId: string;
    success: boolean;
}

export interface Position {
    deviceId: string;
    protocol: string;
    deviceTime: Date;
    fixTime: Date;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    course: number;
    satellites?: number;
    hdop?: number;
    valid: boolean;
    attributes: Record<string, any>;
}

export abstract class AbstractDecoder {
    protected logger: Logger;

    constructor(protected protocolName: string) {
        this.logger = new Logger(`${protocolName}Decoder`);
    }

    /**
     * Main decode method - must be implemented by each protocol
     */
    abstract decode(buffer: Buffer): Promise<DecodeResult>;

    /**
     * Parse login packet
     */
    protected abstract parseLogin(buffer: Buffer): LoginResult;

    /**
     * Parse position packet
     */
    protected abstract parsePosition(buffer: Buffer): Position | null;

    /**
     * Build response packet
     */
    protected abstract buildResponse(type: string, data?: any): Buffer;

    /**
     * Verify checksum (CRC, XOR, etc.)
     */
    protected abstract verifyChecksum(buffer: Buffer): boolean;

    /**
     * Helper: Read bytes as hex string
     */
    protected readHex(buffer: Buffer, start: number, length: number): string {
        return buffer.slice(start, start + length).toString('hex');
    }

    /**
     * Helper: Read BCD (Binary Coded Decimal)
     */
    protected readBcd(buffer: Buffer, start: number, length: number): string {
        let result = '';
        for (let i = start; i < start + length; i++) {
            const byte = buffer[i];
            result += ((byte >> 4) & 0x0f).toString() + (byte & 0x0f).toString();
        }
        return result;
    }

    /**
     * Helper: Calculate CRC16
     */
    protected calculateCrc16(buffer: Buffer, start: number, end: number): number {
        let crc = 0xffff;
        for (let i = start; i < end; i++) {
            crc ^= buffer[i] << 8;
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc = crc << 1;
                }
            }
        }
        return crc & 0xffff;
    }

    /**
     * Helper: Calculate CRC8
     */
    protected calculateCrc8(buffer: Buffer, start: number, end: number): number {
        let crc = 0;
        for (let i = start; i < end; i++) {
            crc ^= buffer[i];
        }
        return crc & 0xff;
    }

    /**
     * Helper: Convert degrees-minutes to decimal degrees
     */
    protected convertCoordinate(degreesMinutes: number, isLatitude: boolean): number {
        const divisor = isLatitude ? 100 : 1000;
        const degrees = Math.floor(degreesMinutes / divisor);
        const minutes = degreesMinutes - degrees * divisor;
        return degrees + minutes / 60;
    }

    /**
     * Helper: Parse date/time
     */
    protected parseDateTime(year: number, month: number, day: number,
        hour: number, minute: number, second: number): Date {
        // Assume 2000+ for 2-digit years
        const fullYear = year < 100 ? 2000 + year : year;
        return new Date(Date.UTC(fullYear, month - 1, day, hour, minute, second));
    }
}
