import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for MVP
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor() {
    this.logger.log('EventsGateway instantiated');
  }

  emitNewPosition(position: any) {
    this.logger.debug(`Emitting new position for device ${position.serialNumber}`);
    this.server.emit('position', position);
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: any) {
    this.logger.log(`Client joined: ${JSON.stringify(data)}`);
    return 'Joined';
  }
}
