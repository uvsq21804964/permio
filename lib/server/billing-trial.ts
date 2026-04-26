import {
  addOneMonth,
  toDate,
} from '@/lib/server/services/billing-page-shared';
import { loadBillingUserContext } from '@/lib/server/services/billing-page-repository';

export async function getRemainingBillingTrialDays(userId: string) {
  const context = await loadBillingUserContext(userId);
  if (!context || context.meDb.role !== 'instructor') {
    return null;
  }

  const { instructorCreatedAt, trialRow } = context;
  const trialEndDb = trialRow.trialEnd
    ? toDate(trialRow.trialEnd)
    : addOneMonth(instructorCreatedAt);
  const isInTrial =
    Boolean(trialRow.isInTrial) && Date.now() < trialEndDb.getTime();

  if (!isInTrial) {
    return null;
  }

  const remainingDays = Math.ceil(
    (trialEndDb.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(1, remainingDays);
}
