const jwt = require('jsonwebtoken');
const { User, Organization, Vehicle } = require('../../models');

class SocketService {
    constructor() {
        this.io = null;
    }

    initialize(io) {
        this.io = io;

        // Middleware for authentication
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
                if (!token) {
                    return next(new Error('Authentication error'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findByPk(decoded.id);

                if (!user) {
                    return next(new Error('User not found'));
                }

                socket.user = user;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => this.handleConnection(socket));
    }

    handleConnection(socket) {
        console.log(`Socket connected: ${socket.id}, User: ${socket.user.email}`);

        // Join user to their own room
        socket.join(`user_${socket.user.id}`);

        // Join user to their organization rooms
        this.joinOrganizationRooms(socket);

        socket.on('subscribe_vehicle', (vehicleId) => this.handleSubscribe(socket, vehicleId));
        socket.on('unsubscribe_vehicle', (vehicleId) => this.handleUnsubscribe(socket, vehicleId));

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    }

    async joinOrganizationRooms(socket) {
        try {
            const organizations = await Organization.findAll({
                where: { owner_id: socket.user.id },
                attributes: ['id']
            });

            organizations.forEach(org => {
                socket.join(`org_${org.id}`);
            });
        } catch (error) {
            console.error('Error joining org rooms:', error);
        }
    }

    handleSubscribe(socket, vehicleId) {
        // In a real app, verify access to vehicleId before joining
        console.log(`Socket ${socket.id} subscribing to vehicle ${vehicleId}`);
        socket.join(`vehicle_${vehicleId}`);
    }

    handleUnsubscribe(socket, vehicleId) {
        console.log(`Socket ${socket.id} unsubscribing from vehicle ${vehicleId}`);
        socket.leave(`vehicle_${vehicleId}`);
    }

    broadcastPosition(vehicleId, position) {
        if (this.io) {
            this.io.to(`vehicle_${vehicleId}`).emit('position_update', {
                vehicleId,
                position
            });
        }
    }

    broadcastAlert(alert) {
        if (this.io) {
            // Broadcast to the vehicle room
            this.io.to(`vehicle_${alert.vehicle_id}`).emit('new_alert', alert);

            // Also broadcast to the organization room (need to fetch org id first)
            // For efficiency, we might pass orgId to this function or look it up.
            // Assuming we want to notify all users watching this vehicle:
            // this.io.to(`vehicle_${alert.vehicle_id}`).emit('alert', alert);
        }
    }
}

module.exports = new SocketService();
