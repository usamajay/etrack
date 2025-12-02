import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography, Button, Chip } from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Car SVG path
const CAR_SVG = `
<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0" xmlns="http://www.w3.org/2000/svg">
  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"></path>
</svg>
`;

const getStatusColor = (status) => {
    switch (status) {
        case 'moving': return '#4caf50'; // Green
        case 'stopped': return '#ff9800'; // Orange
        case 'offline': return '#f44336'; // Red
        default: return '#9e9e9e'; // Grey
    }
};

const VehicleMarker = ({ vehicle }) => {
    const navigate = useNavigate();

    const status = useMemo(() => {
        if (!vehicle.is_active) return 'offline';
        if (vehicle.position && vehicle.position.speed > 0) return 'moving';
        return 'stopped';
    }, [vehicle]);

    const heading = vehicle.position?.heading || 0;
    const color = getStatusColor(status);

    const icon = useMemo(() => {
        return L.divIcon({
            className: 'custom-vehicle-marker',
            html: `
                <div style="
                    position: relative;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                ">
                    <div style="
                        width: 32px;
                        height: 32px;
                        background-color: white;
                        border-radius: 50%;
                        border: 2px solid ${color};
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        transform: rotate(${heading}deg);
                        transition: transform 0.3s ease;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                        color: ${color};
                    ">
                        <div style="width: 20px; height: 20px;">
                            ${CAR_SVG}
                        </div>
                    </div>
                    <div style="
                        background-color: rgba(255, 255, 255, 0.9);
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 10px;
                        font-weight: bold;
                        margin-top: 4px;
                        white-space: nowrap;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                        border: 1px solid #ddd;
                    ">
                        ${vehicle.name}
                    </div>
                </div>
            `,
            iconSize: [40, 60],
            iconAnchor: [20, 20], // Center of the circle
            popupAnchor: [0, -20]
        });
    }, [vehicle.name, heading, color]);

    const handleViewDetails = () => {
        navigate(`/vehicles/${vehicle.id}`);
    };

    if (!vehicle.position) return null;

    return (
        <Marker position={[vehicle.position.latitude, vehicle.position.longitude]} icon={icon}>
            <Popup>
                <Box sx={{ minWidth: 200 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {vehicle.name}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip
                            label={status.toUpperCase()}
                            size="small"
                            color={status === 'moving' ? 'success' : status === 'stopped' ? 'warning' : 'error'}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                        <Typography variant="body2" color="textSecondary">
                            {vehicle.model}
                        </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <span>Speed:</span>
                        <strong>{vehicle.position.speed} km/h</strong>
                    </Typography>

                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <span>Last Seen:</span>
                        <span>{new Date(vehicle.position.timestamp).toLocaleTimeString()}</span>
                    </Typography>

                    <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        startIcon={<ViewIcon />}
                        onClick={handleViewDetails}
                    >
                        View Details
                    </Button>
                </Box>
            </Popup>
        </Marker>
    );
};

export default VehicleMarker;
