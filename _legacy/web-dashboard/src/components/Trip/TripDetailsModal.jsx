import React, { useEffect, useState, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Typography,
    Box,
    Paper,
    CircularProgress,
    Divider,
    Chip
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
    MapContainer,
    TileLayer,
    Polyline,
    Marker,
    Popup
} from 'react-leaflet';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer
} from 'recharts';
import L from 'leaflet';
import { positionsAPI } from '../../services/api';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const createIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const startIcon = createIcon('green');
const endIcon = createIcon('red');
const stopIcon = createIcon('orange');

const TripDetailsModal = ({ open, onClose, trip }) => {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stops, setStops] = useState([]);

    useEffect(() => {
        if (open && trip) {
            fetchTripPositions();
        }
    }, [open, trip]);

    const fetchTripPositions = async () => {
        setLoading(true);
        try {
            // Fetch positions for the duration of the trip
            // Assuming we can filter by time range
            const response = await positionsAPI.getHistory(trip.vehicle_id, {
                start_date: trip.start_time,
                end_date: trip.end_time
            });

            const posData = response.data;
            setPositions(posData);
            calculateStops(posData);
        } catch (error) {
            console.error('Error fetching trip positions:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStops = (data) => {
        const detectedStops = [];
        // Simple logic: if speed is 0 for > 5 minutes (300000 ms)
        // This is a naive implementation, backend usually handles this better
        let stopStart = null;

        for (let i = 0; i < data.length; i++) {
            const p = data[i];
            if (p.speed < 1) { // Assuming < 1 km/h is stopped
                if (!stopStart) stopStart = p;
            } else {
                if (stopStart) {
                    const duration = new Date(p.timestamp) - new Date(stopStart.timestamp);
                    if (duration > 5 * 60 * 1000) {
                        detectedStops.push({
                            ...stopStart,
                            duration: Math.round(duration / 60000), // minutes
                            endTime: p.timestamp
                        });
                    }
                    stopStart = null;
                }
            }
        }
        setStops(detectedStops);
    };

    const routeCoordinates = useMemo(() => {
        return positions.map(p => [p.latitude, p.longitude]);
    }, [positions]);

    const chartData = useMemo(() => {
        return positions.map(p => ({
            time: new Date(p.timestamp).toLocaleTimeString(),
            speed: p.speed
        }));
    }, [positions]);

    const handleExportGPX = () => {
        if (positions.length === 0) return;

        const gpxData = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPS Tracker">
  <trk>
    <name>Trip ${trip.id}</name>
    <trkseg>
      ${positions.map(p => `
      <trkpt lat="${p.latitude}" lon="${p.longitude}">
        <time>${new Date(p.timestamp).toISOString()}</time>
        <speed>${p.speed}</speed>
      </trkpt>`).join('')}
    </trkseg>
  </trk>
</gpx>`;

        const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trip_${trip.id}.gpx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!trip) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Trip Details</Typography>
                    <Box>
                        <Button onClick={handleExportGPX} disabled={positions.length === 0} sx={{ mr: 1 }}>
                            Export GPX
                        </Button>
                        <Button onClick={onClose}>Close</Button>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {/* Stats */}
                        <Grid item xs={12}>
                            <Grid container spacing={2}>
                                <Grid item xs={6} md={2}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" color="textSecondary">Duration</Typography>
                                        <Typography variant="h6">{trip.duration} min</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" color="textSecondary">Distance</Typography>
                                        <Typography variant="h6">{trip.distance} km</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" color="textSecondary">Max Speed</Typography>
                                        <Typography variant="h6">{trip.max_speed} km/h</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" color="textSecondary">Start Time</Typography>
                                        <Typography variant="body1">{new Date(trip.start_time).toLocaleString()}</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" color="textSecondary">End Time</Typography>
                                        <Typography variant="body1">{new Date(trip.end_time).toLocaleString()}</Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Map */}
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ height: 400, overflow: 'hidden' }}>
                                {routeCoordinates.length > 0 ? (
                                    <MapContainer
                                        bounds={L.latLngBounds(routeCoordinates)}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <Polyline positions={routeCoordinates} color="blue" weight={4} />

                                        <Marker position={routeCoordinates[0]} icon={startIcon}>
                                            <Popup>Start: {new Date(trip.start_time).toLocaleString()}</Popup>
                                        </Marker>

                                        <Marker position={routeCoordinates[routeCoordinates.length - 1]} icon={endIcon}>
                                            <Popup>End: {new Date(trip.end_time).toLocaleString()}</Popup>
                                        </Marker>

                                        {stops.map((stop, index) => (
                                            <Marker key={index} position={[stop.latitude, stop.longitude]} icon={stopIcon}>
                                                <Popup>
                                                    Stop: {stop.duration} mins<br />
                                                    At: {new Date(stop.timestamp).toLocaleTimeString()}
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <Typography color="textSecondary">No route data available</Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>

                        {/* Timeline / Stops */}
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ height: 400, overflowY: 'auto', p: 2 }}>
                                <Typography variant="h6" gutterBottom>Trip Timeline</Typography>
                                <Timeline>
                                    <TimelineItem>
                                        <TimelineSeparator>
                                            <TimelineDot color="success" />
                                            <TimelineConnector />
                                        </TimelineSeparator>
                                        <TimelineContent>
                                            <Typography variant="subtitle2">Trip Started</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(trip.start_time).toLocaleTimeString()}
                                            </Typography>
                                        </TimelineContent>
                                    </TimelineItem>

                                    {stops.map((stop, index) => (
                                        <TimelineItem key={index}>
                                            <TimelineSeparator>
                                                <TimelineDot color="warning" />
                                                <TimelineConnector />
                                            </TimelineSeparator>
                                            <TimelineContent>
                                                <Typography variant="subtitle2">Stopped ({stop.duration} min)</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {new Date(stop.timestamp).toLocaleTimeString()}
                                                </Typography>
                                            </TimelineContent>
                                        </TimelineItem>
                                    ))}

                                    <TimelineItem>
                                        <TimelineSeparator>
                                            <TimelineDot color="error" />
                                        </TimelineSeparator>
                                        <TimelineContent>
                                            <Typography variant="subtitle2">Trip Ended</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(trip.end_time).toLocaleTimeString()}
                                            </Typography>
                                        </TimelineContent>
                                    </TimelineItem>
                                </Timeline>
                            </Paper>
                        </Grid>

                        {/* Speed Chart */}
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>Speed Profile</Typography>
                                <Box sx={{ height: 250 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="time" />
                                            <YAxis unit=" km/h" />
                                            <RechartsTooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="speed"
                                                stroke="#8884d8"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default TripDetailsModal;
