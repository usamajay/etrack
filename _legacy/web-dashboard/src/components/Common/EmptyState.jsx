import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';

const EmptyState = ({ message, icon, actionLabel, onAction }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: 300,
                p: 3,
                textAlign: 'center'
            }}
        >
            <Box sx={{ color: 'text.secondary', mb: 2, '& svg': { fontSize: 60 } }}>
                {icon || <InboxIcon />}
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                {message || 'No data available'}
            </Typography>
            {actionLabel && onAction && (
                <Button variant="contained" color="primary" onClick={onAction} sx={{ mt: 2 }}>
                    {actionLabel}
                </Button>
            )}
        </Box>
    );
};

export default EmptyState;
