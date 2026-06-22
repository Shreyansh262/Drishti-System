"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, AlertTriangle, MapPin, Clock, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"


export default function HistoryPage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()


  // BACKEND: Replace with actual API calls
  const [historyData, setHistoryData] = useState({

  })

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const vehicleNumber = localStorage.getItem("vehicleNumber")
        if (!vehicleNumber) return

        const res = await fetch(`/api/history?vehicleNumber=${vehicleNumber}`)
        const data = await res.json()

        // Convert string time to Date object and sort in descending order (most recent first)
        const parsedIncidents = data.incidents.map((incident) => ({
          ...incident,
          time: new Date(incident.time),
        })).sort((a, b) => b.time.getTime() - a.time.getTime()) // Sort in descending order


        setHistoryData({ ...data, incidents: parsedIncidents })
      } catch (error) {
        console.error("Failed to fetch history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "bg-red-500 text-white"
      case "medium":
        return "bg-amber-500 text-white"
      case "low":
        return "bg-blue-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleRaiseTicket = (incident) => {
    const incidentDate = new Date(incident.time);
    const queryParams = new URLSearchParams({
      issueType: incident.type.toLowerCase().replace(/\s+/g, "-"),
      title: `${incident.type} Incident`,
      date: incidentDate.toLocaleDateString('en-CA'), // YYYY-MM-DD format
      time: incidentDate.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }), // HH:MM format in IST
    })

    router.push(`/dashboard/tickets/new?${queryParams.toString()}`)
  }


  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading history…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Personal History</h1>
        <p className="text-sm text-muted-foreground">Your safety performance and past incidents</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Safety Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{historyData.weeklySafetyScore}</div>
            <Progress value={historyData.weeklySafetyScore} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Based on last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{historyData.totalIncidents}</div>
            <p className="text-xs text-muted-foreground">From device logs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{historyData.monthlyIncidents}</div>
            <p className="text-xs text-muted-foreground">Recent incidents</p>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historyData.incidents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No incidents found</p>
            ) : (
              historyData.incidents.map((incident) => (
                <div key={incident.id} className="rounded-lg border border-border p-4 space-y-3 transition-colors hover:bg-accent/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                      <span className="font-medium text-foreground">{incident.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(incident.time).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {incident.location}
                  </div>

                  <p className="text-sm text-foreground">{incident.description}</p>

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleRaiseTicket(incident)}>
                      Raise Ticket (False Info)
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
