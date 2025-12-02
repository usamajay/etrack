'use client';

import { useState } from 'react';
import api from '@/lib/axios';

interface AddDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeviceAdded: () => void;
}

export default function AddDeviceModal({ isOpen, onClose, onDeviceAdded }: AddDeviceModalProps) {
    const [name, setName] = useState('');
    const [uniqueId, setUniqueId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/devices', { name, unique_id: uniqueId });
            onDeviceAdded();
            onClose();
            setName('');
            setUniqueId('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add device');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-xl font-bold">Add New Device</h2>
                {error && <div className="mb-4 rounded bg-red-100 p-2 text-red-700">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-bold text-gray-700">Device Name</label>
                        <input
                            type="text"
                            className="w-full rounded border px-3 py-2"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-bold text-gray-700">IMEI / Unique ID</label>
                        <input
                            type="text"
                            className="w-full rounded border px-3 py-2"
                            value={uniqueId}
                            onChange={(e) => setUniqueId(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Device'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
