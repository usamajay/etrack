import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Typography,
    Box,
    Button
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { vehiclesAPI } from '../../services/api';

const VehicleList = () => {
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const response = await vehiclesAPI.getAll();
            setVehicles(response.data);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this vehicle?')) {
            try {
                await vehiclesAPI.delete(id);
                fetchVehicles();
            } catch (error) {
                console.error('Error deleting vehicle:', error);
            }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Vehicles</Typography>
                <Button variant="contained" startIcon={<AddIcon />}>
                    Add Vehicle
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Registration</TableCell>
                            <TableCell>Model</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {vehicles.map((vehicle) => (
                            <TableRow key={vehicle.id}>
                                <TableCell>{vehicle.name}</TableCell>
                                <TableCell>{vehicle.registration_number}</TableCell>
                                <TableCell>{vehicle.model}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={vehicle.is_active ? 'Active' : 'Inactive'}
                                        color={vehicle.is_active ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton size="small" color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(vehicle.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {vehicles.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No vehicles found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default VehicleList;
