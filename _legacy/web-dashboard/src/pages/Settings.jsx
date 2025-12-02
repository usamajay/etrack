import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper
} from '@mui/material';
import {
    Person as PersonIcon,
    Business as BusinessIcon,
    Settings as SettingsIcon,
    Notifications as NotificationsIcon,
    Group as GroupIcon,
    Security as SecurityIcon
} from '@mui/icons-material';
import ProfileForm from '../components/Settings/ProfileForm';
import SecuritySettings from '../components/Settings/SecuritySettings';
import { useAuth } from '../contexts/AuthContext';

// TabPanel Component
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const Settings = () => {
    const [value, setValue] = useState(0);
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                Settings
            </Typography>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="settings tabs"
                >
                    <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" />
                    <Tab icon={<SecurityIcon />} iconPosition="start" label="Security" />
                    <Tab icon={<BusinessIcon />} iconPosition="start" label="Organization" />
                    <Tab icon={<SettingsIcon />} iconPosition="start" label="Preferences" />
                    <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notifications" />
                    {isAdmin && <Tab icon={<GroupIcon />} iconPosition="start" label="Users" />}
                </Tabs>
            </Paper>

            <TabPanel value={value} index={0}>
                <ProfileForm />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <SecuritySettings />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <Typography variant="h6" color="text.secondary" align="center">
                    Organization Settings (Coming Soon)
                </Typography>
            </TabPanel>
            <TabPanel value={value} index={3}>
                <Typography variant="h6" color="text.secondary" align="center">
                    Preferences (Coming Soon)
                </Typography>
            </TabPanel>
            <TabPanel value={value} index={4}>
                <Typography variant="h6" color="text.secondary" align="center">
                    Notification Settings (Coming Soon)
                </Typography>
            </TabPanel>
            {isAdmin && (
                <TabPanel value={value} index={5}>
                    <Typography variant="h6" color="text.secondary" align="center">
                        User Management (Coming Soon)
                    </Typography>
                </TabPanel>
            )}
        </Box>
    );
};

export default Settings;
