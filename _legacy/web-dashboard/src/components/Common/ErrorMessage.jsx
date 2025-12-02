import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

const ErrorMessage = ({ message, retryAction }) => {
    return (
        <Box sx={{ p: 2 }}>
            <Alert
                severity="error"
                icon={<ErrorIcon fontSize="inherit" />}
                action={
                    retryAction && (
                        <Button color="inherit" size="small" onClick={retryAction}>
                            RETRY
                        </Button>
                    )
                }
            >
                <AlertTitle>Error</AlertTitle>
                {message || 'Something went wrong. Please try again.'}
            </Alert>
        </Box>
    );
};

export default ErrorMessage;
