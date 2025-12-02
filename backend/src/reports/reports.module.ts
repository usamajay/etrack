import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Position } from '../entities/Position.entity';
import { Event } from '../entities/Event.entity';
import { Device } from '../entities/Device.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Position, Event, Device])],
    providers: [ReportsService],
    controllers: [ReportsController],
    exports: [ReportsService],
})
export class ReportsModule { }
