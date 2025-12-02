import React, { useState, useEffect } from 'react';
import {
    IconButton,
    Badge,
    Popover,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Button,
    Divider,
    Link
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Error as ErrorIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../../contexts/SocketContext';
import { alertsAPI } from '../../services/api';

// Assuming a sound file exists or using a placeholder URL for now
const alertSoundUrl = '/assets/sounds/alert.mp3';

const NotificationCenter = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socket = useSocket();
    const navigate = useNavigate();

    // Simple HTML5 Audio for sound
    const playSound = () => {
        const audio = new Audio(alertSoundUrl);
        audio.play().catch(e => console.log("Audio play failed", e));
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (socket) {
            const handleNewAlert = (alert) => {
                setNotifications(prev => [alert, ...prev].slice(0, 10)); // Keep last 10
                setUnreadCount(prev => prev + 1);

                if (alert.severity === 'high' || alert.severity === 'critical') {
                    playSound();
                }
            };

            socket.on('new_alert', handleNewAlert);

            return () => {
                socket.off('new_alert', handleNewAlert);
            };
        }
    }, [socket]);

    const fetchNotifications = async () => {
        try {
            const response = await alertsAPI.getAll({ limit: 5, read: false });
            // Assuming API returns { data: [], unread_count: 0 } or similar
            // Adjust based on actual API response structure
            setNotifications(response.data.data || response.data);
            // If API doesn't return count, calculate it or fetch separately
            // For now assuming response.data is the list
            setUnreadCount(response.data.length || 0);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = async (id, event) => {
        event.stopPropagation();
        try {
            await alertsAPI.markAsRead(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const handleViewAll = () => {
        handleClose();
        navigate('/alerts');
    };

    const getIcon = (severity) => {
        switch (severity) {
            case 'critical': return <ErrorIcon color="error" />;
            case 'high': return <WarningIcon color="error" />;
            case 'medium': return <WarningIcon color="warning" />;
            case 'low': return <InfoIcon color="info" />;
            default: return <NotificationsIcon />;
        }
    };

    const open = Boolean(anchorEl);
    const id = open ? 'notification-popover' : undefined;

    return (
        <>
            <IconButton color="inherit" onClick={handleClick}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <Box sx={{ width: 320, maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Notifications</Typography>
                        {unreadCount > 0 && (
                            <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={() => {
                                // Mark all as read logic could go here
                            }}>
                                Mark all read
                            </Typography>
                        )}
                    </Box>
                    <Divider />
                    <List sx={{ overflow: 'auto', flexGrow: 1, p: 0 }}>
                        {notifications.length === 0 ? (
                            <ListItem>
                                <ListItemText primary="No new notifications" sx={{ textAlign: 'center', color: 'text.secondary' }} />
                            </ListItem>
                        ) : (
                            notifications.map((notification) => (
                                <ListItem
                                    key={notification.id}
                                    alignItems="flex-start"
                                    secondaryAction={
                                        <IconButton edge="end" aria-label="mark as read" size="small" onClick={(e) => handleMarkAsRead(notification.id, e)}>
                                            <CheckCircleIcon fontSize="small" />
                                        </IconButton>
                                    }
                                    sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'transparent' }}>
                                            {getIcon(notification.severity)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={notification.type.replace('_', ' ').toUpperCase()}
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2" color="text.primary">
                                                    {notification.message}
                                                </Typography>
                                                <br />
                                                <Typography component="span" variant="caption" color="text.secondary">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))
                        )}
                    </List>
                    <Divider />
                    <Box sx={{ p: 1, textAlign: 'center' }}>
                        <Button color="primary" fullWidth onClick={handleViewAll}>
                            View All Alerts
                        </Button>
                    </Box>
                </Box>
            </Popover>
        </>
    );
};

export default NotificationCenter;
