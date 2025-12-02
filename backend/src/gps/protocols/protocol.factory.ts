import { Injectable, Logger } from '@nestjs/common';
import { AbstractDecoder } from './abstract.decoder';
import { Gt06Decoder } from './gt06.decoder';
import { H02Decoder } from './h02.decoder';
import { Tk103Decoder } from './tk103.decoder';
import { TeltonikaDecoder } from './teltonika.decoder';

@Injectable()
export class ProtocolFactory {
    private logger = new Logger('ProtocolFactory');
    private decoders: Map<string, AbstractDecoder> = new Map();

    constructor(
        private gt06Decoder: Gt06Decoder,
        private h02Decoder: H02Decoder,
        private tk103Decoder: Tk103Decoder,
        private teltonikaDecoder: TeltonikaDecoder,
    ) {
        this.registerDecoders();
    }

    /**
     * Register all protocol decoders
     */
    private registerDecoders(): void {
        this.decoders.set('gt06', this.gt06Decoder);
        this.decoders.set('h02', this.h02Decoder);
        this.decoders.set('tk103', this.tk103Decoder);
        this.decoders.set('teltonika', this.teltonikaDecoder);
    }

    /**
     * Get decoder by protocol name
     */
    getDecoder(protocol: string): AbstractDecoder {
        const decoder = this.decoders.get(protocol.toLowerCase());
        if (!decoder) {
            throw new Error(`Protocol ${protocol} not supported`);
        }
        return decoder;
    }

    /**
     * Auto-detect protocol from buffer
     */
    detectProtocol(buffer: Buffer): string | null {
        // GT06 - starts with 0x78 0x78 or 0x79 0x79
        if (buffer.length >= 2 &&
            ((buffer[0] === 0x78 && buffer[1] === 0x78) ||
                (buffer[0] === 0x79 && buffer[1] === 0x79))) {
            return 'gt06';
        }

        // H02 - starts with '*' for ASCII or 0x24 for binary
        if (buffer.length >= 1 && (buffer[0] === 0x2a || buffer[0] === 0x24)) {
            return 'h02';
        }

        // TK103 - ASCII format starts with '('
        if (buffer.length >= 1 && buffer[0] === 0x28) {
            return 'tk103';
        }

        // Teltonika - starts with 0x00 0x00 (preamble)
        if (buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00) {
            return 'teltonika';
        }

        return null;
    }

    /**
     * Get all supported protocols
     */
    getSupportedProtocols(): string[] {
        return Array.from(this.decoders.keys());
    }
}
