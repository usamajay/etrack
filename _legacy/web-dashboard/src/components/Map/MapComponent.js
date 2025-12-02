import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../../contexts/SocketContext';
import { vehiclesAPI } from '../../services/api';
import { Box, Typography, Paper } from '@mui/material';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapComponent = () => {
    const [vehicles, setVehicles] = useState({});
    const socket = useSocket();

    // Fetch initial vehicle positions
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await vehiclesAPI.getAll();
                const vehicleList = response.data;

                const vehicleMap = {};
                vehicleList.forEach(v => {
                    vehicleMap[v.id] = { ...v, position: null };
                });
                setVehicles(vehicleMap);
            } catch (error) {
                console.error('Error fetching vehicles:', error);
            }
        };

        fetchVehicles();
    }, []);

    // Listen for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handlePositionUpdate = (data) => {
            const { vehicleId, position } = data;
            setVehicles(prev => ({
                ...prev,
                [vehicleId]: {
                    ...prev[vehicleId],
                    position
                }
            }));
        };

        socket.on('position_update', handlePositionUpdate);

        return () => {
            socket.off('position_update', handlePositionUpdate);
        };
    }, [socket]);

    // Default center (e.g., London or user's location)
    const defaultCenter = [51.505, -0.09];

    return (
        <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {Object.values(vehicles).map(vehicle => (
                vehicle.position && (
                    <Marker
                        key={vehicle.id}
                        position={[vehicle.position.latitude, vehicle.position.longitude]}
                    >
                        <Popup>
                            <Paper sx={{ p: 1, minWidth: 200 }}>
                                <Typography variant="subtitle1" fontWeight="bold">{vehicle.name}</Typography>
                                <Typography variant="body2">Speed: {vehicle.position.speed} km/h</Typography>
                                <Typography variant="body2">Status: {vehicle.is_active ? 'Active' : 'Inactive'}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Last Updated: {new Date(vehicle.position.timestamp).toLocaleTimeString()}
                                </Typography>
                            </Paper>
                        </Popup>
                    </Marker>
                )
            ))}
        </MapContainer>
    );
};

export default MapComponent;
