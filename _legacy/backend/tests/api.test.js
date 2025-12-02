const request = require('supertest');
const { app } = require('../src/server');
const { sequelize } = require('../src/models');

describe('API Health Check', () => {
    it('should return 200 OK on GET /', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('GPS Tracking System Backend is running');
    });
});

describe('Auth API', () => {
    // We need to sync DB before tests, but be careful not to wipe prod data if connected to real DB
    // For this test, we assume a test DB or just test basic validation failures that don't hit DB constraints yet

    it('should return 400 for login with missing credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});
        expect(res.statusCode).toEqual(400); // Or 500 if not handled, but we expect 400/500
    });
});

afterAll(async () => {
    await sequelize.close(); // Close DB connection to allow Jest to exit
});
