import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    TextField,
    InputAdornment,
    Chip,
    Drawer,
    Fab,
    Tooltip,
    FormControlLabel,
    Switch
} from '@mui/material';
import {
    Search as SearchIcon,
    DirectionsCar as CarIcon,
    MyLocation as MyLocationIcon,
    Menu as MenuIcon,
    Close as CloseIcon,
    Layers as LayersIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { vehiclesAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import VehicleMarker from '../components/Map/VehicleMarker';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to auto-center map
const AutoCenterMap = ({ vehicles, autoCenter }) => {
    const map = useMap();

    useEffect(() => {
        if (autoCenter && vehicles.length > 0) {
            const bounds = L.latLngBounds(vehicles.map(v => [v.position.latitude, v.position.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [vehicles, autoCenter, map]);

    return null;
};

const LiveTracking = () => {
    const socket = useSocket();
    const [vehicles, setVehicles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, moving, stopped, offline
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [autoCenter, setAutoCenter] = useState(true);

    useEffect(() => {
        fetchVehicles();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = (data) => {
            setVehicles(prev => prev.map(v => {
                if (v.id === data.vehicleId) {
                    return { ...v, position: data.position, last_seen: new Date() };
                }
                return v;
            }));
        };

        socket.on('position_update', handleUpdate);
        return () => socket.off('position_update', handleUpdate);
    }, [socket]);

    const fetchVehicles = async () => {
        try {
            const response = await vehiclesAPI.getAll();
            // Mocking position if missing for demo
            const vehiclesWithPos = response.data.map(v => ({
                ...v,
                position: v.position || { latitude: 51.505 + (Math.random() - 0.5) * 0.1, longitude: -0.09 + (Math.random() - 0.5) * 0.1, speed: 0, timestamp: new Date() }
            }));
            setVehicles(vehiclesWithPos);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const getStatus = (vehicle) => {
        if (!vehicle.is_active) return 'offline';
        if (vehicle.position && vehicle.position.speed > 0) return 'moving';
        return 'stopped';
    };

    const filteredVehicles = useMemo(() => {
        return vehicles.filter(v => {
            const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.registration_number.toLowerCase().includes(searchTerm.toLowerCase());
            const status = getStatus(v);
            const matchesFilter = filterStatus === 'all' || status === filterStatus;
            return matchesSearch && matchesFilter;
        });
    }, [vehicles, searchTerm, filterStatus]);

    const handleVehicleClick = (vehicle) => {
        setAutoCenter(false); // Disable auto-center when user interacts
        // Map flyTo logic could go here if we had access to map instance outside
    };

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', position: 'relative', overflow: 'hidden' }}>
            {/* Sidebar */}
            <Paper
                elevation={3}
                sx={{
                    width: sidebarOpen ? 320 : 0,
                    transition: 'width 0.3s',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1000,
                    height: '100%'
                }}
            >
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Live Tracking</Typography>
                        <IconButton size="small" onClick={() => setSidebarOpen(false)} sx={{ color: 'white' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <TextField
                        fullWidth
                        placeholder="Search vehicles..."
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                        }}
                    />
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Chip
                            label="All"
                            size="small"
                            onClick={() => setFilterStatus('all')}
                            color={filterStatus === 'all' ? 'secondary' : 'default'}
                            clickable
                        />
                        <Chip
                            label="Moving"
                            size="small"
                            onClick={() => setFilterStatus('moving')}
                            color={filterStatus === 'moving' ? 'success' : 'default'}
                            clickable
                        />
                        <Chip
                            label="Stopped"
                            size="small"
                            onClick={() => setFilterStatus('stopped')}
                            color={filterStatus === 'stopped' ? 'warning' : 'default'}
                            clickable
                        />
                    </Box>
                </Box>

                <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    {filteredVehicles.map(vehicle => {
                        const status = getStatus(vehicle);
                        return (
                            <ListItem
                                button
                                key={vehicle.id}
                                onClick={() => handleVehicleClick(vehicle)}
                                divider
                            >
                                <ListItemIcon>
                                    <CarIcon style={{ color: status === 'moving' ? 'green' : status === 'stopped' ? 'orange' : 'red' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={vehicle.name}
                                    secondary={
                                        <React.Fragment>
                                            <Typography component="span" variant="body2" color="textPrimary">
                                                {vehicle.registration_number}
                                            </Typography>
                                            <br />
                                            {status === 'moving' ? `${vehicle.position.speed} km/h` : status}
                                        </React.Fragment>
                                    }
                                />
                            </ListItem>
                        );
                    })}
                </List>

                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <FormControlLabel
                        control={<Switch checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} size="small" />}
                        label="Show Labels"
                    />
                    <FormControlLabel
                        control={<Switch checked={autoCenter} onChange={(e) => setAutoCenter(e.target.checked)} size="small" />}
                        label="Auto Center"
                    />
                </Box>
            </Paper>

            {/* Map Area */}
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
                {!sidebarOpen && (
                    <Fab
                        color="primary"
                        size="small"
                        sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}
                        onClick={() => setSidebarOpen(true)}
                    >
                        <MenuIcon />
                    </Fab>
                )}

                <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    <AutoCenterMap vehicles={filteredVehicles} autoCenter={autoCenter} />

                    {filteredVehicles.map(vehicle => (
                        <VehicleMarker key={vehicle.id} vehicle={vehicle} />
                    ))}
                </MapContainer>
            </Box>
        </Box>
    );
};

export default LiveTracking;
