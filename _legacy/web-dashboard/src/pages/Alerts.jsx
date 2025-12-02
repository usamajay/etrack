import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    TextField,
    MenuItem,
    Button,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Badge,
    Grid,
    Alert as MuiAlert
} from '@mui/material';
import {
    Notifications as AlertIcon,
    Speed as SpeedIcon,
    LocationOff as OfflineIcon,
    GpsFixed as GeofenceIcon,
    Delete as DeleteIcon,
    Check as CheckIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { alertsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import AlertDetailsModal from '../components/Alerts/AlertDetailsModal';

const Alerts = () => {
    const socket = useSocket();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all'); // all, unread
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedAlerts, setSelectedAlerts] = useState([]);
    const [viewAlert, setViewAlert] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAlerts();
    }, [filterType, filterStatus, startDate, endDate]);

    useEffect(() => {
        if (!socket) return;

        const handleNewAlert = (newAlert) => {
            setAlerts(prev => [newAlert, ...prev]);
        };

        socket.on('alert:new', handleNewAlert);
        return () => socket.off('alert:new', handleNewAlert);
    }, [socket]);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const params = {
                type: filterType !== 'all' ? filterType : undefined,
                is_read: filterStatus === 'unread' ? false : undefined,
                start_date: startDate ? startDate.toISOString() : undefined,
                end_date: endDate ? endDate.toISOString() : undefined
            };
            const response = await alertsAPI.getAll(params);
            setAlerts(response.data);
        } catch (err) {
            console.error('Error fetching alerts:', err);
            setError('Failed to load alerts');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await alertsAPI.markAsRead(id);
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await alertsAPI.delete(id);
            setAlerts(prev => prev.filter(a => a.id !== id));
            setSelectedAlerts(prev => prev.filter(aid => aid !== id));
        } catch (err) {
            console.error('Error deleting alert:', err);
        }
    };

    const handleBulkRead = async () => {
        for (const id of selectedAlerts) {
            await handleMarkAsRead(id);
        }
        setSelectedAlerts([]);
    };

    const handleBulkDelete = async () => {
        for (const id of selectedAlerts) {
            await handleDelete(id);
        }
        setSelectedAlerts([]);
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedAlerts(alerts.map(a => a.id));
        } else {
            setSelectedAlerts([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedAlerts(prev =>
            prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
        );
    };

    const getIcon = (type) => {
        switch (type) {
            case 'speeding': return <SpeedIcon color="error" />;
            case 'geofence': return <GeofenceIcon color="warning" />;
            case 'offline': return <OfflineIcon color="action" />;
            default: return <AlertIcon color="primary" />;
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold">Alerts</Typography>
                    <Button startIcon={<RefreshIcon />} onClick={fetchAlerts}>Refresh</Button>
                </Box>

                <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                label="Type"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                size="small"
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="speeding">Speeding</MenuItem>
                                <MenuItem value="geofence">Geofence</MenuItem>
                                <MenuItem value="offline">Offline</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                label="Status"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                size="small"
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="unread">Unread Only</MenuItem>
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
                    </Grid>
                </Paper>

                {selectedAlerts.length > 0 && (
                    <Paper elevation={1} sx={{ p: 1, mb: 2, bgcolor: 'primary.light', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ ml: 2 }}>{selectedAlerts.length} selected</Typography>
                        <Button size="small" variant="contained" color="secondary" onClick={handleBulkRead}>Mark Read</Button>
                        <Button size="small" variant="contained" color="error" onClick={handleBulkDelete}>Delete</Button>
                    </Paper>
                )}

                <Paper elevation={2}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : alerts.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="textSecondary">No alerts found</Typography>
                        </Box>
                    ) : (
                        <List>
                            <ListItem divider>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        checked={selectedAlerts.length === alerts.length && alerts.length > 0}
                                        indeterminate={selectedAlerts.length > 0 && selectedAlerts.length < alerts.length}
                                        onChange={handleSelectAll}
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Select All" />
                            </ListItem>
                            {alerts.map((alert) => (
                                <ListItem
                                    key={alert.id}
                                    divider
                                    button
                                    onClick={() => setViewAlert(alert)}
                                    sx={{ bgcolor: alert.is_read ? 'transparent' : 'action.hover' }}
                                >
                                    <ListItemIcon onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            edge="start"
                                            checked={selectedAlerts.includes(alert.id)}
                                            onChange={() => handleSelectOne(alert.id)}
                                        />
                                    </ListItemIcon>
                                    <ListItemIcon>
                                        {getIcon(alert.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle1" fontWeight={alert.is_read ? 'normal' : 'bold'}>
                                                    {alert.type.toUpperCase()}
                                                </Typography>
                                                {!alert.is_read && <Chip label="New" color="error" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />}
                                            </Box>
                                        }
                                        secondary={
                                            <React.Fragment>
                                                <Typography component="span" variant="body2" color="textPrimary">
                                                    {alert.Vehicle?.name}
                                                </Typography>
                                                {" — " + alert.message}
                                                <br />
                                                <Typography component="span" variant="caption" color="textSecondary">
                                                    {new Date(alert.timestamp).toLocaleString()}
                                                </Typography>
                                            </React.Fragment>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        {!alert.is_read && (
                                            <IconButton edge="end" onClick={() => handleMarkAsRead(alert.id)} title="Mark as Read">
                                                <CheckIcon color="primary" />
                                            </IconButton>
                                        )}
                                        <IconButton edge="end" onClick={() => handleDelete(alert.id)} title="Delete">
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>

                {/* Alert Details Modal */}
                <AlertDetailsModal
                    open={!!viewAlert}
                    onClose={() => setViewAlert(null)}
                    alert={viewAlert}
                    onMarkRead={handleMarkAsRead}
                />
            </Box>
        </LocalizationProvider>
    );
};

export default Alerts;
