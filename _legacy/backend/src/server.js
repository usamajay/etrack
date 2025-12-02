require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/database');
require('./models'); // Import models to trigger associations

// Import Routes
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const positionRoutes = require('./routes/positions');
const tripRoutes = require('./routes/trips');
const geofenceRoutes = require('./routes/geofences');
const alertRoutes = require('./routes/alerts');
const commandRoutes = require('./routes/commands');
const reportRoutes = require('./routes/reports');
const deviceRoutes = require('./routes/devices');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const organizationRoutes = require('./routes/organizations');
const healthRoutes = require('./routes/health');

const socketService = require('./services/websocket/socketService');
const schedulerService = require('./services/schedule/schedulerService');
require('./services/backup/backupService'); // Initialize backup service

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize Services
socketService.initialize(io);
schedulerService.startScheduler();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/geofences', geofenceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/commands', commandRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/health', healthRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('GPS Tracking System Backend is running');
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

// Start Server
const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    server.listen(PORT, () => {
      console.log(`✅ HTTP Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server };
