"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Search, Calendar, Clock, Car, MessageSquare } from "lucide-react"

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  // Removed editingComplaint state as it's view-only
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, [])

  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const response = await fetch('/api/complaints');
      if (!response.ok) throw new Error('Failed to fetch complaints');
      const data = await response.json();
      setComplaints(data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      // Handle error display
    } finally {
      setLoadingComplaints(false);
    }
  }

  const handleComplaintSelect = (complaint) => {
    setSelectedComplaint(complaint);
    // No editing state to reset
  }

  // Removed handleEdit, handleCancelEdit, handleSave functions as it's view-only

  const filteredComplaints = complaints.filter(complaint =>
    complaint.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'Resolved': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      default: return 'border-border bg-muted text-muted-foreground';
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Complaint Management</h1>
          <p className="text-sm text-muted-foreground">Review vehicle complaints</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel: Complaint List */}
          <Card className="md:col-span-1 flex flex-col h-full max-h-[calc(100vh-180px)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">All Complaints</CardTitle>
              <CardDescription>Review vehicle complaints.</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
              {loadingComplaints ? (
                <div className="flex items-center justify-center h-full py-8">
                  <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
                  <p className="ml-3 text-sm text-muted-foreground">Loading complaints…</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-380px)] pr-4">
                  {filteredComplaints.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No complaints found.</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredComplaints.map(complaint => (
                        <Card
                          key={complaint.id}
                          className={`cursor-pointer transition-colors ${
                            selectedComplaint?.id === complaint.id
                              ? 'border-primary ring-1 ring-primary'
                              : 'hover:border-muted-foreground/30'
                          }`}
                          onClick={() => handleComplaintSelect(complaint)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h3 className="font-medium text-sm truncate">{complaint.title}</h3>
                              <Badge variant="outline" className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {complaint.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Car className="h-3 w-3" />
                              <span>{complaint.vehicleNumber}</span>
                              <Calendar className="h-3 w-3 ml-auto" />
                              <span>{new Date(complaint.date).toLocaleDateString()}</span>
                              <Clock className="h-3 w-3" />
                              <span>{new Date(complaint.date).toLocaleTimeString()}</span>
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

          {/* Right Panel: Complaint Details */}
          <div className="md:col-span-2">
            {selectedComplaint ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{selectedComplaint.title}</CardTitle>
                    {/* Removed Edit/Save/Cancel buttons */}
                  </div>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4" /> {selectedComplaint.vehicleNumber}
                    <Badge variant="outline" className={getStatusColor(selectedComplaint.status)}>{selectedComplaint.status}</Badge>
                    {/* Removed save status messages */}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Complaint ID</Label>
                      <Input value={selectedComplaint.id} readOnly className="mt-1 bg-muted" />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input value={selectedComplaint.category} readOnly className="mt-1 bg-muted" />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input value={new Date(selectedComplaint.date).toLocaleDateString()} readOnly className="mt-1 bg-muted" />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input value={new Date(selectedComplaint.date).toLocaleTimeString()} readOnly className="mt-1 bg-muted" />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input value={selectedComplaint.description} readOnly className="mt-1 bg-muted" />
                  </div>

                  {/* Status display for complaints */}
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Input value={selectedComplaint.status || 'Pending'} readOnly className="mt-1 bg-muted" /> {/* Always view-only */}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[400px] flex items-center justify-center">
                <div className="text-center px-6">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-base font-medium text-foreground">Select a complaint</p>
                  <p className="text-sm text-muted-foreground mt-1">Choose a complaint from the list to view details.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
