import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Box,
    Alert,
    List,
    ListItem,
    ListItemText,
    Chip,
    CircularProgress,
    Divider
} from '@mui/material';
import { commandsAPI } from '../../services/api';
import { format } from 'date-fns';

const SendCommandModal = ({ open, onClose, device }) => {
    const [commandType, setCommandType] = useState('locate');
    const [params, setParams] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [history, setHistory] = useState([]);
    const [activeCommandId, setActiveCommandId] = useState(null);

    const pollIntervalRef = useRef(null);

    useEffect(() => {
        if (open && device) {
            fetchHistory();
            // Reset state
            setCommandType('locate');
            setParams('');
            setError('');
            setSuccess('');
            setLoading(false);
            setActiveCommandId(null);
        }
        return () => stopPolling();
    }, [open, device]);

    // Poll for status if we have an active command
    useEffect(() => {
        if (activeCommandId) {
            startPolling(activeCommandId);
        }
    }, [activeCommandId]);

    const stopPolling = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    };

    const startPolling = (commandId) => {
        stopPolling();
        pollIntervalRef.current = setInterval(async () => {
            try {
                const response = await commandsAPI.getOne(commandId);
                const cmd = response.data;

                // Update history item
                setHistory(prev => prev.map(item => item.id === commandId ? cmd : item));

                if (cmd.status === 'executed' || cmd.status === 'failed' || cmd.status === 'timeout') {
                    stopPolling();
                    setLoading(false);
                    setActiveCommandId(null);

                    if (cmd.status === 'executed') {
                        setSuccess(`Command '${cmd.type}' executed successfully.`);
                    } else {
                        setError(`Command failed: ${cmd.result || cmd.status}`);
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
                // Don't stop polling on transient network errors, but maybe limit retries?
                // For simplicity, we keep polling until status changes or component unmounts
            }
        }, 2000);
    };

    const fetchHistory = async () => {
        if (!device) return;
        try {
            const response = await commandsAPI.getHistory(device.id);
            setHistory(response.data);
        } catch (err) {
            console.error("Error fetching history:", err);
        }
    };

    const handleSend = async () => {
        if (!device) return;

        setError('');
        setSuccess('');
        setLoading(true);

        const payload = {
            device_id: device.id,
            type: commandType,
            parameters: commandType === 'set_interval' ? { interval: parseInt(params) } : {}
        };

        try {
            const response = await commandsAPI.create(payload);
            const newCommand = response.data;

            // Add to history immediately
            setHistory(prev => [newCommand, ...prev].slice(0, 5));

            // Start polling
            setActiveCommandId(newCommand.id);

        } catch (err) {
            console.error("Send command error:", err);
            setError(err.response?.data?.error || 'Failed to send command');
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'sent': return 'info';
            case 'executed': return 'success';
            case 'failed': return 'error';
            case 'timeout': return 'default';
            default: return 'default';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Send Command</DialogTitle>
            <DialogContent>
                {device && (
                    <Box sx={{ mb: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="subtitle2">Device: {device.device_model}</Typography>
                        <Typography variant="caption" color="text.secondary">IMEI: {device.imei}</Typography>
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <FormControl fullWidth>
                        <InputLabel>Command Type</InputLabel>
                        <Select
                            value={commandType}
                            label="Command Type"
                            onChange={(e) => setCommandType(e.target.value)}
                            disabled={loading}
                        >
                            <MenuItem value="locate">Locate Now</MenuItem>
                            <MenuItem value="lock_engine">Lock Engine</MenuItem>
                            <MenuItem value="unlock_engine">Unlock Engine</MenuItem>
                            <MenuItem value="restart">Restart Device</MenuItem>
                            <MenuItem value="set_interval">Set Reporting Interval</MenuItem>
                        </Select>
                    </FormControl>

                    {commandType === 'set_interval' && (
                        <TextField
                            label="Interval (seconds)"
                            type="number"
                            value={params}
                            onChange={(e) => setParams(e.target.value)}
                            inputProps={{ min: 60, max: 3600 }}
                            helperText="Enter value between 60 and 3600 seconds"
                            fullWidth
                            disabled={loading}
                        />
                    )}

                    <Button
                        variant="contained"
                        onClick={handleSend}
                        disabled={loading || (commandType === 'set_interval' && !params)}
                        sx={{ mt: 1 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Send Command'}
                    </Button>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>Command History</Typography>
                <List dense>
                    {history.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No recent commands.</Typography>
                    ) : (
                        history.map((cmd) => (
                            <ListItem key={cmd.id} divider>
                                <ListItemText
                                    primary={cmd.type.replace('_', ' ').toUpperCase()}
                                    secondary={format(new Date(cmd.created_at), 'MMM dd HH:mm:ss')}
                                />
                                <Chip
                                    label={cmd.status}
                                    size="small"
                                    color={getStatusColor(cmd.status)}
                                    variant="outlined"
                                />
                            </ListItem>
                        ))
                    )}
                </List>

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SendCommandModal;
