import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    MenuItem,
    Button,
    Tabs,
    Tab,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { Download as DownloadIcon, Assessment as AssessmentIcon } from '@mui/icons-material';
import { vehiclesAPI, reportsAPI, tripsAPI } from '../services/api';

const Reports = () => {
    const [tabValue, setTabValue] = useState(0);
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [date, setDate] = useState(new Date());
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)));
    const [endDate, setEndDate] = useState(new Date());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const response = await vehiclesAPI.getAll();
            setVehicles(response.data);
            if (response.data.length > 0) {
                setSelectedVehicle(response.data[0].id);
            }
        } catch (err) {
            console.error('Error fetching vehicles:', err);
            setError('Failed to load vehicles');
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setReportData(null);
        setError('');
    };

    const generateReport = async () => {
        console.log('Generating report...', { selectedVehicle, tabValue, date, startDate, endDate });
        if (!selectedVehicle) {
            setError('Please select a vehicle');
            return;
        }

        setLoading(true);
        setError('');
        setReportData(null);

        try {
            let response;
            if (tabValue === 0) { // Daily
                console.log('Fetching daily report');
                response = await reportsAPI.getDaily(selectedVehicle, date.toISOString().split('T')[0]);
            } else if (tabValue === 1) { // Weekly
                console.log('Fetching weekly report');
                response = await reportsAPI.getWeekly(selectedVehicle, startDate.toISOString().split('T')[0]);
            } else if (tabValue === 2) { // Monthly
                console.log('Fetching monthly report');
                response = await reportsAPI.getMonthly(selectedVehicle, month, year);
            } else if (tabValue === 3) { // Custom
                console.log('Fetching custom report');
                const params = {
                    vehicle_id: selectedVehicle,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                };
                const tripsRes = await tripsAPI.getAll(params);
                const trips = tripsRes.data;
                const totalDistance = trips.reduce((sum, t) => sum + parseFloat(t.distance), 0);
                const totalDuration = trips.reduce((sum, t) => sum + parseInt(t.duration), 0);
                const maxSpeed = Math.max(...trips.map(t => parseFloat(t.max_speed)), 0);

                response = {
                    data: {
                        summary: {
                            total_distance: totalDistance.toFixed(2),
                            total_duration: totalDuration,
                            max_speed: maxSpeed,
                            trip_count: trips.length
                        },
                        trips: trips
                    }
                };
            }

            console.log('Report response:', response.data);
            setReportData(response.data);
        } catch (err) {
            console.error('Error generating report:', err);
            setError('Failed to generate report. Data might be missing for this period.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!reportData) return;
        // Simple CSV export logic
        const headers = ['Metric', 'Value'];
        const rows = [
            ['Total Distance', reportData.summary?.total_distance || 0],
            ['Total Duration', reportData.summary?.total_duration || 0],
            ['Max Speed', reportData.summary?.max_speed || 0],
            ['Trip Count', reportData.summary?.trip_count || 0]
        ];

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `report_${selectedVehicle}_${tabValue}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderCharts = () => {
        if (!reportData) return null;

        // Prepare data for charts based on report type
        // This assumes backend returns 'breakdown' or 'trips' array for charting
        // For now, we'll try to map 'trips' if available, or just show summary

        let chartData = [];
        if (reportData.trips) {
            chartData = reportData.trips.map(t => ({
                name: new Date(t.start_time).toLocaleDateString(),
                distance: parseFloat(t.distance),
                speed: parseFloat(t.max_speed)
            }));
        } else if (reportData.daily_stats) { // Assuming weekly/monthly returns daily_stats
            chartData = reportData.daily_stats.map(d => ({
                name: d.date,
                distance: parseFloat(d.distance),
                speed: parseFloat(d.max_speed)
            }));
        }

        if (chartData.length === 0) return <Typography>No chart data available</Typography>;

        return (
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 300 }}>
                        <Typography variant="h6" gutterBottom>Distance per Trip/Day</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="distance" fill="#8884d8" name="Distance (km)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 300 }}>
                        <Typography variant="h6" gutterBottom>Max Speed per Trip/Day</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="speed" stroke="#82ca9d" name="Max Speed (km/h)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        );
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Reports (Updated)</Typography>

                <Paper elevation={2} sx={{ mb: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
                        <Tab label="Daily Report" />
                        <Tab label="Weekly Report" />
                        <Tab label="Monthly Report" />
                        <Tab label="Custom Range" />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
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
                                            {vehicle.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {tabValue === 0 && (
                                <Grid item xs={12} md={3}>
                                    <DatePicker
                                        label="Select Date"
                                        value={date}
                                        onChange={(newValue) => setDate(newValue)}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </Grid>
                            )}

                            {tabValue === 1 && (
                                <Grid item xs={12} md={3}>
                                    <DatePicker
                                        label="Start Date"
                                        value={startDate}
                                        onChange={(newValue) => setStartDate(newValue)}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </Grid>
                            )}

                            {tabValue === 2 && (
                                <>
                                    <Grid item xs={12} md={2}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Month"
                                            value={month}
                                            onChange={(e) => setMonth(e.target.value)}
                                            size="small"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <MenuItem key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <TextField
                                            type="number"
                                            fullWidth
                                            label="Year"
                                            value={year}
                                            onChange={(e) => setYear(e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                </>
                            )}

                            {tabValue === 3 && (
                                <>
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
                                </>
                            )}

                            <Grid item xs={12} md={2}>
                                <Button
                                    variant="contained"
                                    startIcon={<AssessmentIcon />}
                                    onClick={generateReport}
                                    fullWidth
                                    disabled={loading}
                                >
                                    Generate
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : reportData && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
                                Export CSV
                            </Button>
                        </Box>

                        {/* Summary Cards */}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                                    <Typography variant="subtitle2">Total Distance</Typography>
                                    <Typography variant="h4">{reportData.summary?.total_distance || 0} km</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
                                    <Typography variant="subtitle2">Total Duration</Typography>
                                    <Typography variant="h4">{reportData.summary?.total_duration || 0} min</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                                    <Typography variant="subtitle2">Max Speed</Typography>
                                    <Typography variant="h4">{reportData.summary?.max_speed || 0} km/h</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                                    <Typography variant="subtitle2">Total Trips</Typography>
                                    <Typography variant="h4">{reportData.summary?.trip_count || 0}</Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Charts */}
                        {renderCharts()}

                        {/* Details Table */}
                        {reportData.trips && reportData.trips.length > 0 && (
                            <TableContainer component={Paper} sx={{ mt: 3 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Start Time</TableCell>
                                            <TableCell>End Time</TableCell>
                                            <TableCell>Distance (km)</TableCell>
                                            <TableCell>Duration (min)</TableCell>
                                            <TableCell>Max Speed (km/h)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {reportData.trips.map((trip) => (
                                            <TableRow key={trip.id}>
                                                <TableCell>{new Date(trip.start_time).toLocaleDateString()}</TableCell>
                                                <TableCell>{new Date(trip.start_time).toLocaleTimeString()}</TableCell>
                                                <TableCell>{new Date(trip.end_time).toLocaleTimeString()}</TableCell>
                                                <TableCell>{trip.distance}</TableCell>
                                                <TableCell>{trip.duration}</TableCell>
                                                <TableCell>{trip.max_speed}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}
            </Box>
        </LocalizationProvider>
    );
};

export default Reports;
