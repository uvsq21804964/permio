'use client';

import Link from 'next/link';
import type * as React from 'react';

import {
  trackButtonClick,
  type ButtonTrackingMetadata,
} from '@/lib/client/button-tracking';

type TrackingPayload = {
  buttonKey: string;
  buttonLabel: string;
  buttonContext: string;
  targetHref: string;
  locale: string;
  metadata?: ButtonTrackingMetadata | null;
};

type TrackedBillingButtonProps = React.ComponentProps<'button'> & {
  tracking: TrackingPayload;
};

type TrackedBillingLinkProps = React.ComponentProps<typeof Link> & {
  tracking: TrackingPayload;
};

function track(tracking: TrackingPayload) {
  trackButtonClick({
    buttonKey: tracking.buttonKey,
    buttonLabel: tracking.buttonLabel,
    buttonContext: tracking.buttonContext,
    targetHref: tracking.targetHref,
    locale: tracking.locale,
    metadata: tracking.metadata ?? null,
  });
}

export function TrackedBillingButton({
  tracking,
  onClick,
  ...props
}: TrackedBillingButtonProps) {
  return (
    <button
      {...props}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented || props.disabled) {
          return;
        }

        track(tracking);
      }}
    />
  );
}

export function TrackedBillingLink({
  tracking,
  onClick,
  ...props
}: TrackedBillingLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        track(tracking);
      }}
    />
  );
}
