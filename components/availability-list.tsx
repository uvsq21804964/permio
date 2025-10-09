"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

type Availability = {
  id: string
  userId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  user: {
    name: string
    role: string
  }
}

export function AvailabilityList() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAvailabilities = async () => {
    try {
      const response = await fetch("/api/availabilities")
      const data = await response.json()
      setAvailabilities(data)
    } catch (error) {
      console.error("[v0] Error fetching availabilities:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailabilities()

    // Listen for new availability events
    const handleAvailabilityAdded = () => {
      fetchAvailabilities()
    }
    window.addEventListener("availability-added", handleAvailabilityAdded)
    return () => window.removeEventListener("availability-added", handleAvailabilityAdded)
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/availabilities/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setAvailabilities((prev) => prev.filter((a) => a.id !== id))
      }
    } catch (error) {
      console.error("[v0] Error deleting availability:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Disponibilités enregistrées</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilités enregistrées</CardTitle>
        <CardDescription>
          {availabilities.length} créneau{availabilities.length !== 1 ? "x" : ""} disponible
          {availabilities.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {availabilities.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune disponibilité enregistrée</p>
          ) : (
            availabilities.map((availability) => (
              <div key={availability.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{availability.user.name}</span>
                    <Badge variant={availability.user.role === "instructor" ? "default" : "secondary"}>
                      {availability.user.role === "instructor" ? "Moniteur" : "Élève"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {DAYS[availability.dayOfWeek]} • {availability.startTime} - {availability.endTime}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(availability.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
