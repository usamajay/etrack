import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    FormControlLabel,
    Checkbox,
    Grid,
    Typography,
    Box,
    Select,
    MenuItem,
    InputLabel,
    Chip,
    OutlinedInput
} from '@mui/material';
import { vehiclesAPI } from '../../services/api';

const GeofenceFormModal = ({ open, onClose, onSave, initialData }) => {
    const [name, setName] = useState('');
    const [alertOnEntry, setAlertOnEntry] = useState(false);
    const [alertOnExit, setAlertOnExit] = useState(false);
    const [assignedVehicles, setAssignedVehicles] = useState([]);
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            // Reset or Populate form
            if (initialData) {
                setName(initialData.name || '');
                setAlertOnEntry(initialData.alert_on_entry || false);
                setAlertOnExit(initialData.alert_on_exit || false);
                setAssignedVehicles(initialData.assigned_vehicles || []);
            } else {
                setName('');
                setAlertOnEntry(false);
                setAlertOnExit(false);
                setAssignedVehicles([]);
            }
            setErrors({});
            fetchVehicles();
        }
    }, [open, initialData]);

    const fetchVehicles = async () => {
        try {
            const response = await vehiclesAPI.getAll();
            setAvailableVehicles(response.data);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        }
    };

    const validate = () => {
        let tempErrors = {};
        if (!name.trim()) tempErrors.name = "Name is required";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSave({
                ...initialData,
                name,
                alert_on_entry: alertOnEntry,
                alert_on_exit: alertOnExit,
                assigned_vehicles: assignedVehicles
            });
        }
    };

    const handleVehicleChange = (event) => {
        const {
            target: { value },
        } = event;
        setAssignedVehicles(
            // On autofill we get a stringified value.
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{initialData?.id ? 'Edit Geofence' : 'Create Geofence'}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Geofence Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name}
                        sx={{ mb: 2 }}
                    />

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Geofence Details
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                            <TextField
                                label="Type"
                                value={initialData?.type || ''}
                                fullWidth
                                disabled
                                size="small"
                            />
                        </Grid>
                        {initialData?.type === 'circle' && (
                            <Grid item xs={6}>
                                <TextField
                                    label="Radius (m)"
                                    value={initialData?.radius ? Math.round(initialData.radius) : ''}
                                    fullWidth
                                    disabled
                                    size="small"
                                />
                            </Grid>
                        )}
                    </Grid>

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Alert Settings
                    </Typography>
                    <FormControlLabel
                        control={<Checkbox checked={alertOnEntry} onChange={(e) => setAlertOnEntry(e.target.checked)} />}
                        label="Alert on Entry"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={alertOnExit} onChange={(e) => setAlertOnExit(e.target.checked)} />}
                        label="Alert on Exit"
                    />

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Assigned Vehicles
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel id="assigned-vehicles-label">Vehicles</InputLabel>
                        <Select
                            labelId="assigned-vehicles-label"
                            multiple
                            value={assignedVehicles}
                            onChange={handleVehicleChange}
                            input={<OutlinedInput label="Vehicles" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const vehicle = availableVehicles.find(v => v.id === value);
                                        return <Chip key={value} label={vehicle ? vehicle.license_plate : value} size="small" />;
                                    })}
                                </Box>
                            )}
                        >
                            {availableVehicles.map((vehicle) => (
                                <MenuItem key={vehicle.id} value={vehicle.id}>
                                    {vehicle.license_plate} ({vehicle.make} {vehicle.model})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GeofenceFormModal;
