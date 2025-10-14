'use client';

import {
  SignedIn,
  SignedOut,
  SignInButton,
  OrganizationSwitcher,
  useOrganization,
} from '@clerk/nextjs';
import { AvailabilityAgenda } from '@/components/availability-agenda';
import { AssociateAgency } from '@/components/associate-agency';

export default function AgendaPage() {
  return (
    <>
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Agenda des disponibilités
            </h1>
            <p className="text-muted-foreground mt-2">
              Cliquez sur une case pour ajouter des disponibilités. Vous pouvez
              ajouter plusieurs plages horaires pour un même jour.
            </p>
          </div>

          <AvailabilityAgenda />
        </div>
      </div>
    </>
  );
}
