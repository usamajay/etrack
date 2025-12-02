import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    MenuItem,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    CircularProgress,
    IconButton,
    Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
    Search as SearchIcon,
    Download as DownloadIcon,
    Map as MapIcon
} from '@mui/icons-material';
import { vehiclesAPI, tripsAPI } from '../services/api';
import TripDetailsModal from '../components/Trip/TripDetailsModal';

const TripHistory = () => {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [error, setError] = useState('');
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const response = await vehiclesAPI.getAll();
            setVehicles(response.data);
        } catch (err) {
            console.error('Error fetching vehicles:', err);
            setError('Failed to load vehicles');
        }
    };

    const handleSearch = async () => {
        if (!selectedVehicle) {
            setError('Please select a vehicle');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const params = {
                vehicle_id: selectedVehicle,
                start_date: startDate ? startDate.toISOString() : undefined,
                end_date: endDate ? endDate.toISOString() : undefined
            };
            const response = await tripsAPI.getAll(params);
            setTrips(response.data);
            setPage(0);
        } catch (err) {
            console.error('Error fetching trips:', err);
            setError('Failed to load trips');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (trips.length === 0) return;

        const headers = ['Start Time', 'End Time', 'Duration (min)', 'Distance (km)', 'Max Speed (km/h)', 'Start Location', 'End Location'];
        const csvContent = [
            headers.join(','),
            ...trips.map(trip => [
                new Date(trip.start_time).toLocaleString(),
                new Date(trip.end_time).toLocaleString(),
                trip.duration,
                trip.distance,
                trip.max_speed,
                `"${trip.start_location || ''}"`,
                `"${trip.end_location || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `trips_${selectedVehicle}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleViewTrip = (trip) => {
        setSelectedTrip(trip);
        setOpenModal(true);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Trip History</Typography>

                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                label="Select Vehicle"
                                value={selectedVehicle}
                                onChange={(e) => setSelectedVehicle(e.target.value)}
                                size="small"
                            >
                                {vehicles.map((vehicle) => (
                                    <MenuItem key={vehicle.id} value={vehicle.id}>
                                        {vehicle.name} ({vehicle.registration_number})
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={(newValue) => setStartDate(newValue)}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={(newValue) => setEndDate(newValue)}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<SearchIcon />}
                                onClick={handleSearch}
                                fullWidth
                                disabled={loading}
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={handleExport}
                                disabled={trips.length === 0}
                            >
                                Export
                            </Button>
                        </Grid>
                    </Grid>
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </Paper>

                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'background.default' }}>
                                <TableCell>Start Time</TableCell>
                                <TableCell>End Time</TableCell>
                                <TableCell>Duration</TableCell>
                                <TableCell>Distance</TableCell>
                                <TableCell>Max Speed</TableCell>
                                <TableCell>Start Location</TableCell>
                                <TableCell>End Location</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : trips.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                        <Typography color="textSecondary">No trips found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                trips
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((trip) => (
                                        <TableRow key={trip.id} hover>
                                            <TableCell>{new Date(trip.start_time).toLocaleString()}</TableCell>
                                            <TableCell>{new Date(trip.end_time).toLocaleString()}</TableCell>
                                            <TableCell>{trip.duration} min</TableCell>
                                            <TableCell>{trip.distance} km</TableCell>
                                            <TableCell>{trip.max_speed} km/h</TableCell>
                                            <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={trip.start_location}>
                                                {trip.start_location || '-'}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={trip.end_location}>
                                                {trip.end_location || '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    title="View on Map"
                                                    onClick={() => handleViewTrip(trip)}
                                                >
                                                    <MapIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={trips.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </TableContainer>

                <TripDetailsModal
                    open={openModal}
                    onClose={() => setOpenModal(false)}
                    trip={selectedTrip}
                />
            </Box>
        </LocalizationProvider>
    );
};

export default TripHistory;
