import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box
} from '@mui/material';
import { vehiclesAPI } from '../../services/api';

const DeviceFormModal = ({ open, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        imei: '',
        device_model: '',
        sim_number: '',
        vehicle_id: ''
    });
    const [vehicles, setVehicles] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            fetchVehicles();
            if (initialData) {
                setFormData({
                    imei: initialData.imei || '',
                    device_model: initialData.device_model || '',
                    sim_number: initialData.sim_number || '',
                    vehicle_id: initialData.vehicle_id || ''
                });
            } else {
                setFormData({
                    imei: '',
                    device_model: '',
                    sim_number: '',
                    vehicle_id: ''
                });
            }
            setErrors({});
        }
    }, [open, initialData]);

    const fetchVehicles = async () => {
        try {
            const response = await vehiclesAPI.getAll();
            setVehicles(response.data);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        let tempErrors = {};
        if (!formData.imei.trim()) tempErrors.imei = "IMEI is required";
        if (!formData.device_model.trim()) tempErrors.device_model = "Model is required";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSave({
                ...initialData,
                ...formData
            });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{initialData ? 'Edit Device' : 'Add New Device'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="IMEI"
                        name="imei"
                        value={formData.imei}
                        onChange={handleChange}
                        error={!!errors.imei}
                        helperText={errors.imei}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Model"
                        name="device_model"
                        value={formData.device_model}
                        onChange={handleChange}
                        error={!!errors.device_model}
                        helperText={errors.device_model}
                        fullWidth
                        required
                    />
                    <TextField
                        label="SIM Number"
                        name="sim_number"
                        value={formData.sim_number}
                        onChange={handleChange}
                        fullWidth
                    />
                    <FormControl fullWidth>
                        <InputLabel>Assigned Vehicle</InputLabel>
                        <Select
                            name="vehicle_id"
                            value={formData.vehicle_id}
                            label="Assigned Vehicle"
                            onChange={handleChange}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {vehicles.map((vehicle) => (
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

export default DeviceFormModal;
