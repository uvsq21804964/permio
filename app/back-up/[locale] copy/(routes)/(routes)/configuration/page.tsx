import { OptimalSchedule } from "@/components/optimal-schedule"

export default function ConfigurationPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuration optimale</h1>
          <p className="text-muted-foreground mt-2">
            Générez et visualisez l'attribution optimale des créneaux de cours
          </p>
        </div>

        <OptimalSchedule />
      </div>
    </div>
  )
}
