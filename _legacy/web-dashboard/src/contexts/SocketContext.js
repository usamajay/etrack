import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import webSocketService from '../services/websocket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            const token = localStorage.getItem('token');
            webSocketService.connect(token);
        } else {
            webSocketService.disconnect();
        }

        return () => {
            webSocketService.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={webSocketService}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
