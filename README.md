# GPS Tracking System (etrack)

A complete GPS tracking solution with a Node.js backend, supporting real-time tracking, geofencing, alerts, and reporting.

## Project Structure

- `backend/`: Node.js API Server and GPS TCP Server
- `web-dashboard/`: React Web Application (Planned)
- `mobile-app/`: React Native Mobile App (Planned)

## Prerequisites

Before running the backend, ensure you have the following installed:

1.  **Node.js** (v14+)
2.  **PostgreSQL** (v12+)
3.  **Redis** (v6+)

## Backend Setup

1.  **Navigate to backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    - Copy `.env.example` to `.env`:
      ```bash
      cp .env.example .env
      ```
    - **IMPORTANT:** Update `.env` with your actual PostgreSQL credentials and Redis configuration.
      ```env
      DATABASE_URL=postgresql://your_db_user:your_db_password@localhost:5432/your_db_name
      ```

4.  **Database Setup:**
    - Create the database (e.g., `gps_tracking`) in PostgreSQL.
    - Run the migration script to sync tables and seed initial data:
      ```bash
      node src/scripts/migrate.js
      ```

## Running the Application

### 1. API Server
Runs the REST API and WebSocket server.

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```
*Port: 3000 (default)*

### 2. GPS TCP Server
Runs the TCP server to handle GPS device connections (GT06 protocol).

```bash
node src/protocols/gpsServer.js
```
*Port: 5023 (default)*

## Features

- **Real-time Tracking:** WebSocket updates for vehicle positions.
- **Device Management:** Register and manage GPS trackers.
- **Geofencing:** Circular and Polygon geofences with alerts.
- **Alerts:** Speeding, Offline, and Geofence violations.
- **Reports:** Daily, Weekly, and Monthly activity reports.
- **Command System:** Send remote commands (Cut Engine, Locate) to devices.

## API Documentation

- **Auth:** `/api/auth` (Login, Register)
- **Vehicles:** `/api/vehicles` (CRUD)
- **Positions:** `/api/positions` (History, Latest)
- **Trips:** `/api/trips` (Stats, History)
- **Geofences:** `/api/geofences`
- **Alerts:** `/api/alerts`
- **Reports:** `/api/reports`
- **Devices:** `/api/devices`
- **Commands:** `/api/commands`

## Troubleshooting

- **Redis Connection Error:** Ensure Redis is running (`redis-server`).
- **Database Connection Error:** Check `DATABASE_URL` in `.env` and ensure PostgreSQL is running.
