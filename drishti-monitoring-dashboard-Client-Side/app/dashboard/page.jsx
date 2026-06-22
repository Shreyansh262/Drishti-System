"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import LocationMap from "@/components/LiveMap"
import {
  Eye,
  Gauge,
  Bed,
  Droplets,
  Clock,
  Zap,
  CheckCircle,
  LogOut,
} from "lucide-react"

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false)

  const [data, setData] = useState({
    driverScore: 100,
    alcoholLevel: 0.0,
    visibilityScore: 100,
    speed: 0,
    drowsinessState: "Awake",
    isConnected: false,
    lastUpdate: new Date().toISOString(),
    dataAge: 45, // seconds
    recentIncidents: 0,
    activeIncidents: [],
    coordinates: { lat: 48.8584, lng: 2.2945 }, // Default location
  })

  // Get current IST time
  const getIstNow = () => {
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    return new Date(new Date().getTime() + istOffsetMs);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high": return "border-l-red-500 bg-red-500/5"
      case "medium": return "border-l-amber-500 bg-amber-500/5"
      case "low": return "border-l-blue-500 bg-blue-500/5"
      default: return "border-l-border bg-muted/40"
    }
  }

  const getSeverityBadgeColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high": return "bg-red-500 text-white"
      case "medium": return "bg-amber-500 text-white"
      case "low": return "bg-blue-500 text-white"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getSeverityDotColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high": return "bg-red-500"
      case "medium": return "bg-amber-500"
      case "low": return "bg-blue-500"
      default: return "bg-muted-foreground"
    }
  }

  const getHighestSeverity = (incidents) => {
    if (!incidents || incidents.length === 0) return "safe"
    const severityOrder = { high: 3, medium: 2, low: 1 }
    const highest = incidents.reduce((max, incident) => {
      const currentLevel = severityOrder[incident.severity?.toLowerCase()] || 0
      const maxLevel = severityOrder[max?.toLowerCase()] || 0
      return currentLevel > maxLevel ? incident.severity : max
    }, "safe")
    return highest.toLowerCase()
  }

  const handleLogout = () => {
    localStorage.removeItem('userToken')
    sessionStorage.clear()
    window.location.href = '/login'
  }

  const fetchLiveData = async () => {
    setIsLoading(true)
    try {
      const vehicleNumber = typeof window !== "undefined" ? localStorage.getItem("vehicleNumber") : null
      const url = vehicleNumber
        ? `/api/dashboard/live?vehicleNumber=${encodeURIComponent(vehicleNumber)}`
        : "/api/dashboard/live"
      const res = await fetch(url)
      const body = await res.json()
      console.log('API Response:', body)

      if (body.success) {
        const now = new Date().toISOString()
        const incidentsForDisplay = body.activeIncidents || []
        const obdTime = body.obdTimestamp ? new Date(body.obdTimestamp.replace('+05:30', '')) : null
        // Fix OBD age calculation - both times should be in UTC for comparison
        const ageMs = obdTime && !isNaN(obdTime.getTime()) ? new Date().getTime() - obdTime.getTime() : Infinity
        console.log(`OBD - Client Age: ${ageMs / 1000}s, IsConnected: ${body.isConnected}`)

        setData({
          alcoholLevel: parseFloat(body.alcoholLevel) || 0.0,
          alcoholTimestamp: body.alcoholTimestamp || null,
          visibilityScore: body.visibilityScore || 0,
          frontcamTimestamp: body.frontcamTimestamp || null,
          drowsinessState: body.drowsinessState || "Awake",
          dashcamTimestamp: body.dashcamTimestamp || null,
          speed: body.speed || 0,
          obdTimestamp: body.obdTimestamp || null,
          coordinates: body.coordinates || { lat: 48.8584, lng: 2.2945 }, // Default location
          isConnected: body.isConnected && ageMs < 90_000, // Strict UTC check
          lastUpdate: now,
          driverScore: body.driverScore || 100,
          recentIncidents: body.recentIncidents || 0,
          dataAge: body.lastUpdate ? Math.floor((new Date().getTime() - new Date(body.lastUpdate.replace('+05:30', '')).getTime()) / 1000) : 45,
          activeIncidents: incidentsForDisplay.sort((a, b) => new Date(b.time.replace('+05:30', '') || now).getTime() - new Date(a.time.replace('+05:30', '') || now).getTime()),
        })
      } else {
        console.error('API Failure:', body.error)
      }
    } catch (error) {
      console.error("Failed to fetch live data:", error)
      setData((prev) => ({ ...prev, isConnected: false }))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveData()
    const interval = setInterval(fetchLiveData, 8000)
    return () => clearInterval(interval)
  }, [])

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
    if (score >= 60) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreBorder = (score) => {
    if (score >= 80) return "border-l-emerald-500"
    if (score >= 60) return "border-l-amber-500"
    return "border-l-red-500"
  }

  const getDataAgeStatus = (ageInSeconds) => {
    if (isNaN(ageInSeconds) || ageInSeconds === null) return { color: "gray", text: "No data" }
    if (ageInSeconds < 60) return { color: "green", text: "Live" }
    if (ageInSeconds < 300) return { color: "yellow", text: `${Math.round(ageInSeconds / 60)}m old` }
    return { color: "red", text: "Stale data" }
  }

  const dataStatus = getDataAgeStatus(data.dataAge)

  const sortedIncidents = [...(data.activeIncidents || [])].sort(
    (a, b) => new Date(b.time.replace('+05:30', '') || data.lastUpdate).getTime() - new Date(a.time.replace('+05:30', '') || data.lastUpdate).getTime()
  ).slice(0, 4) // Show only 4 most recent incidents

  const highestSeverity = getHighestSeverity(sortedIncidents)

  // Map highest severity to a left-border accent for the alerts card
  const alertBorder =
    highestSeverity === "high" ? "border-l-red-500" :
      highestSeverity === "medium" ? "border-l-amber-500" :
        highestSeverity === "low" ? "border-l-blue-500" :
          "border-l-emerald-500"

  // Format timestamp to show date and time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";

    let utcDate;
    try {
      // Handle different timestamp formats
      if (timestamp.includes('+05:30')) {
        // Format with timezone suffix
        utcDate = new Date(timestamp.replace('+05:30', ''));
      } else if (timestamp.includes(',')) {
        // Handle comma-separated format like "2025-07-10,11:50:02"
        utcDate = new Date(timestamp.replace(',', ' '));
      } else {
        // Standard format
        utcDate = new Date(timestamp);
      }

      if (isNaN(utcDate.getTime())) return "N/A";

      // Use toLocaleString with explicit timezone to show date and time
      return utcDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error);
      return "N/A";
    }
  };

  // Check if sensor is online based on age (90,000 ms = 1.5 minutes threshold)
  const isSensorOnline = (timestamp) => {
    if (!timestamp) return false;
    // Remove the +05:30 suffix to get the UTC time
    const utcDate = new Date(timestamp.replace('+05:30', ''));
    if (isNaN(utcDate.getTime())) return false;

    // Get current UTC time for comparison
    const nowUtc = new Date();
    const ageMs = nowUtc.getTime() - utcDate.getTime();

    return ageMs < 90_000; // Online if less than 1.5 minutes old
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Safety Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time vehicle monitoring · Driver Portal</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 self-start sm:self-auto">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Sensor Connectivity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Sensor Connectivity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "OBD Sensor", key: "obdTimestamp" },
            { name: "Face Cam", key: "dashcamTimestamp" },
            { name: "Dash Cam", key: "frontcamTimestamp" },
            { name: "Alcohol Sensor", key: "alcoholTimestamp" }
          ].map((sensor) => {
            const isOnline = isSensorOnline(data[sensor.key]);
            return (
              <div
                key={sensor.key}
                className={`rounded-lg border p-4 ${isOnline ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">{sensor.name}</h4>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`} />
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last update: {formatTimestamp(data[sensor.key])}
                </p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Top Row - Driver Score and Live Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver Performance Score */}
        <Card className={`border-l-4 ${getScoreBorder(data.driverScore)}`}>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Safety Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-5xl font-semibold tabular-nums mb-4 ${getScoreColor(data.driverScore)}`}>{Number(data.driverScore).toFixed(1)}</div>
              <Progress value={Number(data.driverScore).toFixed(1)} className="h-2 mb-4" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Last 48 hours incidents: {data.recentIncidents}</span>
                <Badge variant={data.driverScore > 80 ? "default" : data.driverScore > 60 ? "secondary" : "destructive"}>
                  {data.driverScore > 80 ? "Excellent" : data.driverScore > 60 ? "Good" : "Needs Attention"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Incidents Card */}
        <Card className={`border-l-4 ${alertBorder}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span>Live Safety Alerts (Last 48 Hours)</span>
              <Badge className={highestSeverity === "safe" ? "bg-emerald-500 text-white" : getSeverityBadgeColor(highestSeverity)}>
                {sortedIncidents.length > 0 ? `${sortedIncidents.length} Recent` : "All Clear"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {sortedIncidents.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">All systems normal — safe driving</span>
                </div>
              ) : (
                sortedIncidents.map((incident, index) => (
                  <div
                    key={incident.id || index}
                    className={`rounded-md border border-border border-l-4 p-3 ${getSeverityColor(incident.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`h-2 w-2 rounded-full ${getSeverityDotColor(incident.severity)}`} />
                          <h4 className="text-sm font-semibold text-foreground">{incident.type}</h4>
                          <Badge className={`text-xs ${getSeverityBadgeColor(incident.severity)}`}>
                            {incident.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{incident.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(incident.time)}</span>
                          {incident.continuous && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Live
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {sortedIncidents.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />High</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Medium</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Low</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sensor Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Alcohol Level */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alcohol Level</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{data.alcoholLevel.toFixed(2)} mg/L</div>
            <Progress value={Math.min((data.alcoholLevel / 0.008) * 100, 100)} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Visibility Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Visibility Score</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{Math.round(data.visibilityScore)}%</div>
            <Progress value={data.visibilityScore} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">Front camera analysis</p>
          </CardContent>
        </Card>

        {/* Current Speed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Speed</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{Math.round(data.speed)} km/h</div>
            <p className="text-xs text-muted-foreground mt-1">GPS tracking</p>
          </CardContent>
        </Card>

        {/* Driver State */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Driver State</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-foreground">{data.drowsinessState}</div>
            <Badge variant={data.drowsinessState === "Awake" ? "default" : "destructive"} className="mt-2">
              {data.drowsinessState === "Awake" ? "Alert" : "Attention"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Location Map (Always visible) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Driver Location</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationMap
            lat={data.coordinates?.lat || 48.8584}
            lng={data.coordinates?.lng || 2.2945}
          />
          <p className="text-sm text-muted-foreground mt-2">
            {data.isConnected ?
              `Lat: ${data.coordinates?.lat || 48.8584}, Lng: ${data.coordinates?.lng || 2.2945}` :
              "OBD connection offline - showing default location"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
