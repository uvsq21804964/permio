"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8:00 to 19:00

type User = {
  id: string
  name: string
  role: string
}

type Availability = {
  id: string
  userId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  user: User
}

type LessonSlot = {
  id: string
  instructorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  status: string
  duration: number
  instructor: User
}

type UnifiedAgendaProps = {
  mode: "availabilities" | "slots"
}

export function UnifiedAgenda({ mode }: UnifiedAgendaProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [slots, setSlots] = useState<LessonSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ day: number; hour: number } | null>(null)
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    duration: 60,
    status: "available",
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/users?role=${mode === "availabilities" ? "" : "instructor"}`)
        const data = await response.json()
        setUsers(data)
        if (data.length > 0) {
          setSelectedUserId(data[0].id)
        }
      } catch (error) {
        console.error("[v0] Error fetching users:", error)
      }
    }
    fetchUsers()
  }, [mode])

  useEffect(() => {
    if (!selectedUserId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        if (mode === "availabilities") {
          const response = await fetch(`/api/availabilities?userId=${selectedUserId}`)
          const data = await response.json()
          setAvailabilities(data)
        } else {
          const response = await fetch(`/api/slots?instructorId=${selectedUserId}`)
          const data = await response.json()
          setSlots(data)
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedUserId, mode])

  const handleCellClick = (day: number, hour: number) => {
    setSelectedCell({ day, hour })
    setFormData({
      startTime: `${hour.toString().padStart(2, "0")}:00`,
      endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
      duration: 60,
      status: "available",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCell || !selectedUserId) return

    try {
      if (mode === "availabilities") {
        const response = await fetch("/api/availabilities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUserId,
            dayOfWeek: selectedCell.day,
            startTime: formData.startTime,
            endTime: formData.endTime,
          }),
        })

        if (response.ok) {
          const newAvailability = await response.json()
          setAvailabilities((prev) => [...prev, newAvailability])
          setDialogOpen(false)
        }
      } else {
        const [startHour, startMin] = formData.startTime.split(":").map(Number)
        const endTime = `${Math.floor((startHour * 60 + startMin + formData.duration) / 60)
          .toString()
          .padStart(2, "0")}:${((startHour * 60 + startMin + formData.duration) % 60).toString().padStart(2, "0")}`

        const response = await fetch("/api/slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instructorId: selectedUserId,
            dayOfWeek: selectedCell.day,
            startTime: formData.startTime,
            endTime,
            status: formData.status,
          }),
        })

        if (response.ok) {
          const newSlot = await response.json()
          setSlots((prev) => [...prev, newSlot])
          setDialogOpen(false)
        }
      }
    } catch (error) {
      console.error("[v0] Error creating item:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const endpoint = mode === "availabilities" ? `/api/availabilities/${id}` : `/api/slots/${id}`
      const response = await fetch(endpoint, { method: "DELETE" })

      if (response.ok) {
        if (mode === "availabilities") {
          setAvailabilities((prev) => prev.filter((a) => a.id !== id))
        } else {
          setSlots((prev) => prev.filter((s) => s.id !== id))
        }
      }
    } catch (error) {
      console.error("[v0] Error deleting item:", error)
    }
  }

  const getItemsForCell = (day: number, hour: number) => {
    if (mode === "availabilities") {
      return availabilities.filter((avail) => {
        if (avail.dayOfWeek !== day) return false
        const [startHour] = avail.startTime.split(":").map(Number)
        const [endHour] = avail.endTime.split(":").map(Number)
        return hour >= startHour && hour < endHour
      })
    } else {
      return slots.filter((slot) => {
        if (slot.dayOfWeek !== day) return false
        const [startHour] = slot.startTime.split(":").map(Number)
        return startHour === hour
      })
    }
  }

  if (loading && !selectedUserId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{mode === "availabilities" ? "Disponibilités hebdomadaires" : "Créneaux de cours"}</CardTitle>
            <div className="w-64">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
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
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            Cliquez sur une case vide pour ajouter, ou sur un élément existant pour le supprimer
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-8 gap-2 min-w-[800px]">
              {/* Header row */}
              <div className="font-medium text-sm text-muted-foreground p-2">Heure</div>
              {DAYS.map((day) => (
                <div key={day} className="font-medium text-sm text-center p-2 border-b">
                  {day}
                </div>
              ))}

              {/* Time slots grid */}
              {HOURS.map((hour) => (
                <>
                  <div key={`hour-${hour}`} className="text-sm text-muted-foreground p-2 border-r">
                    {hour}:00
                  </div>
                  {DAYS.map((_, dayIndex) => {
                    const items = getItemsForCell(dayIndex, hour)

                    return (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className="min-h-[60px] p-1 border-b border-r space-y-1 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => items.length === 0 && handleCellClick(dayIndex, hour)}
                      >
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`text-xs p-2 rounded border group relative ${
                              mode === "availabilities"
                                ? "bg-blue-50 border-blue-200 text-blue-900"
                                : item.status === "available"
                                  ? "bg-green-50 border-green-200 text-green-900"
                                  : item.status === "booked"
                                    ? "bg-orange-50 border-orange-200 text-orange-900"
                                    : "bg-gray-50 border-gray-200 text-gray-900"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(item.id)
                            }}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                {mode === "availabilities" ? (
                                  <>
                                    <div className="text-[10px] font-medium">
                                      {item.startTime} - {item.endTime}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-[10px] font-medium">
                                      {item.startTime} ({item.duration}min)
                                    </div>
                                    <Badge variant="outline" className="text-[9px] h-4 mt-1">
                                      {item.status === "available"
                                        ? "Disponible"
                                        : item.status === "booked"
                                          ? "Réservé"
                                          : "Bloqué"}
                                    </Badge>
                                  </>
                                )}
                              </div>
                              <Trash2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "availabilities" ? "Ajouter une disponibilité" : "Ajouter un créneau de cours"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Jour</Label>
              <Input value={selectedCell ? DAYS[selectedCell.day] : ""} disabled />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Heure de début</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>

              {mode === "availabilities" ? (
                <div className="space-y-2">
                  <Label htmlFor="endTime">Heure de fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) })}
                    required
                  />
                </div>
              )}
            </div>

            {mode === "slots" && (
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
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
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
