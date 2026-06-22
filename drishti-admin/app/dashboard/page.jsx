"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Ticket, MessageSquare, Star, AlertTriangle } from "lucide-react"
// Corrected import path for DashboardLayout
import { DashboardLayout } from "@/components/dashboard-layout"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    tickets: { total: 0, pending: 0, processing: 0, resolved: 0 },
    complaints: { total: 0, pending: 0 },
    feedback: { total: 0, pending: 0 },
  })
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch tickets
        const ticketsRes = await fetch('/api/tickets');
        if (!ticketsRes.ok) throw new Error('Failed to fetch tickets');
        const ticketsData = await ticketsRes.json();
        const pendingTickets = ticketsData.filter(t => t.status === 'pending').length;
        const processingTickets = ticketsData.filter(t => t.status === 'Processing').length;
        const resolvedTickets = ticketsData.filter(t => t.status === 'Resolved').length;

        // Fetch complaints
        const complaintsRes = await fetch('/api/complaints');
        if (!complaintsRes.ok) throw new Error('Failed to fetch complaints');
        const complaintsData = await complaintsRes.json();
        const pendingComplaints = complaintsData.filter(c => c.status === 'Pending').length; // Assuming complaints can also have a 'Pending' status

        // Fetch feedback
        const feedbackRes = await fetch('/api/feedback');
        if (!feedbackRes.ok) throw new Error('Failed to fetch feedback');
        const feedbackData = await feedbackRes.json();
        const pendingFeedback = feedbackData.filter(f => f.status === 'Pending').length; // Assuming feedback can also have a 'Pending' status


        setStats({
          tickets: {
            total: ticketsData.length,
            pending: pendingTickets,
            processing: processingTickets,
            resolved: resolvedTickets,
          },
          complaints: {
            total: complaintsData.length,
            pending: pendingComplaints,
          },
          feedback: {
            total: feedbackData.length,
            pending: pendingFeedback,
          },
        })
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-muted border-t-primary rounded-full animate-spin" />
          <p className="ml-4 text-sm text-muted-foreground">Loading dashboard data…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-destructive">
          <AlertTriangle className="w-10 h-10 mb-4" />
          <p className="text-base font-medium">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  const pct = (part, total) => (total > 0 ? (part / total) * 100 : 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of tickets, complaints, and feedback</p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Tickets Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-semibold tabular-nums text-foreground">{stats.tickets.total}</div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-medium tabular-nums text-foreground">{stats.tickets.pending}</span>
                  </div>
                  <Progress value={pct(stats.tickets.pending, stats.tickets.total)} className="h-1.5" indicatorClassName="bg-amber-500" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing</span>
                    <span className="font-medium tabular-nums text-foreground">{stats.tickets.processing}</span>
                  </div>
                  <Progress value={pct(stats.tickets.processing, stats.tickets.total)} className="h-1.5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Resolved</span>
                    <span className="font-medium tabular-nums text-foreground">{stats.tickets.resolved}</span>
                  </div>
                  <Progress value={pct(stats.tickets.resolved, stats.tickets.total)} className="h-1.5" indicatorClassName="bg-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complaints Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Complaints</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-semibold tabular-nums text-foreground">{stats.complaints.total}</div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium tabular-nums text-foreground">{stats.complaints.pending}</span>
                </div>
                <Progress value={pct(stats.complaints.pending, stats.complaints.total)} className="h-1.5" indicatorClassName="bg-amber-500" />
              </div>
            </CardContent>
          </Card>

          {/* Feedback Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Feedback</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-semibold tabular-nums text-foreground">{stats.feedback.total}</div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To Review</span>
                  <span className="font-medium tabular-nums text-foreground">{stats.feedback.pending}</span>
                </div>
                <Progress value={pct(stats.feedback.pending, stats.feedback.total)} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Metrics */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <CardDescription>Latest updates on tickets, complaints, and feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No recent activity to display.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators over time.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No metrics to display.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
