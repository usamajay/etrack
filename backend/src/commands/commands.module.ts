import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandsService } from './commands.service';
import { CommandsController } from './commands.controller';
import { Command } from '../entities/Command.entity';
import { Device } from '../entities/Device.entity';
import { Position } from '../entities/Position.entity';
import { GpsModule } from '../gps/gps.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Command, Device, Position]),
        GpsModule,
    ],
    providers: [CommandsService],
    controllers: [CommandsController],
    exports: [CommandsService],
})
export class CommandsModule { }
