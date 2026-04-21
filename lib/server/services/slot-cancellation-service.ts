import { inngest } from '@/src/lib/inngest/client';

import {
  deleteSlotForUser,
  getSlotCancellationDetails,
} from '@/lib/server/repositories/slot-repository';
import { getUserById } from '@/lib/server/repositories/user-repository';
import { devLogger } from '@/lib/shared/dev-logger';

type BookingLocale = 'fr' | 'en';

type SlotCancellationEventPayload = {
  id: string;
  name: 'slot/cancelled-client' | 'slot/cancelled-instructor';
  data: {
    slotId: number | string;
    agencyId: string | null;
    agencyName: string | null;
    instructorUserId: string;
    instructorName: string | null;
    clientUserId: string;
    clientName: string | null;
    serviceId: number;
    serviceName: string | null;
    date: string;
    startTime: string;
    endTime: string;
    formattedAddress: string | null;
    cancelledByUserId: string;
    cancelledByName: string | null;
    cancelledByRole: 'student' | 'instructor' | 'admin' | 'unknown';
    locale: BookingLocale;
  };
};

type CancelSlotResult =
  | { ok: true; status: 200; body: { slotId: number; deleted: true } }
  | { ok: false; status: 400; body: { error: string } }
  | { ok: false; status: 403; body: { error: string } }
  | { ok: false; status: 404; body: { error: string } }
  | { ok: false; status: 500; body: { error: string; detail?: string } };

function buildCancellationEvents(params: Omit<SlotCancellationEventPayload['data'], 'locale'> & {
  locale: BookingLocale;
}) {
  const common = {
    slotId: params.slotId,
    agencyId: params.agencyId,
    agencyName: params.agencyName,
    instructorUserId: params.instructorUserId,
    instructorName: params.instructorName,
    clientUserId: params.clientUserId,
    clientName: params.clientName,
    serviceId: params.serviceId,
    serviceName: params.serviceName,
    date: params.date,
    startTime: params.startTime,
    endTime: params.endTime,
    formattedAddress: params.formattedAddress,
    cancelledByUserId: params.cancelledByUserId,
    cancelledByName: params.cancelledByName,
    cancelledByRole: params.cancelledByRole,
    locale: params.locale,
  };

  return {
    client: {
      id: `slot:${params.slotId}:client-cancelled`,
      name: 'slot/cancelled-client',
      data: common,
    } satisfies SlotCancellationEventPayload,
    instructor: {
      id: `slot:${params.slotId}:instructor-cancelled`,
      name: 'slot/cancelled-instructor',
      data: common,
    } satisfies SlotCancellationEventPayload,
  };
}

async function emitCancellationEvent(
  label: 'Client cancellation' | 'Instructor cancellation',
  payload: SlotCancellationEventPayload,
) {
  try {
    devLogger.info(`[slot-cancellation] emit ${label}`, payload);
    await inngest.send(payload);
  } catch (error) {
    console.error(`[slot-cancellation] failed to emit ${label} event`, error);
  }
}

function isClientCancellationTooLate(params: {
  date: string;
  startTime: string;
}) {
  const [year, month, day] = params.date.split('-').map(Number);
  const [hours, minutes] = params.startTime.split(':').map(Number);

  const slotStart = new Date(
    year,
    (month || 1) - 1,
    day || 1,
    hours || 0,
    minutes || 0,
    0,
    0,
  );

  return slotStart.getTime() - Date.now() < 48 * 60 * 60 * 1000;
}

export async function cancelSlotBooking(params: {
  userId: string;
  slotId: number | string;
  locale: BookingLocale;
}): Promise<CancelSlotResult> {
  const { userId, slotId, locale } = params;

  try {
    const actor = await getUserById(userId);
    if (!actor) {
      return { ok: false, status: 404, body: { error: 'USER_NOT_FOUND' } };
    }

    const details = await getSlotCancellationDetails(slotId);
    if (!details) {
      return { ok: false, status: 404, body: { error: 'SLOT_NOT_FOUND' } };
    }

    if (details.clientUserId !== userId && details.instructorUserId !== userId) {
      return { ok: false, status: 403, body: { error: 'FORBIDDEN' } };
    }

    const isClientCancellingOwnSlot =
      actor.role === 'student' && details.clientUserId === userId;
    if (isClientCancellingOwnSlot) {
      const blocked = isClientCancellationTooLate({
        date: details.date,
        startTime: details.startTime,
      });

      if (blocked) {
        return {
          ok: false,
          status: 400,
          body: { error: 'CLIENT_CANCELLATION_TOO_LATE' },
        };
      }
    }

    const deleted = await deleteSlotForUser({ slotId, userId });
    if (!deleted) {
      return { ok: false, status: 404, body: { error: 'SLOT_NOT_FOUND' } };
    }

    const events = buildCancellationEvents({
      slotId: details.slotId,
      agencyId: details.agencyId,
      agencyName: details.agencyName,
      instructorUserId: details.instructorUserId,
      instructorName: details.instructorName,
      clientUserId: details.clientUserId,
      clientName: details.clientName,
      serviceId: details.serviceId,
      serviceName: details.serviceName,
      date: details.date,
      startTime: details.startTime,
      endTime: details.endTime,
      formattedAddress: details.formattedAddress,
      cancelledByUserId: actor.id,
      cancelledByName: actor.name ?? null,
      cancelledByRole:
        actor.role === 'student' || actor.role === 'instructor' || actor.role === 'admin'
          ? actor.role
          : 'unknown',
      locale,
    });

    await emitCancellationEvent('Client cancellation', events.client);
    await emitCancellationEvent('Instructor cancellation', events.instructor);

    return {
      ok: true,
      status: 200,
      body: { slotId: deleted.id, deleted: true },
    };
  } catch (error: any) {
    const detail =
      error?.detail ||
      error?.message ||
      error?.cause?.message ||
      'Unknown cancellation failure';

    console.error('[slot-cancellation] cancelSlotBooking failed', {
      slotId,
      userId,
      code: error?.code,
      detail,
      constraint: error?.constraint,
      table: error?.table,
    });

    return {
      ok: false,
      status: 500,
      body: {
        error: 'FAILED_TO_CANCEL_SLOT',
        detail,
      },
    };
  }
}
