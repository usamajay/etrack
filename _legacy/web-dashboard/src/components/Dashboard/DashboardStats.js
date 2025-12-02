import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
    DirectionsCar as CarIcon,
    Warning as AlertIcon,
    Speed as SpeedIcon,
    Map as DistanceIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
    <Paper elevation={3} sx={{ p: 3, display: 'flex', alignItems: 'center', height: '100%' }}>
        <Box sx={{ p: 2, borderRadius: '50%', bgcolor: `${color}.light`, color: `${color}.main`, mr: 2 }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="h4" fontWeight="bold">{value}</Typography>
            <Typography variant="body2" color="textSecondary">{title}</Typography>
        </Box>
    </Paper>
);

const DashboardStats = ({ stats }) => {
    if (!stats) return null;

    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title="Total Vehicles"
                    value={stats.total_vehicles || 0}
                    icon={<CarIcon fontSize="large" />}
                    color="primary"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title="Active Devices"
                    value={stats.active_devices || 0}
                    icon={<SpeedIcon fontSize="large" />}
                    color="success"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title="Unread Alerts"
                    value={stats.unread_alerts || 0}
                    icon={<AlertIcon fontSize="large" />}
                    color="error"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title="Total Distance (Today)"
                    value={`${stats.total_distance || 0} km`}
                    icon={<DistanceIcon fontSize="large" />}
                    color="info"
                />
            </Grid>
        </Grid>
    );
};

export default DashboardStats;
