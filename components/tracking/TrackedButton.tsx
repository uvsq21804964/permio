'use client';

import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  trackButtonClick,
  type ButtonTrackingMetadata,
} from '@/lib/client/button-tracking';

type TrackedButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'asChild' | 'children' | 'onClick'
> & {
  children: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  trackingKey: string;
  trackingLabel?: string | null;
  trackingContext?: string | null;
  trackingMetadata?: ButtonTrackingMetadata | null;
  locale?: string | null;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
};

export function TrackedButton({
  children,
  href,
  target,
  rel,
  trackingKey,
  trackingLabel,
  trackingContext,
  trackingMetadata,
  locale,
  onClick,
  disabled,
  type = 'button',
  ...buttonProps
}: TrackedButtonProps) {
  const track = React.useCallback(() => {
    trackButtonClick({
      buttonKey: trackingKey,
      buttonLabel: trackingLabel,
      buttonContext: trackingContext,
      targetHref: href ?? null,
      locale,
      metadata: trackingMetadata ?? null,
    });
  }, [href, locale, trackingContext, trackingKey, trackingLabel, trackingMetadata]);

  if (href) {
    return (
      <Button {...buttonProps} asChild disabled={disabled}>
        <Link
          href={href}
          target={target}
          rel={rel}
          onClick={(event) => {
            onClick?.(event);

            if (event.defaultPrevented || disabled) {
              return;
            }

            track();
          }}
        >
          {children}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      {...buttonProps}
      type={type}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented || disabled) {
          return;
        }

        track();
      }}
    >
      {children}
    </Button>
  );
}
