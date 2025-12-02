import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem,
    Alert,
    Box,
    CircularProgress
} from '@mui/material';
import { vehiclesAPI, devicesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const AddVehicleModal = ({ open, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        registration_number: '',
        model: '',
        color: '',
        device_id: ''
    });
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fetchingDevices, setFetchingDevices] = useState(false);

    useEffect(() => {
        if (open) {
            fetchDevices();
            // Reset form when opening
            setFormData({
                name: '',
                registration_number: '',
                model: '',
                color: '',
                device_id: ''
            });
            setError('');
        }
    }, [open]);

    const fetchDevices = async () => {
        setFetchingDevices(true);
        try {
            const response = await devicesAPI.getAll();
            // Filter devices that are not assigned to a vehicle (if your API supports this, otherwise just show all)
            // For now assuming response.data is array of devices
            setDevices(response.data);
        } catch (err) {
            console.error('Error fetching devices:', err);
            // Don't block modal if devices fail, just show empty list or error
        } finally {
            setFetchingDevices(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.name || !formData.registration_number) {
            setError('Name and Registration Number are required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const payload = { ...formData };

            // Add organization_id from user context
            if (user?.Organizations?.length > 0) {
                payload.organization_id = user.Organizations[0].id;
            } else {
                setError('No organization found for this user. Cannot create vehicle.');
                setLoading(false);
                return;
            }

            // Sanitize device_id
            if (!payload.device_id) {
                payload.device_id = null;
            }

            await vehiclesAPI.create(payload);
            onSuccess(); // Refresh list and close modal
            onClose();
        } catch (err) {
            console.error('Error creating vehicle:', err);
            setError(err.response?.data?.error || 'Failed to create vehicle');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}

                <Box component="form" sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Vehicle Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Registration Number"
                                name="registration_number"
                                value={formData.registration_number}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Model"
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Color"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Assign Device"
                                name="device_id"
                                value={formData.device_id}
                                onChange={handleChange}
                                disabled={loading || fetchingDevices}
                                helperText={fetchingDevices ? "Loading devices..." : "Select a GPS device to track this vehicle"}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {devices.map((device) => (
                                    <MenuItem key={device.id} value={device.id}>
                                        {device.imei} {device.name ? `(${device.name})` : ''}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Saving...' : 'Save Vehicle'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddVehicleModal;
