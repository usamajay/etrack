import io from 'socket.io-client';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect(token) {
        if (this.socket?.connected) return;

        // Use REACT_APP_SOCKET_URL if available, otherwise fallback to localhost:5000
        // If REACT_APP_API_URL is defined, we might need to strip '/api' if it's included, 
        // but safest is a dedicated var or default.
        const url = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

        this.socket = io(url, {
            auth: { token },
            transports: ['websocket'],
            autoConnect: true
        });

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        this.socket.on('connect_error', (err) => {
            console.error('WebSocket connection error:', err);
        });

        // Re-attach listeners if any were added before connection
        this.listeners.forEach((callbacks, event) => {
            callbacks.forEach(callback => {
                this.socket.on(event, callback);
            });
        });

        // Handle specific events requested
        this.socket.on('position:update', (data) => {
            // Listeners for 'position:update' are already attached via 'on' method
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    subscribeToVehicle(vehicleId) {
        if (this.socket) {
            this.socket.emit('subscribe', { room: `vehicle:${vehicleId}` });
        }
    }

    unsubscribeFromVehicle(vehicleId) {
        if (this.socket) {
            this.socket.emit('unsubscribe', { room: `vehicle:${vehicleId}` });
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }

        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;
