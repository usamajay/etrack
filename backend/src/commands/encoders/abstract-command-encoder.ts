import { Command, CommandType } from '../../entities/Command.entity';

export abstract class AbstractCommandEncoder {
    /**
     * Encode a command into protocol-specific byte array
     */
    abstract encodeCommand(command: Command): Buffer;

    /**
     * Get command name for logging
     */
    protected getCommandName(type: CommandType): string {
        const names: Record<CommandType, string> = {
            [CommandType.ENGINE_CUT]: 'Engine Cut',
            [CommandType.ENGINE_RESUME]: 'Engine Resume',
            [CommandType.REQUEST_LOCATION]: 'Request Location',
            [CommandType.SET_SPEED_LIMIT]: 'Set Speed Limit',
            [CommandType.REBOOT]: 'Reboot',
            [CommandType.CUSTOM]: 'Custom',
        };
        return names[type] || 'Unknown';
    }
}
