import { AbstractCommandEncoder } from './abstract-command-encoder';
import { Command, CommandType } from '../../entities/Command.entity';

export class Gt06CommandEncoder extends AbstractCommandEncoder {
    encodeCommand(command: Command): Buffer {
        // GT06 command format:
        // Start: 0x78 0x78
        // Length: 1 byte
        // Protocol: 0x80 (command)
        // Content: varies by command
        // Serial: 2 bytes
        // CRC: 2 bytes
        // Stop: 0x0D 0x0A

        let content: Buffer;

        switch (command.type) {
            case CommandType.ENGINE_CUT:
                // Command: DYD# (relay control - cut)
                content = Buffer.from('DYD#', 'ascii');
                break;

            case CommandType.ENGINE_RESUME:
                // Command: HFYD# (relay control - resume)
                content = Buffer.from('HFYD#', 'ascii');
                break;

            case CommandType.REQUEST_LOCATION:
                // Command: CXZT# (request location)
                content = Buffer.from('CXZT#', 'ascii');
                break;

            case CommandType.SET_SPEED_LIMIT:
                // Command: SPEED,XXX# (set speed limit in km/h)
                const speed = command.parameters.speed || 100;
                content = Buffer.from(`SPEED,${speed}#`, 'ascii');
                break;

            case CommandType.REBOOT:
                // Command: RESET# (reboot device)
                content = Buffer.from('RESET#', 'ascii');
                break;

            default:
                throw new Error(`Unsupported command type: ${command.type}`);
        }

        // Build packet
        const length = content.length + 5; // protocol + content + serial
        const packet = Buffer.alloc(length + 5); // start + length + content + crc + stop

        let offset = 0;

        // Start bytes
        packet[offset++] = 0x78;
        packet[offset++] = 0x78;

        // Length
        packet[offset++] = length;

        // Protocol number (0x80 for server command)
        packet[offset++] = 0x80;

        // Content
        content.copy(packet, offset);
        offset += content.length;

        // Serial number (2 bytes) - use random for now
        const serial = Math.floor(Math.random() * 0xFFFF);
        packet.writeUInt16BE(serial, offset);
        offset += 2;

        // CRC (2 bytes) - ITU CRC16
        const crc = this.calculateCRC(packet.slice(2, offset));
        packet.writeUInt16BE(crc, offset);
        offset += 2;

        // Stop bytes
        packet[offset++] = 0x0D;
        packet[offset++] = 0x0A;

        return packet;
    }

    private calculateCRC(data: Buffer): number {
        let crc = 0xFFFF;
        for (let i = 0; i < data.length; i++) {
            crc ^= data[i] << 8;
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc = crc << 1;
                }
            }
        }
        return crc & 0xFFFF;
    }
}
