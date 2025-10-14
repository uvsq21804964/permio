import { AvailabilityForm } from "@/components/availability-form"
import { AvailabilityList } from "@/components/availability-list"

export default function DisponibilitesPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Disponibilités</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les créneaux horaires disponibles pour les moniteurs et élèves
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <AvailabilityForm />
          </div>
          <div>
            <AvailabilityList />
          </div>
        </div>
      </div>
    </div>
  )
}
