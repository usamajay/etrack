import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Grid,
    Paper,
    Alert
} from '@mui/material';
import { usersAPI } from '../../services/api';

const SecuritySettings = () => {
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleChangePassword = async () => {
        setMessage({ type: '', text: '' });
        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (!passwords.currentPassword) {
            setMessage({ type: 'error', text: 'Current password is required.' });
            return;
        }

        setLoading(true);
        try {
            await usersAPI.updatePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
            {message.text && (
                <Alert severity={message.type} sx={{ mb: 2 }}>
                    {message.text}
                </Alert>
            )}

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Change Password</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Ensure your account is using a long, random password to stay secure.
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            type="password"
                            label="Current Password"
                            name="currentPassword"
                            value={passwords.currentPassword}
                            onChange={handlePasswordChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="password"
                            label="New Password"
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={handlePasswordChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="password"
                            label="Confirm New Password"
                            name="confirmPassword"
                            value={passwords.confirmPassword}
                            onChange={handlePasswordChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button variant="contained" color="primary" onClick={handleChangePassword} disabled={loading}>
                            Change Password
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default SecuritySettings;
