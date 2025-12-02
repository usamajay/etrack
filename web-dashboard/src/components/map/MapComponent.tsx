'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { useDeviceStore } from '../../store/deviceStore';
import { useGeofenceStore } from '../../store/geofenceStore';
import io from 'socket.io-client';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LeafletDrawControl = () => {
    const map = useMap();
    const { createGeofence } = useGeofenceStore();

    useEffect(() => {
        const editableLayers = new L.FeatureGroup();
        map.addLayer(editableLayers);

        const drawControl = new L.Control.Draw({
            draw: {
                polyline: false,
                rectangle: false,
                circlemarker: false,
                marker: false,
                circle: {}, // Enable with default options
                polygon: {}, // Enable with default options
            },
            edit: {
                featureGroup: editableLayers,
                remove: true,
            },
        });

        map.addControl(drawControl);

        const onCreated = (e: any) => {
            const type = e.layerType;
            const layer = e.layer;

            if (type === 'circle') {
                const center = layer.getLatLng();
                const radius = layer.getRadius();

                createGeofence({
                    name: `Geofence ${new Date().toLocaleTimeString()}`,
                    type: 'circle',
                    radius: radius,
                    center: { type: 'Point', coordinates: [center.lng, center.lat] },
                });
            } else if (type === 'polygon') {
                const latlngs = layer.getLatLngs()[0];
                const coordinates = latlngs.map((ll: any) => [ll.lng, ll.lat]);
                coordinates.push([latlngs[0].lng, latlngs[0].lat]);

                createGeofence({
                    name: `Geofence ${new Date().toLocaleTimeString()}`,
                    type: 'polygon',
                    area: { type: 'Polygon', coordinates: [coordinates] },
                });
            }
        };

        map.on(L.Draw.Event.CREATED, onCreated);

        return () => {
            map.removeControl(drawControl);
            map.off(L.Draw.Event.CREATED, onCreated);
            map.removeLayer(editableLayers);
        };
    }, [map, createGeofence]);

    return null;
};

export default function MapComponent() {
    const { devices, updateDevicePosition } = useDeviceStore();
    const { geofences, fetchGeofences } = useGeofenceStore();

    useEffect(() => {
        fetchGeofences();
        const socket = io('http://localhost:3001');

        socket.on('connect', () => {
            console.log('Connected to WebSocket');
        });

        socket.on('position', (data: any) => {
            console.log('New position:', data);
            updateDevicePosition(data);
        });

        return () => {
            socket.disconnect();
        };
    }, [updateDevicePosition, fetchGeofences]);

    return (
        <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <LeafletDrawControl />

            {devices.map((device) => (
                device.last_position && (
                    <Marker
                        key={device.id}
                        position={[device.last_position.latitude, device.last_position.longitude]}
                    >
                        <Popup>
                            <div className="p-2">
                                <h3 className="font-bold">{device.name}</h3>
                                <p>Speed: {device.last_position.speed} km/h</p>
                                <p>Status: {device.status}</p>
                            </div>
                        </Popup>
                    </Marker>
                )
            ))}

            {geofences.map((geofence) => {
                if (geofence.type === 'circle' && geofence.center && geofence.radius) {
                    return (
                        <Circle
                            key={geofence.id}
                            center={[geofence.center.coordinates[1], geofence.center.coordinates[0]]}
                            radius={geofence.radius}
                            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
                        >
                            <Popup>{geofence.name}</Popup>
                        </Circle>
                    );
                } else if (geofence.type === 'polygon' && geofence.area) {
                    const positions = geofence.area.coordinates[0].map((coord: any) => [coord[1], coord[0]]);
                    return (
                        <Polygon
                            key={geofence.id}
                            positions={positions}
                            pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.2 }}
                        >
                            <Popup>{geofence.name}</Popup>
                        </Polygon>
                    );
                }
                return null;
            })}
        </MapContainer>
    );
}
