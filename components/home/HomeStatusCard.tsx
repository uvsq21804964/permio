'use client';

import Image from 'next/image';
import Link from 'next/link';

type Props = {
  locale: string;
  logo: string;
  title: string;
  description: string;
  cta?: {
    href: string;
    label: string;
  };
};

export default function HomeStatusCard({
  locale,
  logo,
  title,
  description,
  cta,
}: Props) {
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
          <span className="text-base font-semibold text-black">MagicHango</span>
        </div>

        <div className="text-lg font-bold text-black">{title}</div>
        <p className="mt-2 text-sm text-black/60">{description}</p>

        {cta ? (
          <div className="mt-5">
            <Link
              href={cta.href}
              locale={false}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition"
            >
              {cta.label}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
