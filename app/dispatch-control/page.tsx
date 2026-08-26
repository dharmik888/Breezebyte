'use client';

import { useState, useEffect } from 'react';
import {
  Ambulance,
  Pill,
  MapPin,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Navigation,
  Package,
  Hospital,
} from 'lucide-react';

interface AmbulanceDispatch {
  id: string;
  type: 'ambulance';
  status: string;
  createdAt: number;
  village: { id: string; name: string; lat: number; lng: number } | null;
  hospital: { id: string; name: string; lat: number; lng: number } | null;
  ambulance: {
    id: string;
    status: string;
    currentLocation: string;
    etaMinutes: number | null;
  } | null;
  specialty: string;
  urgency: string;
  route: string[];
  ambulanceRoute: string[];
  timing: {
    elapsedMinutes: number;
    remainingMinutes: number;
    estimatedArrival: number | null;
    waitTimeMinutes: number | null;
  };
}

interface MedicineTransfer {
  id: string;
  type: 'medicine';
  status: 'in-transit' | 'completed';
  createdAt: number;
  medicine: { medicine: string; quantity: number; source: string } | null;
  from: { id: string; name: string; type: string } | null;
  to: { id: string; name: string; type: string } | null;
  hospital: { id: string; name: string } | null;
  route: string[];
  distance: number;
  timing: {
    elapsedMinutes: number;
    remainingMinutes: number;
    totalMinutes: number;
    estimatedCompletion: number;
  };
  priority: string;
  rationale: string;
}

export default function DispatchControlPage() {
  const [ambulanceDispatches, setAmbulanceDispatches] = useState<AmbulanceDispatch[]>([]);
  const [medicineTransfers, setMedicineTransfers] = useState<MedicineTransfer[]>([]);
  const [summary, setSummary] = useState({
    activeAmbulances: 0,
    activeMedicineTransfers: 0,
    totalAmbulances: 0,
    totalMedicineTransfers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'ambulance' | 'medicine'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchDispatches = async () => {
    try {
      const response = await fetch(
        `/api/dispatch-status?type=${activeTab}&status=${statusFilter}`
      );
      const data = await response.json();

      setAmbulanceDispatches(data.ambulanceDispatches || []);
      setMedicineTransfers(data.medicineTransfers || []);
      setSummary(data.summary || {});
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to fetch dispatches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
    const interval = setInterval(fetchDispatches, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [activeTab, statusFilter]);

  const handleCancelDispatch = async (dispatchId: string, type: string) => {
    if (!confirm('Are you sure you want to cancel this dispatch?')) return;

    try {
      const response = await fetch('/api/dispatch-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatchId, type, action: 'cancel' }),
      });

      if (response.ok) {
        alert('Dispatch cancelled successfully');
        fetchDispatches();
      } else {
        const data = await response.json();
        alert(`Failed to cancel: ${data.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const handleCompleteDispatch = async (dispatchId: string, type: string) => {
    try {
      const response = await fetch('/api/dispatch-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatchId, type, action: 'complete' }),
      });

      if (response.ok) {
        alert('Dispatch completed successfully');
        fetchDispatches();
      } else {
        const data = await response.json();
        alert(`Failed to complete: ${data.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
      case 'in-transit':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                <Activity className="w-10 h-10 text-blue-600" />
                Dispatch Control Center
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time monitoring and management of ambulance and medicine dispatches
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Last Updated</div>
              <div className="text-lg font-semibold text-gray-700">{lastUpdate}</div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Ambulances</p>
                <p className="text-3xl font-bold text-blue-600">
                  {summary.activeAmbulances}
                </p>
              </div>
              <Ambulance className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Transfers</p>
                <p className="text-3xl font-bold text-green-600">
                  {summary.activeMedicineTransfers}
                </p>
              </div>
              <Pill className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ambulances</p>
                <p className="text-3xl font-bold text-purple-600">
                  {summary.totalAmbulances}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transfers</p>
                <p className="text-3xl font-bold text-orange-600">
                  {summary.totalMedicineTransfers}
                </p>
              </div>
              <Package className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Type:</label>
              <div className="inline-flex gap-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab('ambulance')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'ambulance'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Ambulance className="w-4 h-4" />
                  Ambulances
                </button>
                <button
                  onClick={() => setActiveTab('medicine')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'medicine'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Pill className="w-4 h-4" />
                  Medicine
                </button>
              </div>
            </div>

            <div className="flex-1"></div>

            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ambulance Dispatches */}
        {(activeTab === 'all' || activeTab === 'ambulance') && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Ambulance className="w-6 h-6 text-blue-600" />
              Ambulance Dispatches ({ambulanceDispatches.length})
            </h2>

            {ambulanceDispatches.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
                <Ambulance className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>No ambulance dispatches found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ambulanceDispatches.map((dispatch) => (
                  <div
                    key={dispatch.id}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Ambulance className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-800">
                              {dispatch.village?.name || 'Unknown Village'}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                                dispatch.status
                              )}`}
                            >
                              {dispatch.status.toUpperCase()}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full border ${getUrgencyColor(
                                dispatch.urgency
                              )}`}
                            >
                              {dispatch.urgency.toUpperCase()} PRIORITY
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Specialty: {dispatch.specialty} • ID: {dispatch.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {dispatch.status === 'assigned' && (
                          <>
                            <button
                              onClick={() => handleCompleteDispatch(dispatch.id, 'ambulance')}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Complete
                            </button>
                            <button
                              onClick={() => handleCancelDispatch(dispatch.id, 'ambulance')}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">From</p>
                          <p className="font-medium text-gray-800">
                            {dispatch.ambulance?.currentLocation || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Hospital className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">To</p>
                          <p className="font-medium text-gray-800">
                            {dispatch.hospital?.name || 'Not Assigned'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="font-medium text-gray-800">
                            {dispatch.timing.remainingMinutes > 0
                              ? `${dispatch.timing.remainingMinutes} min remaining`
                              : 'Arrived'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {dispatch.status === 'assigned' && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Navigation className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-medium text-gray-700">Live Tracking</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Elapsed</p>
                            <p className="font-bold text-blue-600">
                              {dispatch.timing.elapsedMinutes} min
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">ETA</p>
                            <p className="font-bold text-blue-600">
                              {dispatch.timing.waitTimeMinutes} min
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Ambulance Status</p>
                            <p className="font-bold text-blue-600">
                              {dispatch.ambulance?.status || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Medicine Transfers */}
        {(activeTab === 'all' || activeTab === 'medicine') && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Pill className="w-6 h-6 text-green-600" />
              Medicine Transfers ({medicineTransfers.length})
            </h2>

            {medicineTransfers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
                <Pill className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>No medicine transfers found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {medicineTransfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-green-100 p-3 rounded-lg">
                          <Pill className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-800">
                              {transfer.medicine?.medicine || 'Unknown Medicine'}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                                transfer.status
                              )}`}
                            >
                              {transfer.status.toUpperCase()}
                            </span>
                            {transfer.priority && (
                              <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">
                                {transfer.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Quantity: {transfer.medicine?.quantity || 0} units • ID:{' '}
                            {transfer.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">From</p>
                          <p className="font-medium text-gray-800">
                            {transfer.from?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transfer.from?.type || ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Hospital className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">To</p>
                          <p className="font-medium text-gray-800">
                            {transfer.to?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transfer.to?.type || ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="font-medium text-gray-800">
                            {transfer.status === 'in-transit'
                              ? `${transfer.timing.remainingMinutes} min remaining`
                              : 'Delivered'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {transfer.status === 'in-transit' && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Navigation className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-medium text-gray-700">
                            Transfer Progress
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm mb-2">
                          <div>
                            <p className="text-gray-600">Elapsed</p>
                            <p className="font-bold text-green-600">
                              {transfer.timing.elapsedMinutes} min
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Remaining</p>
                            <p className="font-bold text-green-600">
                              {transfer.timing.remainingMinutes} min
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Distance</p>
                            <p className="font-bold text-green-600">
                              {transfer.distance.toFixed(1)} km
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${
                                (transfer.timing.elapsedMinutes /
                                  transfer.timing.totalMinutes) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {transfer.rationale && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        {transfer.rationale}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
