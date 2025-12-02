import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { organizationsAPI } from '../../services/api';

const OrganizationSettings = () => {
    const [settings, setSettings] = useState({
        name: '',
        address: '',
        phone: '',
        speed_limit: 100,
        timezone: 'UTC',
        units: 'km'
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [orgRes, settingsRes] = await Promise.all([
                    organizationsAPI.getDetails(),
                    organizationsAPI.getSettings()
                ]);

                setSettings({
                    ...orgRes.data,
                    ...settingsRes.data
                });
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await organizationsAPI.updateDetails({
                name: settings.name,
                address: settings.address,
                phone: settings.phone
            });

            await organizationsAPI.updateSettings({
                speed_limit: settings.speed_limit,
                timezone: settings.timezone,
                units: settings.units
            });

            setMessage('Organization settings updated successfully');
        } catch (error) {
            console.error('Error updating settings:', error);
            setMessage('Failed to update settings');
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Organization Settings</Typography>
            {message && <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mb: 2 }}>{message}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Organization Name"
                    margin="normal"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                />
                <TextField
                    fullWidth
                    label="Address"
                    margin="normal"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
                <TextField
                    fullWidth
                    label="Phone"
                    margin="normal"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />

                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Preferences</Typography>

                <TextField
                    fullWidth
                    label="Speed Limit Threshold (km/h)"
                    type="number"
                    margin="normal"
                    value={settings.speed_limit}
                    onChange={(e) => setSettings({ ...settings, speed_limit: e.target.value })}
                />

                <FormControl fullWidth margin="normal">
                    <InputLabel>Units</InputLabel>
                    <Select
                        value={settings.units}
                        label="Units"
                        onChange={(e) => setSettings({ ...settings, units: e.target.value })}
                    >
                        <MenuItem value="km">Kilometers (km)</MenuItem>
                        <MenuItem value="mi">Miles (mi)</MenuItem>
                    </Select>
                </FormControl>

                <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                    Save Settings
                </Button>
            </Box>
        </Paper>
    );
};

export default OrganizationSettings;
