import React, { useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    Grid,
    IconButton,
    Paper
} from '@mui/material';
import {
    Notifications as AlertIcon,
    Speed as SpeedIcon,
    LocationOff as OfflineIcon,
    GpsFixed as GeofenceIcon,
    Close as CloseIcon,
    DirectionsCar as CarIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AlertDetailsModal = ({ open, onClose, alert, onMarkRead }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (open && alert && !alert.is_read && onMarkRead) {
            onMarkRead(alert.id);
        }
    }, [open, alert, onMarkRead]);

    if (!alert) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'speeding': return <SpeedIcon fontSize="large" color="error" />;
            case 'geofence': return <GeofenceIcon fontSize="large" color="warning" />;
            case 'offline': return <OfflineIcon fontSize="large" color="action" />;
            default: return <AlertIcon fontSize="large" color="primary" />;
        }
    };

    const getSeverityColor = (type) => {
        switch (type) {
            case 'speeding': return 'error'; // High
            case 'geofence': return 'warning'; // Medium
            case 'offline': return 'default'; // Low
            default: return 'primary';
        }
    };

    const getSeverityLabel = (type) => {
        switch (type) {
            case 'speeding': return 'High';
            case 'geofence': return 'Medium';
            case 'offline': return 'Low';
            default: return 'Info';
        }
    };

    const handleViewVehicle = () => {
        navigate(`/vehicles/${alert.vehicle_id}`);
    };

    // Parse location if available (assuming alert.location is { lat, lng } or similar)
    // If not, we might need to fetch it or rely on what's passed. 
    // For now, assuming alert object has latitude and longitude or data field with it.
    const position = alert.latitude && alert.longitude ? [alert.latitude, alert.longitude] : null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getIcon(alert.type)}
                        <Typography variant="h6">Alert Details</Typography>
                    </Box>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">Vehicle</Typography>
                            <Typography variant="h6">{alert.Vehicle?.name || 'Unknown Vehicle'}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">Message</Typography>
                            <Typography variant="body1">{alert.message}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">Time</Typography>
                            <Typography variant="body1">{new Date(alert.timestamp).toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">Severity</Typography>
                            <Chip
                                label={getSeverityLabel(alert.type)}
                                color={getSeverityColor(alert.type)}
                                size="small"
                            />
                        </Box>

                        {/* Additional Data */}
                        {alert.data && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>Additional Info</Typography>
                                {alert.type === 'speeding' && (
                                    <Typography variant="body2">Speed: {alert.data.speed} km/h</Typography>
                                )}
                                {alert.type === 'geofence' && (
                                    <Typography variant="body2">Geofence: {alert.data.geofence_name}</Typography>
                                )}
                            </Box>
                        )}
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>Location</Typography>
                        <Paper sx={{ height: 300, overflow: 'hidden', borderRadius: 2 }}>
                            {position ? (
                                <MapContainer
                                    center={position}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <Marker position={position}>
                                        <Popup>Alert Location</Popup>
                                    </Marker>
                                </MapContainer>
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: '#f5f5f5' }}>
                                    <Typography color="textSecondary">Location data not available</Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button startIcon={<CarIcon />} onClick={handleViewVehicle}>
                    View Vehicle
                </Button>
                <Button onClick={onClose} variant="contained">
                    Dismiss
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AlertDetailsModal;
