"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load theme settings
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("drishti-settings")
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        document.documentElement.classList.toggle("dark", settings.darkMode || false)
        document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "")
        document.documentElement.classList.add(`theme-${settings.theme || "blue"}`)
      }
    }
  }, [])

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleNumber }),
      })
      const data = await res.json()

      if (res.ok && data.valid) {
        localStorage.setItem("vehicleNumber", data.vehicleNumber)
        router.push("/dashboard")
      } else {
        setError(data.error || "Vehicle not registered. Please contact support.")
      }
    } catch (err) {
      console.error("Login failed:", err)
      setError("Unable to reach the server. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-sm">
        <form onSubmit={handleLogin}>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">Drishti (दृष्टि)</CardTitle>
            <CardDescription>Driver Monitoring System — sign in to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-number">Vehicle Registration Number</Label>
              <Input
                id="vehicle-number"
                placeholder="e.g., HR20AP1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="h-11"
                required
              />
              <p className="text-sm text-muted-foreground">
                Demo:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">HR20AP1234</code>
              </p>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="h-11 w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
