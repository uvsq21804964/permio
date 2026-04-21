'use client';

import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type PartnerLegendItem = {
  id: string;
  label: string;
  klass: string;
  role: 'student' | 'instructor';
};

type CalculatedAgendaPartnersLegendProps = {
  deletingId: string | null;
  msg: string | null;
  onDeleteStudent: (studentId: string) => void;
  partnerLegend: PartnerLegendItem[];
};

export function CalculatedAgendaPartnersLegend({
  deletingId,
  msg,
  onDeleteStudent,
  partnerLegend,
}: CalculatedAgendaPartnersLegendProps) {
  return (
    <>
      {partnerLegend.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {partnerLegend.map(({ id, klass, label, role }) => (
            <div
              key={id}
              className={`inline-flex items-center gap-2 rounded border px-2 py-1 text-xs ${klass}`}
              title={label}
            >
              <span className="inline-block h-2 w-2 rounded-full border" />
              <span className="max-w-[160px] truncate">{label}</span>

              {role === 'student' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      title="Supprimer l'eleve"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer l&apos;eleve ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est <b>definitive</b>. L&apos;eleve « {label} »
                        sera supprimé et tous ses créneaux associés seront retirés
                        de la base de donnees. Etes-vous sur de vouloir continuer ?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteStudent(id)}
                        disabled={deletingId === id}
                      >
                        {deletingId === id
                          ? 'Suppression...'
                          : 'Supprimer definitivement'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      )}

      {msg && (
        <div className="mt-2">
          <Badge variant="secondary">{msg}</Badge>
        </div>
      )}
    </>
  );
}
