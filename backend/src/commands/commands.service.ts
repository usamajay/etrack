import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Command, CommandType, CommandStatus } from '../entities/Command.entity';
import { Device } from '../entities/Device.entity';
import { User } from '../entities/User.entity';
import { Position } from '../entities/Position.entity';
import { GpsGateway } from '../gps/gps.gateway';
import { CommandEncoderFactory } from './encoders/command-encoder-factory';

@Injectable()
export class CommandsService {
    private readonly logger = new Logger(CommandsService.name);

    constructor(
        @InjectRepository(Command)
        private commandRepository: Repository<Command>,
        @InjectRepository(Device)
        private deviceRepository: Repository<Device>,
        @InjectRepository(Position)
        private positionRepository: Repository<Position>,
        private gpsGateway: GpsGateway,
    ) { }

    /**
     * Create and send a command to a device
     */
    async createCommand(
        type: CommandType,
        deviceId: number,
        user: User,
        parameters: Record<string, any> = {},
    ): Promise<Command> {
        // Find device
        const device = await this.deviceRepository.findOne({
            where: { id: deviceId },
        });

        if (!device) {
            throw new NotFoundException(`Device ${deviceId} not found`);
        }

        // Safety check for engine cut
        if (type === CommandType.ENGINE_CUT) {
            const canCut = await this.canCutEngine(device);
            if (!canCut) {
                throw new BadRequestException(
                    'Cannot cut engine: vehicle is moving too fast (speed > 5 km/h). Please wait until vehicle stops.',
                );
            }
        }

        // Create command
        const command = this.commandRepository.create({
            type,
            device,
            user,
            parameters,
            status: CommandStatus.PENDING,
            expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
        });

        await this.commandRepository.save(command);

        this.logger.log(`Command created: ${command.id} (${type}) for device ${device.name}`);

        // Try to send immediately
        await this.sendCommand(command.id);

        return command;
    }

    /**
     * Safety check: Can we cut the engine?
     */
    private async canCutEngine(device: Device): Promise<boolean> {
        // Get latest position
        const latestPosition = await this.positionRepository.findOne({
            where: { device_id: device.id },
            order: { fix_time: 'DESC' },
        });

        if (!latestPosition) {
            // No position data, allow (device might be offline)
            return true;
        }

        // Check if vehicle is stopped or moving slowly (< 5 km/h)
        const speed = latestPosition.speed || 0;
        return speed < 5;
    }

    /**
     * Send command to device
     */
    async sendCommand(commandId: string): Promise<void> {
        const command = await this.commandRepository.findOne({
            where: { id: commandId },
            relations: ['device'],
        });

        if (!command) {
            throw new NotFoundException(`Command ${commandId} not found`);
        }

        // Check if expired
        if (command.expires_at && new Date() > command.expires_at) {
            await this.updateCommandStatus(commandId, CommandStatus.EXPIRED, 'Command expired');
            return;
        }

        // Get command encoder for device protocol
        const encoder = CommandEncoderFactory.getEncoder(command.device.protocol);

        try {
            const encodedCommand = encoder.encodeCommand(command);

            // Send via GPS gateway
            const sent = await this.gpsGateway.sendCommandToDevice(
                command.device.unique_id,
                encodedCommand,
            );

            if (sent) {
                await this.updateCommandStatus(commandId, CommandStatus.SENT);
                this.logger.log(`Command sent: ${commandId}`);
            } else {
                await this.updateCommandStatus(
                    commandId,
                    CommandStatus.FAILED,
                    'Device not connected',
                );
            }
        } catch (error) {
            this.logger.error(`Failed to send command ${commandId}: ${error.message}`);
            await this.updateCommandStatus(commandId, CommandStatus.FAILED, error.message);
        }
    }

    /**
     * Update command status
     */
    async updateCommandStatus(
        commandId: string,
        status: CommandStatus,
        errorMessage?: string,
    ): Promise<void> {
        const updateData: any = { status };

        if (status === CommandStatus.SENT) {
            updateData.sent_at = new Date();
        } else if (status === CommandStatus.ACKNOWLEDGED) {
            updateData.acknowledged_at = new Date();
        } else if (status === CommandStatus.FAILED || status === CommandStatus.EXPIRED) {
            updateData.error_message = errorMessage;
        }

        await this.commandRepository.update(commandId, updateData);
    }

    /**
     * Get command history for a device
     */
    async getCommandHistory(deviceId: number, limit: number = 50): Promise<Command[]> {
        return this.commandRepository.find({
            where: { device: { id: deviceId } },
            relations: ['user', 'device'],
            order: { created_at: 'DESC' },
            take: limit,
        });
    }

    /**
     * Get command by ID
     */
    async getCommand(commandId: string): Promise<Command> {
        const command = await this.commandRepository.findOne({
            where: { id: commandId },
            relations: ['user', 'device'],
        });

        if (!command) {
            throw new NotFoundException(`Command ${commandId} not found`);
        }

        return command;
    }
}
