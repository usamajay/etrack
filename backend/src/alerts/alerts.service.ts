import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Event, EventType } from '../entities/Event.entity';
import { AlertRule } from '../entities/AlertRule.entity';
import { Device } from '../entities/Device.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AlertsService {
    private readonly logger = new Logger(AlertsService.name);

    constructor(
        @InjectRepository(Event)
        private eventsRepository: Repository<Event>,
        @InjectRepository(AlertRule)
        private alertRulesRepository: Repository<AlertRule>,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
        private notificationsService: NotificationsService,
    ) { }

    /**
     * Track geofence state for a device
     * Returns true if state changed (entered or exited)
     */
    async trackGeofenceState(
        deviceId: number,
        geofenceId: string,
        isInside: boolean,
    ): Promise<{ changed: boolean; previousState: boolean | null; eventType: EventType | null }> {
        const cacheKey = `geofence_state:${deviceId}:${geofenceId}`;
        const cachedValue = await this.cacheManager.get<boolean>(cacheKey);
        const previousState: boolean | null = cachedValue !== undefined ? cachedValue : null;

        // Set new state with 24h TTL
        await this.cacheManager.set(cacheKey, isInside, 86400000);

        if (previousState === null) {
            // First time seeing this device-geofence pair
            return { changed: false, previousState: null, eventType: null };
        }

        if (previousState !== isInside) {
            const eventType = isInside ? EventType.GEOFENCE_ENTER : EventType.GEOFENCE_EXIT;
            return { changed: true, previousState, eventType };
        }

        return { changed: false, previousState, eventType: null };
    }

    /**
     * Create an event in the database
     */
    async createEvent(
        type: EventType,
        device: Device,
        data: Record<string, any> = {},
        geofenceId?: string,
        positionId?: number,
    ): Promise<Event> {
        const event = this.eventsRepository.create({
            type,
            device,
            geofence: geofenceId ? { id: geofenceId } as any : null,
            position: positionId ? { id: positionId } as any : null,
            data,
            timestamp: new Date(),
        });

        return this.eventsRepository.save(event);
    }

    /**
     * Check if any alert rules match the event and trigger notifications
     */
    async checkAlertRules(event: Event): Promise<void> {
        // Find all enabled alert rules for this event type
        const rules = await this.alertRulesRepository.find({
            where: { type: event.type, enabled: true },
            relations: ['user', 'devices', 'geofences'],
        });

        for (const rule of rules) {
            if (this.doesRuleMatch(rule, event)) {
                await this.triggerAlert(rule, event);
            }
        }
    }

    /**
     * Check if a rule matches an event
     */
    private doesRuleMatch(rule: AlertRule, event: Event): boolean {
        // Check if rule applies to this device
        if (rule.devices.length > 0) {
            const deviceIds = rule.devices.map(d => d.id);
            if (!deviceIds.includes(event.device.id)) {
                return false;
            }
        }

        // Check if rule applies to this geofence (for geofence events)
        if (event.geofence && rule.geofences.length > 0) {
            const geofenceIds = rule.geofences.map(g => g.id);
            if (!geofenceIds.includes(event.geofence.id)) {
                return false;
            }
        }

        // Check additional conditions (e.g., speed threshold)
        if (rule.conditions.speedThreshold && event.data.speed) {
            if (event.data.speed < rule.conditions.speedThreshold) {
                return false;
            }
        }

        return true;
    }

    /**
     * Trigger notifications for a matched alert rule
     */
    private async triggerAlert(rule: AlertRule, event: Event): Promise<void> {
        this.logger.log(`Triggering alert for rule: ${rule.name} (${rule.id})`);

        const message = this.formatAlertMessage(rule, event);

        for (const channel of rule.notification_channels) {
            try {
                switch (channel) {
                    case 'email':
                        if (rule.notification_config.email) {
                            await this.notificationsService.sendEmail(
                                rule.notification_config.email,
                                `Alert: ${rule.name}`,
                                message,
                            );
                        }
                        break;

                    case 'sms':
                        if (rule.notification_config.sms) {
                            await this.notificationsService.sendSMS(
                                rule.notification_config.sms,
                                message,
                            );
                        }
                        break;

                    case 'push':
                        await this.notificationsService.sendPush(
                            rule.user.id.toString(),
                            `Alert: ${rule.name}`,
                            message,
                        );
                        break;

                    case 'webhook':
                        if (rule.notification_config.webhook) {
                            await this.notificationsService.sendWebhook(
                                rule.notification_config.webhook,
                                { rule, event },
                            );
                        }
                        break;
                }
            } catch (error) {
                this.logger.error(`Failed to send ${channel} notification: ${error.message}`);
            }
        }
    }

    /**
     * Format alert message
     */
    private formatAlertMessage(rule: AlertRule, event: Event): string {
        let message = `Alert: ${rule.name}\n\n`;
        message += `Event Type: ${event.type}\n`;
        message += `Device: ${event.device.name} (${event.device.unique_id})\n`;
        message += `Time: ${event.timestamp.toLocaleString()}\n`;

        if (event.geofence) {
            message += `Geofence: ${event.geofence.name || event.geofence.id}\n`;
        }

        if (event.data.speed) {
            message += `Speed: ${event.data.speed} km/h\n`;
        }

        if (event.data.latitude && event.data.longitude) {
            message += `Location: ${event.data.latitude}, ${event.data.longitude}\n`;
        }

        return message;
    }
}
