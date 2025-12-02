'use client';

import { useEffect, useState } from 'react';
import { useDeviceStore } from '../../store/deviceStore';
import AddDeviceModal from './AddDeviceModal';

export default function DeviceList() {
    const { devices, fetchDevices, loading } = useDeviceStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">My Devices</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    Add Device
                </button>
            </div>

            {loading && devices.length === 0 ? (
                <div>Loading...</div>
            ) : (
                <div className="overflow-x-auto rounded-lg border bg-white shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">IMEI</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Update</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {devices.map((device) => (
                                <tr key={device.id}>
                                    <td className="whitespace-nowrap px-6 py-4">{device.name}</td>
                                    <td className="whitespace-nowrap px-6 py-4">{device.unique_id}</td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${device.status === 'online'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {device.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        {device.last_update ? new Date(device.last_update).toLocaleString() : 'Never'}
                                    </td>
                                </tr>
                            ))}
                            {devices.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                        No devices found. Add one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <AddDeviceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onDeviceAdded={fetchDevices}
            />
        </div>
    );
}
