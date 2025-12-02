import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Avatar,
    Typography,
    Grid,
    Paper,
    Alert,
    IconButton,
    Input,
    Divider
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { usersAPI, authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ProfileForm = () => {
    const { user, setUser } = useAuth(); // Assuming setUser updates the context
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || '',
            });
            setAvatarPreview(user.avatar_url);
        }
    }, [user]);

    const handleInfoChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };



    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            // 1. Upload Avatar if changed
            if (avatarFile) {
                const avatarData = new FormData();
                avatarData.append('avatar', avatarFile);
                await usersAPI.uploadAvatar(avatarData);
            }

            // 2. Update Profile Info
            const response = await usersAPI.updateProfile({
                full_name: formData.full_name,
                phone: formData.phone
            });

            // Update local user context if possible, or refetch
            // Assuming response.data contains updated user
            // setUser(response.data); 

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile.' });
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

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Profile Information</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={avatarPreview}
                            alt={formData.full_name}
                            sx={{ width: 100, height: 100 }}
                        />
                        <label htmlFor="icon-button-file">
                            <Input accept="image/*" id="icon-button-file" type="file" sx={{ display: 'none' }} onChange={handleAvatarChange} />
                            <IconButton color="primary" aria-label="upload picture" component="span" sx={{ position: 'absolute', bottom: -10, right: -10, bgcolor: 'background.paper' }}>
                                <PhotoCamera />
                            </IconButton>
                        </label>
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">{formData.full_name}</Typography>
                        <Typography variant="body2" color="text.secondary">{formData.email}</Typography>
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Full Name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInfoChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            value={formData.email}
                            InputProps={{ readOnly: true }}
                            disabled
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInfoChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button variant="contained" onClick={handleSaveProfile} disabled={loading}>
                            Save Profile
                        </Button>
                    </Grid>
                </Grid>
            </Paper>


        </Box>
    );
};

export default ProfileForm;
