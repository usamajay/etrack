import { create } from 'zustand';
import axios from '../lib/axios';

interface Geofence {
    id: string;
    name: string;
    description?: string;
    type: 'circle' | 'polygon';
    area?: any;
    radius?: number;
    center?: any;
}

interface GeofenceState {
    geofences: Geofence[];
    loading: boolean;
    error: string | null;
    fetchGeofences: () => Promise<void>;
    createGeofence: (data: Partial<Geofence>) => Promise<void>;
    deleteGeofence: (id: string) => Promise<void>;
}

export const useGeofenceStore = create<GeofenceState>((set, get) => ({
    geofences: [],
    loading: false,
    error: null,

    fetchGeofences: async () => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get('/geofences');
            set({ geofences: response.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createGeofence: async (data) => {
        set({ loading: true, error: null });
        try {
            await axios.post('/geofences', data);
            await get().fetchGeofences();
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    deleteGeofence: async (id) => {
        set({ loading: true, error: null });
        try {
            await axios.delete(`/geofences/${id}`);
            await get().fetchGeofences();
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
}));
