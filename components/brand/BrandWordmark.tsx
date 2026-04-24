'use client';

import { cn } from '@/lib/utils';

type BrandWordmarkProps = {
  className?: string;
  tone?: 'light' | 'dark';
};

export function BrandWordmark({
  className,
  tone = 'light',
}: BrandWordmarkProps) {
  const isLight = tone === 'light';

  return (
    <span
      className={cn(
        'inline-flex items-end gap-1.5 whitespace-nowrap pb-1 leading-none',
        className,
      )}
    >
      <span
        className={cn(
          'pb-[0.18rem] text-[10px] font-semibold uppercase tracking-[0.24em] md:text-[11px]',
          isLight ? 'text-white/72' : 'text-foreground/65',
        )}
      >
        Magic
      </span>
      <span
        className={cn(
          'relative inline-flex items-center text-base font-black tracking-[-0.06em] md:text-lg',
          isLight ? 'text-white' : 'text-foreground',
        )}
      >
        Hango
        <span
          aria-hidden="true"
          className={cn(
            'absolute -bottom-0.5 left-0 right-0 h-[0.38rem] rounded-full',
            isLight ? 'bg-[#f9ffc6]/28' : 'bg-primary/18',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'absolute -right-2 bottom-[0.18rem] h-1.5 w-1.5 rounded-full',
            isLight ? 'bg-[#f9ffc6]' : 'bg-primary',
          )}
        />
      </span>
    </span>
  );
}
