"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { AddSlotDialog } from "@/components/add-slot-dialog"

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8:00 to 19:00

type LessonSlot = {
  id: string
  userId: string
  dayOfWeek: number
  startTime: string
  duration: number
  status: string
  user: {
    name: string
    role: string
  }
}

export function WeeklyAgenda() {
  const [slots, setSlots] = useState<LessonSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const fetchSlots = async () => {
    try {
      const response = await fetch("/api/slots")
      const data = await response.json()
      setSlots(data)
    } catch (error) {
      console.error("[v0] Error fetching slots:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()

    const handleSlotAdded = () => {
      fetchSlots()
    }
    window.addEventListener("slot-added", handleSlotAdded)
    return () => window.removeEventListener("slot-added", handleSlotAdded)
  }, [])

  const handleAddSlot = (day: number) => {
    setSelectedDay(day)
    setDialogOpen(true)
  }

  const handleDeleteSlot = async (id: string) => {
    try {
      const response = await fetch(`/api/slots/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSlots((prev) => prev.filter((s) => s.id !== id))
      }
    } catch (error) {
      console.error("[v0] Error deleting slot:", error)
    }
  }

  const getSlotsForDay = (day: number) => {
    return slots.filter((slot) => slot.dayOfWeek === day)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 border-green-300 text-green-800"
      case "booked":
        return "bg-blue-100 border-blue-300 text-blue-800"
      case "blocked":
        return "bg-gray-100 border-gray-300 text-gray-800"
      default:
        return "bg-gray-100 border-gray-300 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible"
      case "booked":
        return "Réservé"
      case "blocked":
        return "Bloqué"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">Chargement de l'agenda...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Semaine en cours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-8 gap-2 min-w-[800px]">
              {/* Header row */}
              <div className="font-medium text-sm text-muted-foreground p-2">Heure</div>
              {DAYS.map((day, index) => (
                <div key={day} className="font-medium text-sm text-center p-2 border-b">
                  <div>{day}</div>
                  <Button variant="ghost" size="sm" className="mt-1 h-7 w-full" onClick={() => handleAddSlot(index)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* Time slots grid */}
              {HOURS.map((hour) => (
                <>
                  <div key={`hour-${hour}`} className="text-sm text-muted-foreground p-2 border-r">
                    {hour}:00
                  </div>
                  {DAYS.map((_, dayIndex) => {
                    const daySlots = getSlotsForDay(dayIndex).filter((slot) => {
                      const [slotHour] = slot.startTime.split(":").map(Number)
                      return slotHour === hour
                    })

                    return (
                      <div key={`${dayIndex}-${hour}`} className="min-h-[60px] p-1 border-b border-r space-y-1">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`text-xs p-2 rounded border ${getStatusColor(slot.status)} cursor-pointer hover:opacity-80`}
                            onClick={() => handleDeleteSlot(slot.id)}
                            title="Cliquer pour supprimer"
                          >
                            <div className="font-medium truncate">{slot.user.name}</div>
                            <div className="text-[10px]">
                              {slot.startTime} ({slot.duration}min)
                            </div>
                            <Badge variant="outline" className="text-[9px] h-4 mt-1">
                              {getStatusLabel(slot.status)}
                            </Badge>
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

      <AddSlotDialog open={dialogOpen} onOpenChange={setDialogOpen} selectedDay={selectedDay} />
    </>
  )
}
