// components/associate-agency.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useOrganizationList } from '@clerk/nextjs';

type Props = {
  onSuccess?: (data: {
    organizationId: string;
    agencyId?: string;
    agencyName?: string;
  }) => void;
  className?: string;
};

export function AssociateAgency({ onSuccess, className }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useAuth();
  const { setActive } = useOrganizationList();
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setError('Veuillez saisir un code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/agency/association', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized }),
        credentials: 'include',
      });

      // Essayer de décoder proprement selon le Content-Type
      const ct = res.headers.get('content-type') || '';
      let data: any = null;
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        // Si c’est du HTML, c’est probablement une redirection middleware vers /sign-in
        throw new Error(
          text?.slice(0, 200) || `Réponse non JSON (status ${res.status})`
        );
      }

      // Propager l’erreur métier renvoyée par l’API
      if (!res.ok) {
        throw new Error(
          data?.error || `Association échouée (status ${res.status})`
        );
      }

      // Activer l’orga dans Clerk
      if (data.organizationId && setActive) {
        await setActive({ organization: data.organizationId });
      }
      console.log('POST /api/agency/association =>', res.status, ct);
      onSuccess?.(data);
      router.refresh();
    } catch (e: any) {
      setError(e?.details || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className={['flex gap-2', className].filter(Boolean).join(' ')}
    >
      <input
        className="border rounded px-3 py-2"
        placeholder="Code agence"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-label="Code agence"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
      />
      <button
        type="submit"
        disabled={loading || code.trim().length === 0}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {loading ? 'Association…' : 'Associer'}
      </button>
      {error && <p className="text-red-600 text-sm ml-2">{error}</p>}
    </form>
  );
}
