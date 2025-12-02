'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DeviceList from '@/components/dashboard/DeviceList';
import GeofenceManager from '@/components/geofence/GeofenceManager';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => <p>Loading Map...</p>,
});

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!useAuthStore.getState().isAuthenticated) {
        router.push('/auth/login');
      }
    };
    checkAuth();
  }, [router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-white shadow z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-xl font-bold text-blue-600">eTrack</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={() => {
                  useAuthStore.getState().logout();
                  router.push('/auth/login');
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-100px)]">
          <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2">
            <DeviceList />
            <GeofenceManager />
          </div>
          <div className="lg:col-span-3 bg-white rounded-lg shadow-md overflow-hidden relative z-0">
            <MapComponent />
          </div>
        </div>
      </div>
    </main>
  );
}
