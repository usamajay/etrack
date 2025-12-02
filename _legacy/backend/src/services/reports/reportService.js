const { Trip, Position, Alert, Vehicle } = require('../../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../models');

class ReportService {

    /**
     * Daily Report: Summary + List of trips
     */
    async generateDailyReport(vehicleId, date) {
        // Fetch ALL trips for vehicle to avoid SQLite date comparison issues
        const allTrips = await Trip.findAll({
            where: { vehicle_id: vehicleId }
        });

        const targetDate = new Date(date).toISOString().split('T')[0];

        const trips = allTrips.filter(trip => {
            const tripDate = new Date(trip.start_time).toISOString().split('T')[0];
            return tripDate === targetDate;
        });

        const totalDistance = trips.reduce((sum, trip) => sum + parseFloat(trip.distance || 0), 0);
        const totalDuration = trips.reduce((sum, trip) => sum + parseInt(trip.duration || 0), 0);
        const maxSpeed = Math.max(...trips.map(t => parseFloat(t.max_speed || 0)), 0);

        return {
            summary: {
                total_distance: totalDistance.toFixed(2),
                total_duration: totalDuration,
                max_speed: maxSpeed,
                trip_count: trips.length
            },
            trips: trips
        };
    }

    /**
     * Weekly Report: Summary + Daily Breakdown
     */
    async generateWeeklyReport(vehicleId, startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        end.setHours(23, 59, 59, 999);

        // Fetch ALL trips
        const allTrips = await Trip.findAll({
            where: { vehicle_id: vehicleId }
        });

        const trips = allTrips.filter(trip => {
            const t = new Date(trip.start_time);
            return t >= start && t <= end;
        });

        // Aggregate in JS
        const dailyStats = {};
        let totalDistance = 0;
        let totalDuration = 0;
        let overallMaxSpeed = 0;

        trips.forEach(trip => {
            const dateStr = new Date(trip.start_time).toISOString().split('T')[0];
            if (!dailyStats[dateStr]) {
                dailyStats[dateStr] = { date: dateStr, distance: 0, duration: 0, max_speed: 0, trip_count: 0 };
            }

            const dist = parseFloat(trip.distance || 0);
            const dur = parseInt(trip.duration || 0);
            const speed = parseFloat(trip.max_speed || 0);

            dailyStats[dateStr].distance += dist;
            dailyStats[dateStr].duration += dur;
            dailyStats[dateStr].trip_count += 1;
            dailyStats[dateStr].max_speed = Math.max(dailyStats[dateStr].max_speed, speed);

            totalDistance += dist;
            totalDuration += dur;
            overallMaxSpeed = Math.max(overallMaxSpeed, speed);
        });

        // Fill in missing days
        const statsArray = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            statsArray.push(dailyStats[dateStr] || {
                date: dateStr, distance: 0, duration: 0, max_speed: 0, trip_count: 0
            });
        }

        return {
            summary: {
                total_distance: totalDistance.toFixed(2),
                total_duration: totalDuration,
                max_speed: overallMaxSpeed,
                trip_count: trips.length
            },
            daily_stats: statsArray,
            trips: trips
        };
    }

    /**
     * Monthly Report: Summary + Daily Breakdown
     */
    async generateMonthlyReport(vehicleId, month, year) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        end.setHours(23, 59, 59, 999);

        // Fetch ALL trips
        const allTrips = await Trip.findAll({
            where: { vehicle_id: vehicleId }
        });

        const trips = allTrips.filter(trip => {
            const t = new Date(trip.start_time);
            return t >= start && t <= end;
        });

        // Aggregate in JS
        const dailyStats = {};
        let totalDistance = 0;
        let totalDuration = 0;
        let overallMaxSpeed = 0;

        trips.forEach(trip => {
            const dateStr = new Date(trip.start_time).toISOString().split('T')[0];
            if (!dailyStats[dateStr]) {
                dailyStats[dateStr] = { date: dateStr, distance: 0, duration: 0, max_speed: 0, trip_count: 0 };
            }

            const dist = parseFloat(trip.distance || 0);
            const dur = parseInt(trip.duration || 0);
            const speed = parseFloat(trip.max_speed || 0);

            dailyStats[dateStr].distance += dist;
            dailyStats[dateStr].duration += dur;
            dailyStats[dateStr].trip_count += 1;
            dailyStats[dateStr].max_speed = Math.max(dailyStats[dateStr].max_speed, speed);

            totalDistance += dist;
            totalDuration += dur;
            overallMaxSpeed = Math.max(overallMaxSpeed, speed);
        });

        const statsArray = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));

        return {
            summary: {
                total_distance: totalDistance.toFixed(2),
                total_duration: totalDuration,
                max_speed: overallMaxSpeed,
                trip_count: trips.length
            },
            daily_stats: statsArray,
            trips: trips
        };
    }

    /**
     * Speed Violations Report
     */
    async generateSpeedReport(vehicleId, startDate, endDate) {
        return {};
    }
}

module.exports = new ReportService();
