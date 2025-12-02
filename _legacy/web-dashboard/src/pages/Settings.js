import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import ProfileSettings from '../components/Settings/ProfileSettings';
import OrganizationSettings from '../components/Settings/OrganizationSettings';

const Settings = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">Settings</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <ProfileSettings />
                </Grid>
                <Grid item xs={12} md={6}>
                    <OrganizationSettings />
                </Grid>
            </Grid>
        </Box>
    );
};

export default Settings;
