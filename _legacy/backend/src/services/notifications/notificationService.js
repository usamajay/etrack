const nodemailer = require('nodemailer');

class NotificationService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.example.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER || 'user',
                pass: process.env.SMTP_PASS || 'pass'
            }
        });
    }

    async sendEmail(to, subject, body) {
        try {
            if (process.env.NODE_ENV === 'test') return; // Skip in test mode

            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"GPS Tracker" <noreply@gpstracker.com>',
                to,
                subject,
                html: body
            });
            console.log('Message sent: %s', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    async sendSMS(phone, message) {
        // Placeholder for SMS integration (e.g., Twilio)
        console.log(`[SMS] To: ${phone}, Message: ${message}`);
        // await twilioClient.messages.create({ ... });
    }

    async sendPushNotification(userId, title, message) {
        // Placeholder for Push Notification (e.g., Firebase FCM)
        console.log(`[PUSH] User: ${userId}, Title: ${title}, Msg: ${message}`);
    }

    async notifyAlert(alert) {
        // Logic to determine who to notify based on alert settings
        // For now, log it
        console.log(`[ALERT NOTIFICATION] Type: ${alert.type}, Msg: ${alert.message}`);

        // Example: Send email to admin
        // await this.sendEmail('admin@example.com', `New Alert: ${alert.type}`, `<p>${alert.message}</p>`);
    }

    async notifyGeofenceViolation(vehicle, geofence) {
        const message = `Vehicle ${vehicle.name} entered/exited geofence ${geofence.name}`;
        console.log(`[GEOFENCE NOTIFICATION] ${message}`);
        // await this.sendPushNotification(vehicle.owner_id, 'Geofence Alert', message);
    }
}

module.exports = new NotificationService();
