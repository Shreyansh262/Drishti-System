"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
// Corrected import path for DashboardLayout
import { DashboardLayout } from "@/components/dashboard-layout"
import { Search, Calendar, Clock, Car, Edit, Save, X, Target, History } from "lucide-react"

export default function TicketsPage() {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [editingTicket, setEditingTicket] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [historyRecords, setHistoryRecords] = useState([])
  const [resolvedToday, setResolvedToday] = useState(0) // Will be updated from fetched data
  const [targetResolutions, setTargetResolutions] = useState(12) // Static for now, can be dynamic
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error'

  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets();
  }, [])

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await fetch('/api/tickets');
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      setTickets(data);
      // Calculate resolved today
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today
      const resolvedCount = data.filter(ticket =>
        ticket.status === 'Resolved' && new Date(ticket.updatedAt || ticket.createdAt) >= today
      ).length;
      setResolvedToday(resolvedCount);

    } catch (error) {
      console.error("Error fetching tickets:", error);
      // Handle error display to user
    } finally {
      setLoadingTickets(false);
    }
  }

  const handleTicketSelect = async (ticket) => {
    setSelectedTicket(ticket);
    setEditingTicket(null); // Reset editing state
    setHistoryRecords([]); // Clear previous history
    if (ticket.vehicleNumber && ticket.incidentDate && ticket.incidentTime) {
      // Fetch history for the selected ticket
      await fetchTicketHistory(ticket.vehicleNumber, ticket.incidentDate, ticket.incidentTime);
    }
  }

  const fetchTicketHistory = async (vehicleNumber, incidentDate, incidentTime) => {
    setLoadingHistory(true);
    try {
      // Ensure incidentDate is a valid date string (YYYY-MM-DD)
      const datePart = new Date(incidentDate).toISOString().split('T')[0];
      const incidentDateTime = new Date(`${datePart}T${incidentTime}`);

      const startTime = new Date(incidentDateTime.getTime() - 30 * 60 * 1000).toISOString(); // -30 minutes
      const endTime = new Date(incidentDateTime.getTime() + 30 * 60 * 1000).toISOString();   // +30 minutes

      // Backend /api/history supports filtering by vehicleNumber and time.
      // Other sensor APIs (obd, alcohol, drowsiness, visibility) currently fetch latest 50
      // and will be filtered client-side for vehicleNumber and time range.
      const historyApiUrl = `/api/history?vehicleNumber=${encodeURIComponent(vehicleNumber)}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
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

      // Combine all historical data, adding a 'source' field for clarity
      // Filter client-side for sensor data to match vehicleNumber and time window
      const combinedHistory = [
        ...historyData.map(d => ({ ...d, source: 'History CSV', displayTimestamp: d.datetime })),
        ...obdData.filter(d => d.vehicleNumber && d.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase() && new Date(d.GPSTime || d.DeviceTime) >= new Date(startTime) && new Date(d.GPSTime || d.DeviceTime) <= new Date(endTime)).map(d => ({ ...d, source: 'OBD CSV', displayTimestamp: d.GPSTime || d.DeviceTime })),
        ...alcoholData.filter(d => d.vehicleNumber && d.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase() && new Date(d.timestamp) >= new Date(startTime) && new Date(d.timestamp) <= new Date(endTime)).map(d => ({ ...d, source: 'Alcohol CSV', displayTimestamp: d.timestamp })),
        ...drowsinessData.filter(d => d.vehicleNumber && d.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase() && new Date(d.timestamp) >= new Date(startTime) && new Date(d.timestamp) <= new Date(endTime)).map(d => ({ ...d, source: 'Drowsiness CSV', displayTimestamp: d.timestamp })),
        ...visibilityData.filter(d => d.vehicleNumber && d.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase() && new Date(d.timestamp) >= new Date(startTime) && new Date(d.timestamp) <= new Date(endTime)).map(d => ({ ...d, source: 'Visibility CSV', displayTimestamp: d.timestamp })),
      ];

      // Sort by timestamp for better readability
      combinedHistory.sort((a, b) => {
        const timeA = new Date(a.displayTimestamp);
        const timeB = new Date(b.displayTimestamp);
        return timeA.getTime() - timeB.getTime();
      });

      setHistoryRecords(combinedHistory);

    } catch (error) {
      console.error("Error fetching ticket history:", error);
      setHistoryRecords([]); // Clear history on error
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleEdit = () => {
    setEditingTicket({ ...selectedTicket });
  }

  const handleCancelEdit = () => {
    setEditingTicket(null);
  }

  const handleSave = async () => {
    if (!editingTicket) return;
    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/tickets?id=${editingTicket.id}`, { // Use .id as per CSV
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: editingTicket.status,
          priority: editingTicket.priority,
          adminResponse: editingTicket.adminResponse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save ticket');
      }

      // Re-fetch all tickets to ensure the data is consistent with the CSV
      await fetchTickets();
      // Find the updated ticket in the new list to ensure selectedTicket is up-to-date
      const updatedSelected = tickets.find(t => t.id === editingTicket.id);
      setSelectedTicket(updatedSelected || editingTicket); // Fallback to editingTicket if not found
      setEditingTicket(null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000); // Clear status after 2 seconds
    } catch (error) {
      console.error("Error saving ticket:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000); // Clear status after 3 seconds
    }
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) || // Use ticket.id
    ticket.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'Processing': return 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'Resolved': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      default: return 'border-border bg-muted text-muted-foreground';
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'Medium': return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'High': return 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400';
      case 'Critical': return 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400';
      default: return 'border-border bg-muted text-muted-foreground';
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ticket Management</h1>
          <p className="text-sm text-muted-foreground">Review and respond to vehicle tickets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel: Ticket List */}
          <Card className="md:col-span-1 flex flex-col h-full max-h-[calc(100vh-180px)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">All Tickets</CardTitle>
              <CardDescription>Manage and respond to vehicle tickets.</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
              {loadingTickets ? (
                <div className="flex items-center justify-center h-full py-8">
                  <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
                  <p className="ml-3 text-sm text-muted-foreground">Loading tickets…</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-450px)] pr-4">
                  {filteredTickets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No tickets found.</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredTickets.map(ticket => (
                        <Card
                          key={ticket.id} // Use ticket.id
                          className={`cursor-pointer transition-colors ${
                            selectedTicket?.id === ticket.id // Use ticket.id
                              ? 'border-primary ring-1 ring-primary'
                              : 'hover:border-muted-foreground/30'
                          }`}
                          onClick={() => handleTicketSelect(ticket)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h3 className="font-medium text-sm truncate">{ticket.title}</h3>
                              <Badge variant="outline" className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {ticket.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Car className="h-3 w-3" />
                              <span>{ticket.vehicleNumber}</span>
                              <Calendar className="h-3 w-3 ml-auto" />
                              <span>{new Date(ticket.incidentDate).toLocaleDateString()}</span>
                              <Clock className="h-3 w-3" />
                              <span>{ticket.incidentTime}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Right Panel: Ticket Details & History */}
          <div className="md:col-span-2 space-y-6">
            {selectedTicket ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-lg font-semibold">{selectedTicket.title}</CardTitle>
                    {editingTicket ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saveStatus === 'saving'}>
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saveStatus === 'saving'}>
                          {saveStatus === 'saving' ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin mr-2" />
                              Saving…
                            </div>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" /> Save
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4" /> {selectedTicket.vehicleNumber}
                    <Badge variant="outline" className={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Badge>
                    <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
                    {saveStatus === 'saved' && <span className="text-emerald-600 dark:text-emerald-400 text-sm ml-2">Saved</span>}
                    {saveStatus === 'error' && <span className="text-destructive text-sm ml-2">Save failed</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Ticket ID</Label>
                      <Input value={selectedTicket.id} readOnly className="mt-1 bg-muted" />
                    </div>
                    <div>
                      <Label>Issue Type</Label>
                      <Input value={selectedTicket.issueType} readOnly className="mt-1 bg-muted" />
                    </div>
                    <div>
                      <Label>Incident Date</Label>
                      <Input value={new Date(selectedTicket.incidentDate).toLocaleDateString()} readOnly className="mt-1 bg-muted" />
                    </div>
                    <div>
                      <Label>Incident Time</Label>
                      <Input value={selectedTicket.incidentTime} readOnly className="mt-1 bg-muted" />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      {editingTicket ? (
                        <Select
                          value={editingTicket.status}
                          onValueChange={(value) => setEditingTicket(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Processing">Processing</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={selectedTicket.status} readOnly className="mt-1 bg-muted" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      {editingTicket ? (
                        <Select
                          value={editingTicket.priority}
                          onValueChange={(value) => setEditingTicket(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={selectedTicket.priority} readOnly className="mt-1 bg-muted" />
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <p className="text-sm mt-1 text-muted-foreground">{selectedTicket.description}</p> {/* Always view-only */}
                  </div>

                  <div>
                    <Label>Admin Response</Label>
                    {editingTicket ? (
                      <Textarea
                        value={editingTicket.adminResponse}
                        onChange={(e) =>
                          setEditingTicket((prev) => (prev ? { ...prev, adminResponse: e.target.value } : null))
                        }
                        placeholder="Enter your response..."
                        className="mt-1"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm mt-1 text-muted-foreground">{selectedTicket.adminResponse || "No response yet"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[400px] flex items-center justify-center">
                <div className="text-center px-6">
                  <p className="text-base font-medium text-foreground">Select a ticket to view its details</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose a ticket from the list to review and resolve the issue.
                  </p>
                </div>
              </Card>
            )}

            {/* History Records Card */}
            {selectedTicket && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" /> Related Sensor History
                  </CardTitle>
                  <CardDescription>
                    Sensor data and events around the incident time (±30 min).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
                      <p className="ml-3 text-sm text-muted-foreground">Loading history…</p>
                    </div>
                  ) : historyRecords.length > 0 ? (
                    <ScrollArea className="h-64 pr-4">
                      <div className="space-y-3">
                        {historyRecords.map((record, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 border border-border rounded-lg bg-muted/40">
                            <div className="flex-shrink-0">
                              <History className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate">{record.event || record.title || record.imageName || record.category || 'Sensor Data'}</p>
                                <p className="text-xs text-muted-foreground shrink-0">
                                  {new Date(record.displayTimestamp).toLocaleString()}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(record, null, 2)}
                              </p>
                              <Badge variant="secondary" className="mt-2 text-xs">{record.source}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <History className="h-8 w-8 mx-auto mb-3" />
                      <p className="text-sm">No related sensor history found for this ticket.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Daily Resolution Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Daily Resolution Progress</CardTitle>
                <CardDescription>
                  Tickets resolved today against the daily target.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Tickets Resolved Today</span>
                  <span className="font-medium tabular-nums text-foreground">{resolvedToday} / {targetResolutions}</span>
                </div>
                <Progress value={(resolvedToday / targetResolutions) * 100} className="h-2" indicatorClassName="bg-emerald-500" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="h-3.5 w-3.5" />
                  <span>{Math.max(targetResolutions - resolvedToday, 0)} remaining to reach target</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
