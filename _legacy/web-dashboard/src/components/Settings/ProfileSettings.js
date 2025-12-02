import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ProfileSettings = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: ''
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                phone: user.phone || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await usersAPI.updateProfile(formData);
            setMessage('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('Failed to update profile');
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Profile Settings</Typography>
            {message && <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mb: 2 }}>{message}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Full Name"
                    margin="normal"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
                <TextField
                    fullWidth
                    label="Email"
                    margin="normal"
                    value={formData.email}
                    disabled
                />
                <TextField
                    fullWidth
                    label="Phone"
                    margin="normal"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                    Save Changes
                </Button>
            </Box>
        </Paper>
    );
};

export default ProfileSettings;
