import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    TablePagination,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { vehiclesAPI } from '../services/api';
import AddVehicleModal from '../components/Vehicle/AddVehicleModal';

const Vehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openAddModal, setOpenAddModal] = useState(false);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const response = await vehiclesAPI.getAll();
            setVehicles(response.data);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPage(0);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDeleteVehicle = async (id) => {
        if (window.confirm('Are you sure you want to delete this vehicle?')) {
            try {
                await vehiclesAPI.delete(id);
                fetchVehicles();
            } catch (error) {
                console.error('Error deleting vehicle:', error);
            }
        }
    };

    const filteredVehicles = vehicles.filter((vehicle) =>
        vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Vehicles</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenAddModal(true)}
                >
                    Add Vehicle
                </Button>
            </Box>

            <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search by name or registration number..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    size="small"
                />
            </Paper>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell>Name</TableCell>
                            <TableCell>Registration</TableCell>
                            <TableCell>Model</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Last Updated</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredVehicles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    <Typography color="textSecondary">No vehicles found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredVehicles
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((vehicle) => (
                                    <TableRow key={vehicle.id} hover>
                                        <TableCell fontWeight="medium">{vehicle.name}</TableCell>
                                        <TableCell>{vehicle.registration_number}</TableCell>
                                        <TableCell>{vehicle.model || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={vehicle.is_active ? 'Active' : 'Inactive'}
                                                color={vehicle.is_active ? 'success' : 'default'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                color="info"
                                                title="View Details"
                                                onClick={() => window.location.href = `/vehicles/${vehicle.id}`} // Using href for now, better to use useNavigate if available or Link
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                // Edit functionality to be added later or reused with modal
                                                onClick={() => { }}
                                                title="Edit"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                                title="Delete"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredVehicles.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>

            <AddVehicleModal
                open={openAddModal}
                onClose={() => setOpenAddModal(false)}
                onSuccess={fetchVehicles}
            />
        </Box>
    );
};

export default Vehicles;
