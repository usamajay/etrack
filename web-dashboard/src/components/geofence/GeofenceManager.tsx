'use client';

import { useEffect } from 'react';
import { useGeofenceStore } from '../../store/geofenceStore';

export default function GeofenceManager() {
    const { geofences, fetchGeofences, deleteGeofence, loading } = useGeofenceStore();

    useEffect(() => {
        fetchGeofences();
    }, [fetchGeofences]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md max-h-[400px] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Geofences</h2>

            {loading && <p>Loading...</p>}

            {!loading && geofences.length === 0 && (
                <p className="text-gray-500">No geofences found. Draw one on the map!</p>
            )}

            <ul className="space-y-2">
                {geofences.map((geofence) => (
                    <li key={geofence.id} className="flex justify-between items-center p-2 border rounded hover:bg-gray-50">
                        <div>
                            <p className="font-semibold">{geofence.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{geofence.type}</p>
                        </div>
                        <button
                            onClick={() => deleteGeofence(geofence.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
