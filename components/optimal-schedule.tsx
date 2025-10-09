"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Users, Calendar, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

type Assignment = {
  id: string
  studentId: string
  slotId: string
  instructorId: string
  status: string
  student: {
    name: string
  }
  slot: {
    dayOfWeek: number
    startTime: string
    duration: number
    user: {
      name: string
    }
  }
}

type ScheduleResult = {
  assignments: Assignment[]
  unmatchedStudents: Array<{ id: string; name: string }>
  stats: {
    totalStudents: number
    matchedStudents: number
    totalSlots: number
    usedSlots: number
  }
}

export function OptimalSchedule() {
  const [result, setResult] = useState<ScheduleResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerateSchedule = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("[v0] Error generating schedule:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Générer la configuration</CardTitle>
          <CardDescription>
            Lancez l'algorithme d'optimisation pour attribuer automatiquement les créneaux aux élèves
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerateSchedule} disabled={loading} size="lg">
            <Sparkles className="mr-2 h-5 w-5" />
            {loading ? "Génération en cours..." : "Générer la configuration optimale"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Élèves total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{result.stats.totalStudents}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Élèves assignés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">{result.stats.matchedStudents}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Créneaux disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{result.stats.totalSlots}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Créneaux utilisés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">{result.stats.usedSlots}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unmatched Students Alert */}
          {result.unmatchedStudents.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{result.unmatchedStudents.length} élève(s) non assigné(s):</strong>{" "}
                {result.unmatchedStudents.map((s) => s.name).join(", ")}
              </AlertDescription>
            </Alert>
          )}

          {/* Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Attributions des créneaux</CardTitle>
              <CardDescription>{result.assignments.length} cours planifiés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.assignments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune attribution générée</p>
                ) : (
                  result.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{assignment.student.name}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">{assignment.slot.user.name}</span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {DAYS[assignment.slot.dayOfWeek]} • {assignment.slot.startTime} ({assignment.slot.duration}{" "}
                          min)
                        </p>
                      </div>
                      <Badge variant={assignment.status === "confirmed" ? "default" : "secondary"}>
                        {assignment.status === "confirmed" ? "Confirmé" : "En attente"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
