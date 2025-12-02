import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Alert,
    Box
} from '@mui/material';
import { devicesAPI } from '../../services/api';

const AddDeviceModal = ({ open, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        imei: '',
        device_model: '',
        sim_number: ''
    });
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;

        // For IMEI, restrict to numbers only
        if (name === 'imei' && !/^\d*$/.test(value)) {
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear specific error
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        let tempErrors = {};

        // IMEI Validation: Required and exactly 15 digits
        if (!formData.imei) {
            tempErrors.imei = "IMEI is required";
        } else if (formData.imei.length !== 15) {
            tempErrors.imei = "IMEI must be exactly 15 digits";
        }

        // Device Model Validation: Required
        if (!formData.device_model.trim()) {
            tempErrors.device_model = "Device model is required";
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async () => {
        setGeneralError('');
        setSuccessMessage('');

        if (validate()) {
            try {
                await devicesAPI.create(formData);
                setSuccessMessage('Device added successfully!');
                setFormData({
                    imei: '',
                    device_model: '',
                    sim_number: ''
                });

                // Notify parent and potentially close
                if (onSuccess) onSuccess();

                // Optional: Close after a short delay or let user close
                // onClose(); 
            } catch (err) {
                console.error("Error creating device:", err);
                setGeneralError(err.response?.data?.error || 'Failed to create device');
            }
        }
    };

    const handleClose = () => {
        setFormData({
            imei: '',
            device_model: '',
            sim_number: ''
        });
        setErrors({});
        setGeneralError('');
        setSuccessMessage('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {generalError && <Alert severity="error">{generalError}</Alert>}
                    {successMessage && <Alert severity="success">{successMessage}</Alert>}

                    <TextField
                        label="IMEI (15 digits)"
                        name="imei"
                        value={formData.imei}
                        onChange={handleChange}
                        error={!!errors.imei}
                        helperText={errors.imei}
                        fullWidth
                        required
                        inputProps={{ maxLength: 15 }}
                    />
                    <TextField
                        label="Device Model"
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
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddDeviceModal;
