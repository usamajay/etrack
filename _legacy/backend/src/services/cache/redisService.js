const Redis = require('ioredis');

class RedisService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.useMemory = false;
        this.memoryCache = new Map();
    }

    async connect() {
        if (this.client || this.useMemory) return;

        // Try connecting to Redis, but fallback to memory if it fails
        this.client = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            lazyConnect: true, // Don't connect immediately
            retryStrategy: (times) => {
                if (times > 3) {
                    return null; // Stop retrying
                }
                return Math.min(times * 50, 2000);
            }
        });

        this.client.on('connect', () => {
            console.log('✅ Redis connected');
            this.isConnected = true;
        });

        this.client.on('error', (err) => {
            // Suppress errors
        });

        try {
            await this.client.connect();
        } catch (error) {
            console.warn('⚠️ Redis connection failed. Switching to In-Memory Cache.');
            this.useMemory = true;
            this.client.disconnect();
            this.client = null;
        }
    }

    async set(key, value, expireSeconds = 3600) {
        if (!this.client && !this.useMemory) await this.connect();

        const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;

        if (this.useMemory) {
            this.memoryCache.set(key, stringValue);
            setTimeout(() => {
                this.memoryCache.delete(key);
            }, expireSeconds * 1000);
            return;
        }

        if (this.client) {
            try {
                await this.client.set(key, stringValue, 'EX', expireSeconds);
            } catch (e) {
                this.useMemory = true;
                this.memoryCache.set(key, stringValue);
            }
        }
    }

    async get(key) {
        if (!this.client && !this.useMemory) await this.connect();

        let value;
        if (this.useMemory) {
            value = this.memoryCache.get(key);
        } else if (this.client) {
            try {
                value = await this.client.get(key);
            } catch (e) {
                this.useMemory = true;
                value = this.memoryCache.get(key);
            }
        }

        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    }

    async delete(key) {
        if (this.useMemory) {
            this.memoryCache.delete(key);
        } else if (this.client) {
            await this.client.del(key);
        }
    }

    async setHash(key, field, value) {
        const compositeKey = `${key}:${field}`;
        await this.set(compositeKey, value);
    }

    async getHash(key, field) {
        const compositeKey = `${key}:${field}`;
        return await this.get(compositeKey);
    }

    async cacheVehiclePosition(vehicleId, position) {
        await this.set(`vehicle:${vehicleId}:position`, position, 300);
    }

    async getCachedPosition(vehicleId) {
        return await this.get(`vehicle:${vehicleId}:position`);
    }

    async publish(channel, message) {
        if (!this.client && !this.useMemory) await this.connect();

        if (this.useMemory) {
            console.warn(`[RedisService] Publish to '${channel}' ignored (In-Memory Mode)`);
            return;
        }

        if (this.client) {
            try {
                await this.client.publish(channel, message);
            } catch (e) {
                console.warn(`[RedisService] Publish failed: ${e.message}`);
            }
        }
    }
}

module.exports = new RedisService();
