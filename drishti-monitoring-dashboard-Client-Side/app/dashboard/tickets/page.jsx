"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Ticket, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react"

export default function TicketsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // BACKEND: Replace with actual API calls
  const [tickets, setTickets] = useState([

  ])

  const fetchTickets = async () => {
    const vehicleNumber = localStorage.getItem("vehicleNumber")
    if (!vehicleNumber) return

    try {
      // BACKEND: Replace with actual API call
      const response = await fetch(`/api/ticket`, {
        headers: {
          "x-vehicle-number": vehicleNumber,
        },
      })
      const data = await response.json()
      setTickets(data.tickets)

      // Simulate API call
      // await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Fetching tickets for:", vehicleNumber)
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      case "processing":
        return <Clock className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-500 text-white"
      case "processing":
        return "bg-amber-500 text-white"
      default:
        return "bg-red-500 text-white"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
      case "high":
        return "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400"
      case "medium":
        return "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      default:
        return "border-border bg-muted text-muted-foreground"
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading tickets…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Track and manage your reported issues</p>
        </div>
        <Button onClick={() => router.push("/dashboard/tickets/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Tickets List */}
      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Ticket className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tickets found</p>
              <Button className="mt-4" onClick={() => router.push("/dashboard/tickets/new")}>
                Create Your First Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base font-semibold text-foreground">{ticket.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getPriorityColor(ticket.priority)}>{ticket.priority.toUpperCase()}</Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1 capitalize">{ticket.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{ticket.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                  <div>
                    <span className="font-medium text-foreground">Incident Date:</span> {ticket.incidentDate}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Incident Time:</span> {ticket.incidentTime}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Issue Type:</span> {ticket.issueType.replace("-", " ")}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Created:</span> {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {ticket.adminResponse && (
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-3 mb-4">
                    <p className="text-sm font-medium text-foreground mb-1">Admin Response:</p>
                    <p className="text-sm text-muted-foreground">{ticket.adminResponse}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Ticket #{ticket.id}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/contact`)}>
                      Contact Us
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
