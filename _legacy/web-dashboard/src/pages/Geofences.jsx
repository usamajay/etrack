import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Alert,
    CircularProgress,
    Chip,
    Button
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Add as AddIcon
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { geofencesAPI } from '../services/api';
import GeofenceFormModal from '../components/Geofence/GeofenceFormModal';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Geofences = () => {
    const [geofences, setGeofences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [currentGeofence, setCurrentGeofence] = useState(null);
    const [formData, setFormData] = useState(null);

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const drawnItemsRef = useRef(null);

    // 1. Fetch Geofences
    const fetchGeofences = async () => {
        setLoading(true);
        try {
            const response = await geofencesAPI.getAll();
            setGeofences(response.data);
        } catch (err) {
            console.error("Fetch error:", err);
            setError('Failed to load geofences');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGeofences();
    }, []);

    // 2. Initialize Map (Native Leaflet)
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return; // Prevent double init

        console.log("Initializing Leaflet Map...");

        // Create Map
        const map = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);
        mapInstanceRef.current = map;

        // Add Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Initialize FeatureGroup for Drawn Items
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        drawnItemsRef.current = drawnItems;

        // Initialize Draw Control
        const drawControl = new L.Control.Draw({
            edit: {
                featureGroup: drawnItems,
                edit: false, // We handle editing via the modal/list
                remove: false
            },
            draw: {
                marker: false,
                circlemarker: false,
                polyline: false,
                rectangle: false,
                circle: true,
                polygon: true
            }
        });
        map.addControl(drawControl);

        // Handle Draw Events
        map.on(L.Draw.Event.CREATED, (e) => {
            const type = e.layerType;
            const layer = e.layer;

            let data = {
                type: type,
                name: '',
                organization_id: 1
            };

            if (type === 'circle') {
                data.center_latitude = layer.getLatLng().lat;
                data.center_longitude = layer.getLatLng().lng;
                data.radius = layer.getRadius();
                data.center = [data.center_latitude, data.center_longitude];
            } else if (type === 'polygon') {
                const latlngs = layer.getLatLngs()[0];
                data.coordinates = latlngs.map(ll => [ll.lat, ll.lng]);
                // Calculate center for polygon
                const bounds = layer.getBounds();
                data.center_latitude = bounds.getCenter().lat;
                data.center_longitude = bounds.getCenter().lng;
            }

            setFormData(data);
            setCurrentGeofence(null);
            setOpenModal(true);

            // We don't add the layer to the map permanently here; 
            // it will be added when we refetch geofences after saving.
            // But we can add it temporarily if we want, or just remove it.
            // For now, remove it to avoid duplicates when the list updates.
            // map.addLayer(layer); 
        });

        // Force resize to ensure tiles load
        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        // Cleanup
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // 3. Sync Geofences to Map
    useEffect(() => {
        if (!mapInstanceRef.current || !drawnItemsRef.current) return;

        const map = mapInstanceRef.current;
        const drawnItems = drawnItemsRef.current;

        // Clear existing items
        drawnItems.clearLayers();

        geofences.forEach(geo => {
            let layer;
            if (geo.type === 'circle') {
                layer = L.circle([geo.center_latitude, geo.center_longitude], {
                    color: '#3388ff',
                    fillColor: '#3388ff',
                    fillOpacity: 0.2,
                    radius: geo.radius
                });
            } else if (geo.type === 'polygon' && geo.coordinates) {
                layer = L.polygon(geo.coordinates, {
                    color: '#3388ff',
                    fillColor: '#3388ff',
                    fillOpacity: 0.2
                });
            }

            if (layer) {
                layer.bindPopup(`<b>${geo.name}</b>`);
                layer.on('click', () => handleEdit(geo));
                drawnItems.addLayer(layer);
            }
        });

        // Fit bounds if we have geofences
        if (geofences.length > 0) {
            const bounds = drawnItems.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }

    }, [geofences]);

    // 4. Handlers
    const handleSave = async (data) => {
        try {
            if (currentGeofence) {
                await geofencesAPI.update(currentGeofence.id, data);
            } else {
                await geofencesAPI.create(data);
            }
            setOpenModal(false);
            fetchGeofences();
        } catch (err) {
            console.error("Save error:", err);
            // You might want to show an error message to the user here
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this geofence?')) {
            try {
                await geofencesAPI.delete(id);
                fetchGeofences();
            } catch (err) {
                console.error("Delete error:", err);
                setError('Failed to delete geofence');
            }
        }
    };

    const handleEdit = (geofence) => {
        setCurrentGeofence(geofence);
        setFormData(geofence);
        setOpenModal(true);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Geofences
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {/* Map Section */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={3} sx={{ p: 1, height: '600px', display: 'flex', flexDirection: 'column' }}>
                        <div
                            ref={mapContainerRef}
                            style={{ flexGrow: 1, width: '100%', minHeight: '500px' }}
                        />
                    </Paper>
                </Grid>

                {/* List Section */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ height: '600px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                            <Typography variant="h6">Geofence List</Typography>
                        </Box>

                        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <List>
                                    {geofences.map((geo) => (
                                        <ListItem key={geo.id} divider button onClick={() => handleEdit(geo)}>
                                            <ListItemText
                                                primary={geo.name}
                                                secondary={
                                                    <Chip
                                                        label={geo.type}
                                                        size="small"
                                                        color={geo.type === 'circle' ? 'primary' : 'success'}
                                                        variant="outlined"
                                                        sx={{ mt: 0.5 }}
                                                    />
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton edge="end" onClick={(e) => { e.stopPropagation(); handleDelete(geo.id); }}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                    {geofences.length === 0 && (
                                        <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 3 }}>
                                            No geofences found. Use the map tools to create one.
                                        </Typography>
                                    )}
                                </List>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <GeofenceFormModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSave={handleSave}
                initialData={formData}
            />
        </Box>
    );
};

export default Geofences;
