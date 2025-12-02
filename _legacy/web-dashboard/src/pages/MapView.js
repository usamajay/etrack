import React from 'react';
import { Box, Paper } from '@mui/material';
import MapComponent from '../components/Map/MapComponent';

const MapView = () => {
    return (
        <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={3} sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <MapComponent />
            </Paper>
        </Box>
    );
};

export default MapView;
