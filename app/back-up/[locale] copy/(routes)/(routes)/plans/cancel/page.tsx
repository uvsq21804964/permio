import Link from 'next/link';

export default function CancelPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Paiement annulé</h1>
      <p className="mt-4">Tu peux réessayer quand tu veux.</p>
      <Link
        className="mt-6 inline-block rounded bg-slate-800 px-4 py-2 text-white"
        href="/plans"
      >
        Retour à l’offre
      </Link>
    </main>
  );
}
