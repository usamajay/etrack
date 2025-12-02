import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AlertsService } from './alerts.service';
import { Event } from '../entities/Event.entity';
import { AlertRule } from '../entities/AlertRule.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Event, AlertRule]),
        CacheModule.register({
            ttl: 86400, // 24 hours default
            max: 10000, // max items in cache
        }),
        NotificationsModule,
    ],
    providers: [AlertsService],
    exports: [AlertsService],
})
export class AlertsModule { }
