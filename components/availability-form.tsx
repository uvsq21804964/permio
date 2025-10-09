"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

const DAYS = [
  { value: "0", label: "Lundi" },
  { value: "1", label: "Mardi" },
  { value: "2", label: "Mercredi" },
  { value: "3", label: "Jeudi" },
  { value: "4", label: "Vendredi" },
  { value: "5", label: "Samedi" },
  { value: "6", label: "Dimanche" },
]

export function AvailabilityForm() {
  const [userId, setUserId] = useState("")
  const [dayOfWeek, setDayOfWeek] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string }>>([])
  const [loading, setLoading] = useState(false)

  // Fetch users on mount
  useState(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("[v0] Error fetching users:", err))
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/availabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          dayOfWeek: Number.parseInt(dayOfWeek),
          startTime,
          endTime,
        }),
      })

      if (response.ok) {
        // Reset form
        setDayOfWeek("")
        setStartTime("")
        setEndTime("")
        // Trigger refresh of availability list
        window.dispatchEvent(new CustomEvent("availability-added"))
      }
    } catch (error) {
      console.error("[v0] Error adding availability:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter une disponibilité</CardTitle>
        <CardDescription>Définissez les créneaux horaires disponibles</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Personne</Label>
            <Select value={userId} onValueChange={setUserId} required>
              <SelectTrigger id="user">
                <SelectValue placeholder="Sélectionner une personne" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role === "instructor" ? "Moniteur" : "Élève"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="day">Jour de la semaine</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek} required>
              <SelectTrigger id="day">
                <SelectValue placeholder="Sélectionner un jour" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-time">Heure de début</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">Heure de fin</Label>
              <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            {loading ? "Ajout en cours..." : "Ajouter la disponibilité"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
