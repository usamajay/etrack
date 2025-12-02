import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GpsModule } from './gps/gps.module';
import { DevicesModule } from './devices/devices.module';
import { EventsModule } from './events/events.module';
import { GeofencesModule } from './geofences/geofences.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AlertsModule } from './alerts/alerts.module';
import { CommandsModule } from './commands/commands.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'etrack',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Set to false in production
    }),
    UsersModule,
    AuthModule,
    GpsModule,
    DevicesModule,
    EventsModule,
    GeofencesModule,
    NotificationsModule,
    AlertsModule,
    CommandsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
