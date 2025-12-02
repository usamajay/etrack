import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
};

export const vehiclesAPI = {
    getAll: () => api.get('/vehicles'),
    getOne: (id) => api.get(`/vehicles/${id}`),
    create: (data) => api.post('/vehicles', data),
    update: (id, data) => api.put(`/vehicles/${id}`, data),
    delete: (id) => api.delete(`/vehicles/${id}`),
    getPosition: (id) => api.get(`/vehicles/${id}/position`),
};

export const positionsAPI = {
    getHistory: (vehicleId, params) => api.get(`/positions/${vehicleId}/history`, { params }),
};

export const tripsAPI = {
    getAll: (params) => api.get('/trips', { params }),
    getOne: (id) => api.get(`/trips/${id}`),
};

export const alertsAPI = {
    getAll: (params) => api.get('/alerts', { params }),
    markAsRead: (id) => api.put(`/alerts/${id}/read`),
    delete: (id) => api.delete(`/alerts/${id}`),
};

export const devicesAPI = {
    getAll: () => api.get('/devices'),
    getOne: (id) => api.get(`/devices/${id}`),
    create: (data) => api.post('/devices', data),
    update: (id, data) => api.put(`/devices/${id}`, data),
    delete: (id) => api.delete(`/devices/${id}`),
};

export const commandsAPI = {
    create: (data) => api.post('/commands', data),
    getOne: (id) => api.get(`/commands/${id}`),
    getHistory: (deviceId) => api.get(`/commands`, { params: { device_id: deviceId, limit: 5 } }),
};

export const reportsAPI = {
    getDaily: (vehicleId, date) => api.get(`/reports/daily/${vehicleId}`, { params: { date } }),
    getWeekly: (vehicleId, startDate) => api.get(`/reports/weekly/${vehicleId}`, { params: { start_date: startDate } }),
    getMonthly: (vehicleId, month, year) => api.get(`/reports/monthly/${vehicleId}`, { params: { month, year } }),
};

export const geofencesAPI = {
    getAll: () => api.get('/geofences'),
    create: (data) => api.post('/geofences', data),
    update: (id, data) => api.put(`/geofences/${id}`, data),
    delete: (id) => api.delete(`/geofences/${id}`),
};

export const analyticsAPI = {
    getOrganizationStats: () => api.get('/analytics/organization'),
    getVehicleStats: (vehicleId, period) => api.get(`/analytics/vehicle/${vehicleId}`, { params: { period } }),
    getFleetStats: (period) => api.get('/analytics/fleet', { params: { period } }),
};

export const usersAPI = {
    updateProfile: (data) => api.put('/users/profile', data),
    updatePassword: (data) => api.put('/users/password', data),
    uploadAvatar: (formData) => api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const organizationsAPI = {
    getDetails: () => api.get('/organizations'),
    updateDetails: (data) => api.put('/organizations', data),
    getSettings: () => api.get('/organizations/settings'),
    updateSettings: (data) => api.put('/organizations/settings', data),
};

export default api;
