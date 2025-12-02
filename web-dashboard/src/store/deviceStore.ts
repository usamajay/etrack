import { create } from 'zustand';
import api from '../lib/axios';

interface Device {
    id: number;
    name: string;
    unique_id: string;
    status: string;
    last_update: string;
    last_position?: {
        latitude: number;
        longitude: number;
        speed: number;
        course: number;
        timestamp: string;
    };
}

interface DeviceState {
    devices: Device[];
    loading: boolean;
    error: string | null;
    fetchDevices: () => Promise<void>;
    updateDevicePosition: (data: any) => void;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
    devices: [],
    loading: false,
    error: null,

    fetchDevices: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/devices');
            set({ devices: response.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    updateDevicePosition: (data: any) => {
        const { devices } = get();
        // Assuming data contains deviceId or unique_id to match
        // The backend emits data with deviceId (which is usually the IMEI/unique_id)

        const updatedDevices = devices.map((device) => {
            if (device.unique_id === data.deviceId) {
                return {
                    ...device,
                    last_position: {
                        latitude: data.latitude,
                        longitude: data.longitude,
                        speed: data.speed,
                        course: data.course,
                        timestamp: data.fixTime,
                    },
                    status: 'online', // Update status on new position
                    last_update: new Date().toISOString(),
                };
            }
            return device;
        });

        set({ devices: updatedDevices });
    },
}));
