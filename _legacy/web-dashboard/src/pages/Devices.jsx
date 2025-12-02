import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    TextField,
    InputAdornment,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Terminal as TerminalIcon
} from '@mui/icons-material';
import { devicesAPI } from '../services/api';
import DeviceFormModal from '../components/Device/DeviceFormModal';
import SendCommandModal from '../components/Device/SendCommandModal';
import { format } from 'date-fns';

const Devices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [openModal, setOpenModal] = useState(false);
    const [currentDevice, setCurrentDevice] = useState(null);
    const [openCommandModal, setOpenCommandModal] = useState(false);
    const [selectedDeviceForCommand, setSelectedDeviceForCommand] = useState(null);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await devicesAPI.getAll();
            setDevices(response.data);
        } catch (err) {
            console.error("Error fetching devices:", err);
            setError('Failed to load devices');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data) => {
        try {
            if (currentDevice) {
                await devicesAPI.update(currentDevice.id, data);
            } else {
                await devicesAPI.create(data);
            }
            setOpenModal(false);
            fetchDevices();
        } catch (err) {
            console.error("Error saving device:", err);
            alert("Failed to save device");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this device?')) {
            try {
                await devicesAPI.delete(id);
                fetchDevices();
            } catch (err) {
                console.error("Error deleting device:", err);
                alert("Failed to delete device");
            }
        }
    };

    const handleEdit = (device) => {
        setCurrentDevice(device);
        setOpenModal(true);
    };

    const handleAdd = () => {
        setCurrentDevice(null);
        setOpenModal(true);
    };

    const handleOpenCommand = (device) => {
        setSelectedDeviceForCommand(device);
        setOpenCommandModal(true);
    };

    const filteredDevices = devices.filter(device => {
        const matchesSearch = device.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (device.device_model && device.device_model.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || device.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Devices</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                >
                    Add Device
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Search by IMEI or Model"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ flexGrow: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="online">Online</MenuItem>
                            <MenuItem value="offline">Offline</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>IMEI</TableCell>
                            <TableCell>Model</TableCell>
                            <TableCell>SIM Number</TableCell>
                            <TableCell>Assigned Vehicle</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Last Connection</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredDevices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No devices found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDevices.map((device) => (
                                <TableRow key={device.id}>
                                    <TableCell>{device.imei}</TableCell>
                                    <TableCell>{device.device_model}</TableCell>
                                    <TableCell>{device.sim_number || '-'}</TableCell>
                                    <TableCell>
                                        {device.vehicle ? (
                                            <Chip label={device.vehicle.license_plate} size="small" />
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">Unassigned</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    bgcolor: device.status === 'online' ? 'success.main' : 'error.main'
                                                }}
                                            />
                                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                {device.status || 'Offline'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {device.last_connection ? format(new Date(device.last_connection), 'MMM dd, yyyy HH:mm') : '-'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEdit(device)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" color="primary" onClick={() => handleOpenCommand(device)} title="Send Command">
                                            <TerminalIcon />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(device.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <DeviceFormModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSave={handleSave}
                initialData={currentDevice}
            />

            <SendCommandModal
                open={openCommandModal}
                onClose={() => setOpenCommandModal(false)}
                device={selectedDeviceForCommand}
            />
        </Box>
    );
};

export default Devices;
