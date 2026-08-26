'use client';

import { useState } from 'react';
import { ArrowRight, Ambulance, Pill, MapPin, Clock, TrendingUp } from 'lucide-react';

interface RouteNode {
  id: string;
  label: string;
  type: string;
  lat: number;
  lng: number;
}

interface Route {
  path: string[];
  totalDistance: number;
  estimatedMinutes: number;
  nodes: RouteNode[];
}

export default function RoutingDemoPage() {
  const [ambulanceResult, setAmbulanceResult] = useState<any>(null);
  const [medicineResult, setMedicineResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ambulance' | 'medicine'>('ambulance');

  // Ambulance dispatch form
  const [villageId, setVillageId] = useState('');
  const [specialty, setSpecialty] = useState('emergency');
  const [urgency, setUrgency] = useState('high');

  // Medicine transfer form
  const [hospitalId, setHospitalId] = useState('');
  const [medicineName, setMedicineName] = useState('aspirin');
  const [quantity, setQuantity] = useState(100);

  const [villages, setVillages] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);

  // Load nodes on mount
  useState(() => {
    fetch('/api/scenario')
      .then((res) => res.json())
      .then((data) => {
        const villageNodes = data.nodes?.filter((n: any) => n.type === 'village') || [];
        const hospitalNodes = data.nodes?.filter((n: any) => n.type === 'hospital') || [];
        setVillages(villageNodes);
        setHospitals(hospitalNodes);
        if (villageNodes.length > 0) setVillageId(villageNodes[0].id);
        if (hospitalNodes.length > 0) setHospitalId(hospitalNodes[0].id);
      });
  });

  const handleAmbulanceDispatch = async () => {
    setLoading(true);
    setAmbulanceResult(null);

    try {
      const response = await fetch('/api/ambulance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ villageId, specialty, urgency }),
      });

      const data = await response.json();

      if (response.ok) {
        setAmbulanceResult(data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Request failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineTransfer = async () => {
    setLoading(true);
    setMedicineResult(null);

    try {
      const response = await fetch('/api/medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId, medicineName, quantity }),
      });

      const data = await response.json();

      if (response.ok) {
        setMedicineResult(data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Request failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Intelligent Routing System
        </h1>
        <p className="text-gray-600 mb-8">
          Ambulance dispatch and medicine transfer optimization
        </p>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('ambulance')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'ambulance'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Ambulance className="w-5 h-5" />
            Ambulance Dispatch
          </button>
          <button
            onClick={() => setActiveTab('medicine')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'medicine'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Pill className="w-5 h-5" />
            Medicine Transfer
          </button>
        </div>

        {/* Ambulance Dispatch Section */}
        {activeTab === 'ambulance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Request Ambulance
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Village Location
                  </label>
                  <select
                    value={villageId}
                    onChange={(e) => setVillageId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {villages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Specialty
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="emergency">Emergency</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="neurology">Neurology</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="orthopedics">Orthopedics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="high">High - Critical</option>
                    <option value="medium">Medium - Urgent</option>
                    <option value="low">Low - Routine</option>
                  </select>
                </div>

                <button
                  onClick={handleAmbulanceDispatch}
                  disabled={loading || !villageId}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Ambulance className="w-5 h-5" />
                      Dispatch Ambulance
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Dispatch Results
              </h2>

              {ambulanceResult ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      ✓ Ambulance Successfully Dispatched
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <p className="text-sm text-gray-600">Assigned Hospital</p>
                    <p className="text-lg font-bold text-gray-800">
                      {ambulanceResult.dispatch.hospital.label}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-gray-600">Ambulance ETA</p>
                      </div>
                      <p className="text-xl font-bold text-blue-600">
                        {ambulanceResult.dispatch.timing.ambulanceArrivalMinutes} min
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <p className="text-xs text-gray-600">Hospital ETA</p>
                      </div>
                      <p className="text-xl font-bold text-purple-600">
                        {ambulanceResult.dispatch.timing.hospitalArrivalMinutes} min
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <p className="text-sm font-medium text-gray-700">Route</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ambulanceResult.dispatch.routes.ambulanceToVillage.nodes.map(
                        (node: RouteNode, idx: number) => (
                          <span key={node.id} className="flex items-center gap-1">
                            <span className="text-sm bg-white px-2 py-1 rounded">
                              {node.label}
                            </span>
                            {idx <
                              ambulanceResult.dispatch.routes.ambulanceToVillage.nodes
                                .length - 1 && (
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                            )}
                          </span>
                        )
                      )}
                      {ambulanceResult.dispatch.routes.villageToHospital.nodes
                        .slice(1)
                        .map((node: RouteNode, idx: number) => (
                          <span key={node.id} className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span className="text-sm bg-white px-2 py-1 rounded">
                              {node.label}
                            </span>
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      <p className="text-sm font-medium text-gray-700">Metrics</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Total Distance</p>
                        <p className="font-bold">
                          {ambulanceResult.dispatch.metrics.totalDistance.toFixed(1)} km
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Hospital Score</p>
                        <p className="font-bold">
                          {ambulanceResult.dispatch.metrics.hospitalScore.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Ambulance className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Fill the form and dispatch an ambulance to see results</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Medicine Transfer Section */}
        {activeTab === 'medicine' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Request Medicine Transfer
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination Hospital
                  </label>
                  <select
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicine Name
                  </label>
                  <select
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="aspirin">Aspirin</option>
                    <option value="insulin">Insulin</option>
                    <option value="antibiotics">Antibiotics</option>
                    <option value="painkillers">Painkillers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity Needed
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleMedicineTransfer}
                  disabled={loading || !hospitalId || quantity <= 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Pill className="w-5 h-5" />
                      Request Transfer
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Transfer Results
              </h2>

              {medicineResult ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      ✓ Medicine Transfer {medicineResult.transfer ? 'Completed' : 'Not Needed'}
                    </p>
                  </div>

                  {medicineResult.transfer && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">From</p>
                          <p className="font-bold text-gray-800">
                            {medicineResult.transfer.from.name}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Stock: {medicineResult.transfer.from.stockBefore} →{' '}
                            <span className="font-medium">
                              {medicineResult.transfer.from.stockAfter}
                            </span>
                          </p>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">To</p>
                          <p className="font-bold text-gray-800">
                            {medicineResult.transfer.to.name}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Stock: {medicineResult.transfer.to.stockBefore} →{' '}
                            <span className="font-medium text-green-600">
                              {medicineResult.transfer.to.stockAfter}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Quantity Transferred</p>
                        <p className="text-2xl font-bold text-green-600">
                          {medicineResult.transfer.quantity} units
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {medicineResult.transfer.medicine}
                        </p>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-medium text-gray-700">Transfer Time</p>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          {medicineResult.transfer.timing.transferTimeMinutes} minutes
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-600" />
                          <p className="text-sm font-medium text-gray-700">Route</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {medicineResult.transfer.route.nodes.map(
                            (node: RouteNode, idx: number) => (
                              <span key={node.id} className="flex items-center gap-1">
                                <span className="text-sm bg-white px-2 py-1 rounded border border-gray-200">
                                  {node.label}
                                </span>
                                {idx < medicineResult.transfer.route.nodes.length - 1 && (
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                )}
                              </span>
                            )
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Distance: {medicineResult.transfer.route.totalDistance.toFixed(1)} km
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Pill className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Fill the form and request a transfer to see results</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
