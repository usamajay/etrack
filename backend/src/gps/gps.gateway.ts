import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as net from 'net';
import * as dgram from 'dgram';
import { ConfigService } from '@nestjs/config';
import { ProtocolFactory } from './protocols/protocol.factory';
import { GpsService } from './gps.service';

@Injectable()
export class GpsGateway implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(GpsGateway.name);
    private tcpServer: net.Server;
    private udpServer: dgram.Socket;
    private deviceConnections: Map<string, net.Socket> = new Map(); // deviceId -> socket

    constructor(
        private readonly configService: ConfigService,
        private readonly protocolFactory: ProtocolFactory,
        private readonly gpsService: GpsService,
    ) { }

    onModuleInit() {
        this.logger.log('GpsGateway: Initializing...');
        this.startTcpServer();
        this.startUdpServer();
    }

    onModuleDestroy() {
        if (this.tcpServer) this.tcpServer.close();
        if (this.udpServer) this.udpServer.close();
    }

    private startTcpServer() {
        const port = this.configService.get<number>('GPS_TCP_PORT') || 5001;
        this.tcpServer = net.createServer((socket) => {
            const connectionId = `${socket.remoteAddress}:${socket.remotePort}`;
            this.logger.log(`TCP connection from ${connectionId}`);

            let buffer = Buffer.alloc(0);

            socket.on('data', async (data) => {
                try {
                    this.logger.debug(`Raw data received: ${data.toString('hex')}`);
                    buffer = Buffer.concat([buffer, data]);
                    this.logger.debug(`Buffer size: ${buffer.length}`);

                    // Detect protocol
                    const protocolName = this.protocolFactory.detectProtocol(buffer);
                    if (!protocolName) {
                        this.logger.debug('Protocol not detected yet, waiting for more data...');
                        return;
                    }

                    this.logger.debug(`Detected protocol: ${protocolName}`);
                    const decoder = this.protocolFactory.getDecoder(protocolName);

                    // Decode
                    const result = await decoder.decode(buffer);
                    this.logger.debug(`Decode result: ${JSON.stringify(result)}`);

                    if (result.success) {
                        // Remove processed bytes
                        buffer = buffer.slice(result.bytesConsumed);

                        // Process positions
                        for (const position of result.positions) {
                            this.logger.debug(`Processing position for device: ${position.deviceId}`);
                            await this.gpsService.processData(position, socket);

                            // Register device connection
                            if (position.deviceId) {
                                this.registerDeviceConnection(position.deviceId, socket);
                            }
                        }

                        // Send response
                        if (result.response) {
                            socket.write(result.response);
                            this.logger.debug(`Sent response: ${result.response.toString('hex')}`);
                        }
                    } else {
                        // If decoding failed but we consumed bytes (e.g. bad packet), slice buffer
                        if (result.bytesConsumed > 0) {
                            buffer = buffer.slice(result.bytesConsumed);
                        }
                    }
                } catch (error) {
                    this.logger.error(`Error processing TCP data: ${error.message}`, error.stack);
                    buffer = Buffer.alloc(0); // Clear buffer on error
                }
            });


            socket.on('error', (err) => this.logger.error(`TCP Socket error: ${err.message}`));
            socket.on('close', () => {
                this.logger.log('TCP connection closed');
                // Remove from device connections
                for (const [deviceId, sock] of this.deviceConnections.entries()) {
                    if (sock === socket) {
                        this.deviceConnections.delete(deviceId);
                        this.logger.log(`Device ${deviceId} disconnected`);
                        break;
                    }
                }
            });
        });

        this.tcpServer.listen(port, '0.0.0.0', () => {
            this.logger.log(`GPS TCP Server listening on port ${port}`);
        });
    }

    private startUdpServer() {
        const port = this.configService.get<number>('GPS_UDP_PORT') || 5002;
        this.udpServer = dgram.createSocket('udp4');

        this.udpServer.on('message', async (msg, rinfo) => {
            this.logger.debug(`UDP message from ${rinfo.address}:${rinfo.port}`);
            try {
                const protocolName = this.protocolFactory.detectProtocol(msg);
                if (protocolName) {
                    const decoder = this.protocolFactory.getDecoder(protocolName);
                    const result = await decoder.decode(msg);

                    if (result.success) {
                        for (const position of result.positions) {
                            await this.gpsService.processData(position, null);
                        }

                        if (result.response) {
                            this.udpServer.send(result.response, rinfo.port, rinfo.address);
                        }
                    }
                } else {
                    this.logger.warn('Unknown UDP protocol');
                }
            } catch (error) {
                this.logger.error(`Error parsing UDP message: ${error.message}`);
            }
        });

        this.udpServer.on('listening', () => {
            const address = this.udpServer.address();
            this.logger.log(`GPS UDP Server listening on ${address.address}:${address.port}`);
        });

        this.udpServer.bind(port);
    }

    /**
     * Register a device connection
     */
    registerDeviceConnection(deviceId: string, socket: net.Socket): void {
        this.deviceConnections.set(deviceId, socket);
        this.logger.log(`Device ${deviceId} registered`);
    }

    /**
     * Send command to device
     */
    async sendCommandToDevice(deviceId: string, commandBuffer: Buffer): Promise<boolean> {
        const socket = this.deviceConnections.get(deviceId);

        if (!socket || socket.destroyed) {
            this.logger.warn(`Device ${deviceId} not connected`);
            return false;
        }

        try {
            socket.write(commandBuffer);
            this.logger.log(`Command sent to device ${deviceId}: ${commandBuffer.toString('hex')}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send command to device ${deviceId}: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if device is connected
     */
    isDeviceConnected(deviceId: string): boolean {
        const socket = this.deviceConnections.get(deviceId);
        return socket !== undefined && !socket.destroyed;
    }
}
