const cron = require('node-cron');
const { Device, Alert, Position, Vehicle } = require('../../models');
const { Op } = require('sequelize');
const alertService = require('../alerts/alertService');
const reportService = require('../reports/reportService');

class SchedulerService {

    startScheduler() {
        console.log('⏰ Scheduler Service Started');

        // Check Offline Devices: Every 5 minutes
        cron.schedule('*/5 * * * *', () => {
            this.checkOfflineDevices();
        });

        // Generate Daily Reports: Every day at midnight (00:00)
        cron.schedule('0 0 * * *', () => {
            this.generateDailyReports();
        });

        // Clean Old Positions: Every day at 03:00 AM
        cron.schedule('0 3 * * *', () => {
            this.cleanOldPositions();
        });

        // Clean Old Alerts: Every day at 04:00 AM
        cron.schedule('0 4 * * *', () => {
            this.cleanOldAlerts();
        });
    }

    async checkOfflineDevices() {
        console.log('Running job: checkOfflineDevices');
        try {
            // Find devices not updated in last 30 mins
            const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

            const devices = await Device.findAll({
                where: {
                    last_connection: { [Op.lt]: thirtyMinsAgo },
                    is_active: true
                },
                include: [{ model: Vehicle }]
            });

            for (const device of devices) {
                if (device.Vehicle) {
                    await alertService.checkOfflineAlert(device.Vehicle, device.last_connection);
                }
            }
        } catch (error) {
            console.error('Error in checkOfflineDevices:', error);
        }
    }

    async generateDailyReports() {
        console.log('Running job: generateDailyReports');
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = yesterday.toISOString().split('T')[0];

            const vehicles = await Vehicle.findAll({ where: { is_active: true } });

            for (const vehicle of vehicles) {
                // Just generate and maybe cache/email? 
                // For now, we just run the logic to ensure it works or cache it if we had a report table.
                // Let's just log that we generated it.
                const report = await reportService.generateDailyReport(vehicle.id, dateStr);
                console.log(`Generated daily report for ${vehicle.name}: ${report.total_distance}km`);
            }
        } catch (error) {
            console.error('Error in generateDailyReports:', error);
        }
    }

    async cleanOldPositions() {
        console.log('Running job: cleanOldPositions');
        try {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const result = await Position.destroy({
                where: {
                    timestamp: { [Op.lt]: ninetyDaysAgo }
                }
            });
            console.log(`Deleted ${result} old positions.`);
        } catch (error) {
            console.error('Error in cleanOldPositions:', error);
        }
    }

    async cleanOldAlerts() {
        console.log('Running job: cleanOldAlerts');
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const result = await Alert.destroy({
                where: {
                    is_read: true,
                    timestamp: { [Op.lt]: thirtyDaysAgo }
                }
            });
            console.log(`Deleted ${result} old read alerts.`);
        } catch (error) {
            console.error('Error in cleanOldAlerts:', error);
        }
    }
}

module.exports = new SchedulerService();
