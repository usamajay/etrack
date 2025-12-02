import { AbstractCommandEncoder } from './abstract-command-encoder';
import { Gt06CommandEncoder } from './gt06-command-encoder';

export class CommandEncoderFactory {
    private static encoders: Map<string, AbstractCommandEncoder> = new Map();

    static getEncoder(protocol: string): AbstractCommandEncoder {
        const normalizedProtocol = protocol.toLowerCase();

        if (!this.encoders.has(normalizedProtocol)) {
            switch (normalizedProtocol) {
                case 'gt06':
                    this.encoders.set(normalizedProtocol, new Gt06CommandEncoder());
                    break;

                // Add more protocols as needed
                // case 'h02':
                //   this.encoders.set(normalizedProtocol, new H02CommandEncoder());
                //   break;

                default:
                    throw new Error(`Unsupported protocol for commands: ${protocol}`);
            }
        }

        return this.encoders.get(normalizedProtocol)!;
    }
}
