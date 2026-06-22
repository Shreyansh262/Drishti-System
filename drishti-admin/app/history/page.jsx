"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Search, Calendar, Clock, Car, History as HistoryIcon } from "lucide-react"

export default function HistoryPage() {
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [vehicleData, setVehicleData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!vehicleNumber.trim()) {
      setError("Please enter a vehicle number.");
      setVehicleData(null);
      return;
    }

    setLoading(true);
    setError(null);
    setVehicleData(null);

    try {
      const encodedVehicleNumber = encodeURIComponent(vehicleNumber.trim());

      const historyApiUrl = `/api/history`;
      const obdApiUrl = `/api/obd`;
      const alcoholApiUrl = `/api/alcohol`;
      const drowsinessApiUrl = `/api/drowsiness`;
      const visibilityApiUrl = `/api/visibility`;

      const [historyRes, obdRes, alcoholRes, drowsinessRes, visibilityRes] = await Promise.all([
        fetch(historyApiUrl),
        fetch(obdApiUrl),
        fetch(alcoholApiUrl),
        fetch(drowsinessApiUrl),
        fetch(visibilityApiUrl),
      ]);

      const historyData = historyRes.ok ? await historyRes.json() : [];
      const obdData = obdRes.ok ? await obdRes.json() : [];
      const alcoholData = alcoholRes.ok ? await alcoholRes.json() : [];
      const drowsinessData = drowsinessRes.ok ? await drowsinessRes.json() : [];
      const visibilityData = visibilityRes.ok ? await visibilityRes.json() : [];

      const combinedRecords = [
        ...historyData.map(d => ({ ...d, type: 'alert', source: 'History CSV', displayTimestamp: d.datetime })),
        ...obdData.map(d => ({ ...d, type: 'obd', source: 'OBD CSV', displayTimestamp: d.GPSTime || d.DeviceTime, vehicleNumber: d.vehicleNumber || 'N/A' })),
        ...alcoholData.map(d => ({ ...d, type: 'alcohol', source: 'Alcohol CSV', displayTimestamp: d.timestamp, vehicleNumber: d.vehicleNumber || 'N/A' })),
        ...drowsinessData.map(d => ({ ...d, type: 'drowsiness', source: 'Drowsiness CSV', displayTimestamp: d.timestamp, vehicleNumber: d.vehicleNumber || 'N/A' })),
        ...visibilityData.map(d => ({ ...d, type: 'visibility', source: 'Visibility CSV', displayTimestamp: d.timestamp, vehicleNumber: d.vehicleNumber || 'N/A' })),
      ];

      setVehicleData({
        vehicleNumber: vehicleNumber.trim(),
        records: combinedRecords.sort((a, b) => new Date(b.displayTimestamp) - new Date(a.displayTimestamp)),
        photos: [],
      });

    } catch (err) {
      console.error("Failed to fetch vehicle history:", err);
      setError("Failed to fetch vehicle data. Please check the vehicle number and try again.");
      setVehicleData(null);
    } finally {
      setLoading(false);
    }
  }

  const renderRecordDetails = (record) => {
    switch (record.source) {
      case 'History CSV':
        return (
          <>
            {record.fault_type && <p className="text-sm text-muted-foreground">Fault Type: {record.fault_type}</p>}
            {record.severity && <p className="text-sm text-muted-foreground">Severity: {record.severity}</p>}
            {record.location && <p className="text-sm text-muted-foreground">Location: {record.location}</p>}
            {record.description && <p className="text-sm text-muted-foreground">Description: {record.description}</p>}
          </>
        );

      default:
        return (
          <p className="text-sm text-muted-foreground">
            Details: {record.description || record.message || "No specific details available."}
          </p>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Vehicle History Lookup</h1>
          <p className="text-sm text-muted-foreground">Retrieve historical records and sensor data by vehicle</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Search Vehicle</CardTitle>
            <CardDescription>Enter a vehicle number to retrieve its historical data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-grow w-full">
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="e.g., MH12ABXXXX"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading || !vehicleNumber.trim()}>
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Searching…
                  </div>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" /> Search
                  </>
                )}
              </Button>
            </div>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          </CardContent>
        </Card>

        {vehicleData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4 text-muted-foreground" /> History Records for {vehicleData.vehicleNumber}
                </CardTitle>
                <CardDescription>All recorded events and sensor data.</CardDescription>
              </CardHeader>
              <CardContent>
                {vehicleData.records.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {vehicleData.records.map((record, index) => (
                        <div key={index} className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
                          <div className="flex-shrink-0">
                            <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">{record.event || record.title || record.imageName || record.category || 'Sensor Data'}</p>
                              <Badge variant="secondary" className="text-xs shrink-0">{record.source.replace(' CSV', '')}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 inline-block mr-1" />
                              {new Date(record.displayTimestamp).toLocaleDateString()}
                              <Clock className="h-3 w-3 inline-block ml-2 mr-1" />
                              {new Date(record.displayTimestamp).toLocaleTimeString()}
                            </p>
                            {/* Display vehicle number if available for clarity in demo */}
                            {record.vehicleNumber && record.vehicleNumber !== 'N/A' && (
                              <p className="text-sm text-muted-foreground">Vehicle: {record.vehicleNumber}</p>
                            )}
                            <div className="mt-2 text-sm">
                              {renderRecordDetails(record)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <HistoryIcon className="h-8 w-8 mx-auto mb-3" />
                    <p className="text-sm">No history records found for this vehicle.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
