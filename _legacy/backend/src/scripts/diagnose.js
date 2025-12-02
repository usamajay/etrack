require('dotenv').config();
const { sequelize } = require('../config/database');
const redisService = require('../services/cache/redisService');
const net = require('net');
const http = require('http');

async function runDiagnostics() {
    console.log('🔍 Starting System Diagnostics...\n');

    // 1. Check Database
    console.log('1️⃣  Checking Database Connection...');
    try {
        await sequelize.authenticate();
        console.log('   ✅ Database connection successful.');
        const dialect = sequelize.getDialect();
        console.log(`   ℹ️  Dialect: ${dialect}`);
        if (dialect === 'sqlite') {
            console.log(`   ℹ️  Storage: ${sequelize.options.storage}`);
        }
    } catch (error) {
        console.error('   ❌ Database connection failed:', error.message);
    }
    console.log('');

    // 2. Check Redis / Cache
    console.log('2️⃣  Checking Cache Service...');
    try {
        await redisService.set('test_key', 'test_value');
        const value = await redisService.get('test_key');
        if (value === 'test_value') {
            console.log('   ✅ Cache Write/Read successful.');
        } else {
            console.error('   ❌ Cache Write/Read mismatch.');
        }
        console.log(`   ℹ️  Mode: ${redisService.useMemory ? 'In-Memory (Fallback)' : 'Redis Server'}`);
    } catch (error) {
        console.error('   ❌ Cache service failed:', error.message);
    }
    console.log('');

    // 3. Check Port Availability
    const PORT = process.env.PORT || 5000;
    console.log(`3️⃣  Checking Port ${PORT}...`);

    const serverTester = net.createServer();
    serverTester.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`   ℹ️  Port ${PORT} is in use (Likely the server is running).`);
            // Try to call the API
            checkApiHealth(PORT);
        } else {
            console.error('   ❌ Port check error:', err.message);
        }
    });

    serverTester.once('listening', () => {
        console.log(`   ⚠️  Port ${PORT} is free. The server is NOT running.`);
        serverTester.close();
    });

    serverTester.listen(PORT);
}

function checkApiHealth(port) {
    console.log('   Testing API Health endpoint...');
    http.get(`http://localhost:${port}/`, (res) => {
        console.log(`   ✅ API responded with status: ${res.statusCode}`);
        res.on('data', (chunk) => {
            console.log(`   ℹ️  Response: ${chunk.toString()}`);
        });
    }).on('error', (e) => {
        console.error(`   ❌ API request failed: ${e.message}`);
    });
}

runDiagnostics();
