import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    CircularProgress,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    DirectionsCar as CarIcon,
    Speed as SpeedIcon,
    Map as MapIcon,
    Timeline as TimelineIcon,
    Warning as AlertIcon,
    Add as AddIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { analyticsAPI, alertsAPI } from '../services/api';
import FleetStatusChart from '../components/Charts/FleetStatusChart';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const StatCard = ({ title, value, icon, color }) => (
    <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main`, mr: 2 }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="h5" fontWeight="bold">{value}</Typography>
            <Typography variant="body2" color="textSecondary">{title}</Typography>
        </Box>
    </Paper>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [stats, setStats] = useState(null);
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, alertsRes] = await Promise.all([
                    analyticsAPI.getOrganizationStats(),
                    alertsAPI.getAll({ limit: 5 })
                ]);
                setStats(statsRes.data);
                setRecentAlerts(alertsRes.data || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const pieData = [
        { name: 'Moving', value: stats?.fleet_status?.moving || 0 },
        { name: 'Idle', value: stats?.fleet_status?.idle || 0 },
        { name: 'Stopped', value: stats?.fleet_status?.stopped || 0 },
        { name: 'Offline', value: stats?.fleet_status?.offline || 0 },
    ];

    return (
        <Box sx={{ pb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" fontWeight="bold">Dashboard</Typography>
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/vehicles/new')}
                        sx={{ mr: 2 }}
                    >
                        Add Vehicle
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate('/map')}
                    >
                        View Map
                    </Button>
                </Box>
            </Box>

            {/* Stats Grid - Using columns=10 for 5 items per row on md+ */}
            <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 10 }} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard
                        title="Total Vehicles"
                        value={stats?.total_vehicles || 0}
                        icon={<CarIcon />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard
                        title="Active Now"
                        value={stats?.active_devices || 0}
                        icon={<SpeedIcon />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard
                        title="Today's Distance"
                        value={`${stats?.total_distance || 0} km`}
                        icon={<MapIcon />}
                        color="info"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard
                        title="Today's Trips"
                        value={stats?.today_trips || 0}
                        icon={<TimelineIcon />}
                        color="secondary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard
                        title="Unread Alerts"
                        value={stats?.unread_alerts || 0}
                        icon={<AlertIcon />}
                        color="error"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <FleetStatusChart
                        data={[
                            { name: 'Moving', value: stats?.fleet_status?.moving || 0, color: '#0088FE' },
                            { name: 'Idle', value: stats?.fleet_status?.idle || 0, color: '#00C49F' },
                            { name: 'Stopped', value: stats?.fleet_status?.stopped || 0, color: '#FFBB28' },
                            { name: 'Offline', value: stats?.fleet_status?.offline || 0, color: '#FF8042' },
                        ]}
                        onFilter={(status) => console.log('Filter by:', status)}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper elevation={2} sx={{ p: 3, height: 450, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Recent Alerts</Typography>
                            <Button size="small" onClick={() => navigate('/alerts')}>View All</Button>
                        </Box>
                        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
                            <List>
                                {recentAlerts.length > 0 ? (
                                    recentAlerts.map((alert, index) => (
                                        <React.Fragment key={alert.id}>
                                            <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    <AlertIcon color={alert.severity === 'high' ? 'error' : 'warning'} fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle2" component="span">
                                                            {alert.type}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <React.Fragment>
                                                            <Typography component="span" variant="body2" color="text.primary" display="block">
                                                                {alert.vehicle_name}
                                                            </Typography>
                                                            <Typography component="span" variant="caption" color="text.secondary">
                                                                {new Date(alert.timestamp).toLocaleTimeString()}
                                                            </Typography>
                                                        </React.Fragment>
                                                    }
                                                />
                                            </ListItem>
                                            {index < recentAlerts.length - 1 && <Divider component="li" />}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <Typography variant="body2" color="textSecondary">
                                            No recent alerts
                                        </Typography>
                                    </Box>
                                )}
                            </List>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
