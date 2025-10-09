"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

type AddSlotDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDay: number | null
}

export function AddSlotDialog({ open, onOpenChange, selectedDay }: AddSlotDialogProps) {
  const [userId, setUserId] = useState("")
  const [startTime, setStartTime] = useState("")
  const [duration, setDuration] = useState("60")
  const [status, setStatus] = useState("available")
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetch("/api/users?role=instructor")
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch((err) => console.error("[v0] Error fetching instructors:", err))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDay === null) return

    setLoading(true)

    try {
      const [hours, minutes] = startTime.split(":").map(Number)
      const startMinutes = hours * 60 + minutes
      const endMinutes = startMinutes + Number.parseInt(duration)
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60
      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`

      const response = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId: userId,
          dayOfWeek: selectedDay,
          startTime,
          endTime,
          status,
        }),
      })

      if (response.ok) {
        // Reset form
        setUserId("")
        setStartTime("")
        setDuration("60")
        setStatus("available")
        onOpenChange(false)
        // Trigger refresh
        window.dispatchEvent(new CustomEvent("slot-added"))
      }
    } catch (error) {
      console.error("[v0] Error adding slot:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un créneau</DialogTitle>
          <DialogDescription>
            {selectedDay !== null ? `Créer un nouveau créneau pour ${DAYS[selectedDay]}` : "Sélectionner un jour"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructor">Moniteur</Label>
            <Select value={userId} onValueChange={setUserId} required>
              <SelectTrigger id="instructor">
                <SelectValue placeholder="Sélectionner un moniteur" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label htmlFor="duration">Durée (minutes)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="booked">Réservé</SelectItem>
                <SelectItem value="blocked">Bloqué</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
