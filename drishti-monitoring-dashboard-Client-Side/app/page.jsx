"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (typeof window !== "undefined") {
      const vehicleNumber = localStorage.getItem("vehicleNumber")
      if (vehicleNumber) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-primary mx-auto"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading Drishti…</p>
      </div>
    </div>
  )
}