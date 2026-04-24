import Image from 'next/image';
import { BrandWordmark } from '@/components/brand/BrandWordmark';

type AssociateAgencyBlockingScreenProps = {
  blockingMessage: string | null;
  locale: string;
  logo: string;
};

export function AssociateAgencyBlockingScreen({
  blockingMessage,
  locale,
  logo,
}: AssociateAgencyBlockingScreenProps) {
  return (
    <div className="min-h-screen bg-[#f9ffc6]/80 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white/95 border border-black/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)] p-6 text-center">
        <div className="mx-auto mb-3 flex items-center justify-center gap-2">
          <span className="relative h-9 w-9">
            <Image
              src={logo}
              alt="MagicHango"
              fill
              sizes="36px"
              className="object-contain"
              priority
            />
          </span>
          <BrandWordmark tone="dark" />
        </div>

        <div className="text-lg font-bold text-black">
          {locale.startsWith('fr') ? 'Chargement…' : 'Loading…'}
        </div>

        <p className="mt-2 text-sm text-black/60">
          {blockingMessage ||
            (locale.startsWith('fr')
              ? 'Vérification de votre compte…'
              : 'Checking your account…')}
        </p>
      </div>
    </div>
  );
}
