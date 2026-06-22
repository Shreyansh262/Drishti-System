"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
// Corrected import path for DashboardLayout
import { DashboardLayout } from "@/components/dashboard-layout"
import { Search, Calendar, Clock, Car, Star } from "lucide-react" // Removed Edit, Save, X

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  // Removed editingFeedback state as it's view-only
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, [])

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const response = await fetch('/api/feedback');
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      // Handle error display
    } finally {
      setLoadingFeedbacks(false);
    }
  }

  const handleFeedbackSelect = (feedback) => {
    setSelectedFeedback(feedback);
    // No editing state to reset
  }

  // Removed handleEdit, handleCancelEdit, handleSave functions as it's view-only

  const filteredFeedbacks = feedbacks.filter(feedback =>
    feedback.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || // vehicleNumber might be optional
    feedback.title?.toLowerCase().includes(searchTerm.toLowerCase()) || // title might be undefined
    feedback.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (rating >= 3) return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
    return 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400';
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Feedback Management</h1>
          <p className="text-sm text-muted-foreground">Review customer feedback</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel: Feedback List */}
          <Card className="md:col-span-1 flex flex-col h-full max-h-[calc(100vh-180px)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">All Feedback</CardTitle>
              <CardDescription>Review customer feedback.</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feedback..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
              {loadingFeedbacks ? (
                <div className="flex items-center justify-center h-full py-8">
                  <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
                  <p className="ml-3 text-sm text-muted-foreground">Loading feedback…</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-380px)] pr-4">
                  {filteredFeedbacks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No feedback found.</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredFeedbacks.map(feedback => (
                        <Card
                          key={feedback.id}
                          className={`cursor-pointer transition-colors ${selectedFeedback?.id === feedback.id
                              ? 'border-primary ring-1 ring-primary'
                              : 'hover:border-muted-foreground/30'
                            }`}
                          onClick={() => handleFeedbackSelect(feedback)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h3 className="font-medium text-sm truncate">{feedback.title || feedback.category}</h3>
                              <Badge variant="outline" className={getRatingColor(feedback.rating)}>{feedback.rating} <Star className="h-3 w-3 ml-1 fill-current" /></Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {feedback.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Car className="h-3 w-3" />
                              <span>{feedback.vehicleNumber}</span>
                              <Calendar className="h-3 w-3 ml-auto" />
                              <span>{new Date(feedback.date).toLocaleDateString()}</span>
                              <Clock className="h-3 w-3" />
                              <span>{new Date(feedback.date).toLocaleTimeString()}</span>
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

          {/* Right Panel: Feedback Details */}
          <div className="md:col-span-2">
            {selectedFeedback ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{selectedFeedback.title || selectedFeedback.category}</CardTitle>
                    {/* Removed Edit/Save/Cancel buttons */}
                  </div>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4" /> {selectedFeedback.vehicleNumber}
                    <Badge variant="outline" className={getRatingColor(selectedFeedback.rating)}>{selectedFeedback.rating} <Star className="h-3 w-3 ml-1 fill-current" /></Badge>
                    {/* Removed save status messages */}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Feedback ID</Label>
                      <Input value={selectedFeedback.id} readOnly className="mt-1 bg-muted" />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input value={selectedFeedback.category} readOnly className="mt-1 bg-muted" />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input value={new Date(selectedFeedback.date).toLocaleDateString()} readOnly className="mt-1 bg-muted" />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input value={new Date(selectedFeedback.date).toLocaleTimeString()} readOnly className="mt-1 bg-muted" />
                    </div>
                    <div>
                      <Label>Rating</Label>
                      <Input value={selectedFeedback.rating} readOnly className="mt-1 bg-muted" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={selectedFeedback.description} readOnly className="mt-1 bg-muted" />
                    </div>
                  </div>

                  {/* Status display for feedback */}
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Input value={selectedFeedback.status || 'Pending'} readOnly className="mt-1 bg-muted" /> {/* Always view-only */}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[400px] flex items-center justify-center">
                <div className="text-center px-6">
                  <Star className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-base font-medium text-foreground">Select feedback</p>
                  <p className="text-sm text-muted-foreground mt-1">Choose feedback from the list to view details.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
