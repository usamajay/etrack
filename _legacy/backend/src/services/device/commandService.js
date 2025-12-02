const { Command, Device } = require('../../models');
const redisService = require('../cache/redisService');

class CommandService {

    /**
     * Create command in database
     */
    async createCommand(deviceId, type) {
        try {
            return await Command.create({
                device_id: deviceId,
                type,
                status: 'pending',
                sent_at: null
            });
        } catch (error) {
            console.error('Error creating command:', error);
            throw error;
        }
    }

    /**
     * Send command to device through GPS server connection
     */
    async sendCommand(commandId) {
        try {
            const command = await Command.findByPk(commandId, {
                include: [{ model: Device }]
            });

            if (!command) throw new Error('Command not found');

            const packet = this.buildCommandPacket(command.type);

            // Publish to Redis for GPS Server to pick up
            await redisService.publish('device_commands', JSON.stringify({
                imei: command.Device.imei,
                commandPacket: packet.toString('hex')
            }));

            await command.update({
                status: 'sent',
                sent_at: new Date()
            });

            return command;
        } catch (error) {
            console.error('Error sending command:', error);
            throw error;
        }
    }

    /**
     * Update command with device response
     */
    async handleCommandResponse(commandId, response) {
        try {
            const command = await Command.findByPk(commandId);
            if (command) {
                await command.update({
                    status: 'acknowledged', // or 'failed' based on response
                    acknowledged_at: new Date(),
                    response
                });
            }
        } catch (error) {
            console.error('Error handling command response:', error);
        }
    }

    /**
     * Get pending commands for device
     */
    async getPendingCommands(deviceId) {
        return await Command.findAll({
            where: {
                device_id: deviceId,
                status: 'pending'
            }
        });
    }

    /**
     * Build binary command packet for GT06 protocol
     */
    buildCommandPacket(type) {
        // Example: "RELAY,1#" for lock (cut engine)
        let content = '';
        switch (type) {
            case 'locate':
                content = 'WHERE#';
                break;
            case 'lock':
                content = 'RELAY,1#';
                break;
            case 'unlock':
                content = 'RELAY,0#';
                break;
            case 'restart':
                content = 'RESET#';
                break;
            default:
                content = 'STATUS#';
        }

        return Buffer.from(content);
    }
}

module.exports = new CommandService();
