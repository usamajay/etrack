import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Button,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Card,
    CardContent,
    IconButton,
    CircularProgress
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot
} from '@mui/lab';
import {
    Map as MapIcon,
    History as HistoryIcon,
    Send as SendIcon,
    DirectionsCar as CarIcon,
    Speed as SpeedIcon,
    Warning as AlertIcon,
    LocationOn as LocationIcon,
    AccessTime as TimeIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { vehiclesAPI, analyticsAPI, tripsAPI, alertsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const VehicleDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();

    const [vehicle, setVehicle] = useState(null);
    const [position, setPosition] = useState(null);
    const [stats, setStats] = useState({ distance: 0, trips: 0, alerts: 0 });
    const [recentTrips, setRecentTrips] = useState([]);
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [address, setAddress] = useState('Fetching address...');

    useEffect(() => {
        fetchVehicleData();
    }, [id]);

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = (data) => {
            if (data.vehicleId === id) {
                setPosition(data.position);
                // Optionally update address here if you have a reverse geocoding service
            }
        };

        socket.on('position_update', handleUpdate);
        return () => socket.off('position_update', handleUpdate);
    }, [socket, id]);

    // Reverse geocoding effect (mocked for now or use OpenStreetMap Nominatim)
    useEffect(() => {
        if (position) {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.latitude}&lon=${position.longitude}`)
                .then(res => res.json())
                .then(data => setAddress(data.display_name))
                .catch(() => setAddress('Address not available'));
        }
    }, [position]);

    const fetchVehicleData = async () => {
        setLoading(true);
        try {
            const [vehicleRes, positionRes, statsRes, tripsRes, alertsRes] = await Promise.allSettled([
                vehiclesAPI.getOne(id),
                vehiclesAPI.getPosition(id),
                analyticsAPI.getVehicleStats(id, 'today'),
                tripsAPI.getAll({ vehicle_id: id, limit: 5 }),
                alertsAPI.getAll({ vehicle_id: id, limit: 5 })
            ]);

            if (vehicleRes.status === 'fulfilled') setVehicle(vehicleRes.value.data);
            if (positionRes.status === 'fulfilled') setPosition(positionRes.value.data);
            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            if (tripsRes.status === 'fulfilled') setRecentTrips(tripsRes.value.data);
            if (alertsRes.status === 'fulfilled') setRecentAlerts(alertsRes.value.data);

        } catch (error) {
            console.error('Error fetching vehicle details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!vehicle) {
        return <Typography>Vehicle not found</Typography>;
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/vehicles')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h4" fontWeight="bold">{vehicle.name}</Typography>
                    <Typography variant="subtitle1" color="textSecondary">{vehicle.registration_number}</Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="contained" startIcon={<MapIcon />} sx={{ mr: 1 }}>Locate Now</Button>
                <Button variant="outlined" startIcon={<HistoryIcon />} sx={{ mr: 1 }}>History</Button>
                <Button variant="outlined" startIcon={<SendIcon />}>Command</Button>
            </Box>

            <Grid container spacing={3}>
                {/* Info Card */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Vehicle Information</Typography>
                        <List>
                            <ListItem disablePadding sx={{ py: 1 }}>
                                <ListItemText primary="Model" secondary={vehicle.model || 'N/A'} />
                            </ListItem>
                            <Divider />
                            <ListItem disablePadding sx={{ py: 1 }}>
                                <ListItemText primary="Color" secondary={vehicle.color || 'N/A'} />
                            </ListItem>
                            <Divider />
                            <ListItem disablePadding sx={{ py: 1 }}>
                                <ListItemText primary="Device IMEI" secondary={vehicle.Device?.imei || 'Not Assigned'} />
                            </ListItem>
                            <Divider />
                            <ListItem disablePadding sx={{ py: 1 }}>
                                <ListItemText
                                    primary="Status"
                                    secondary={
                                        <Chip
                                            label={vehicle.is_active ? 'Active' : 'Inactive'}
                                            color={vehicle.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    }
                                />
                            </ListItem>
                        </List>
                    </Paper>
                </Grid>

                {/* Status & Map */}
                <Grid item xs={12} md={8}>
                    <Grid container spacing={3}>
                        {/* Stats Cards */}
                        <Grid item xs={12} sm={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Today's Distance</Typography>
                                    <Typography variant="h5">{stats.distance || 0} km</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Trips</Typography>
                                    <Typography variant="h5">{stats.trips || 0}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Alerts</Typography>
                                    <Typography variant="h5" color="error">{stats.alerts || 0}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Map & Location */}
                        <Grid item xs={12}>
                            <Paper elevation={2} sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <LocationIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="body1">{address}</Typography>
                                </Box>
                                <Box sx={{ flexGrow: 1, borderRadius: 1, overflow: 'hidden' }}>
                                    {position ? (
                                        <MapContainer
                                            center={[position.latitude, position.longitude]}
                                            zoom={15}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            />
                                            <Marker position={[position.latitude, position.longitude]}>
                                                <Popup>{vehicle.name}</Popup>
                                            </Marker>
                                        </MapContainer>
                                    ) : (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: '#f5f5f5' }}>
                                            <Typography color="textSecondary">No position data available</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Recent Trips */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Recent Trips</Typography>
                        {recentTrips.length > 0 ? (
                            <List>
                                {recentTrips.map((trip) => (
                                    <ListItem key={trip.id}>
                                        <ListItemIcon><CarIcon /></ListItemIcon>
                                        <ListItemText
                                            primary={`${new Date(trip.start_time).toLocaleString()} - ${new Date(trip.end_time).toLocaleTimeString()}`}
                                            secondary={`Distance: ${trip.distance} km | Duration: ${trip.duration} min`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography color="textSecondary">No recent trips</Typography>
                        )}
                    </Paper>
                </Grid>

                {/* Recent Alerts */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Recent Alerts</Typography>
                        {recentAlerts.length > 0 ? (
                            <Timeline>
                                {recentAlerts.map((alert) => (
                                    <TimelineItem key={alert.id}>
                                        <TimelineSeparator>
                                            <TimelineDot color="error" />
                                            <TimelineConnector />
                                        </TimelineSeparator>
                                        <TimelineContent>
                                            <Typography variant="subtitle2">{alert.type}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(alert.timestamp).toLocaleString()}
                                            </Typography>
                                        </TimelineContent>
                                    </TimelineItem>
                                ))}
                            </Timeline>
                        ) : (
                            <Typography color="textSecondary">No recent alerts</Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default VehicleDetails;
