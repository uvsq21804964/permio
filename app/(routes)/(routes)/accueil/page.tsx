// app/page.tsx
import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar, Settings } from 'lucide-react';

export default async function Home() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Permio</h1>
          <h2 className="text-xl font-bold text-foreground">
            Le permis à toute vitesse !
          </h2>
          <p className="text-muted-foreground text-lg">
            Système de planification pour auto-écoles
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/agenda">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <Calendar className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Agenda</CardTitle>
                <CardDescription>
                  Gérer les disponibilités et créneaux de cours
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/configuration">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <Settings className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Optimiser l'attribution des créneaux
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
