# Front pages -> lib dependencies + API calls

Generated at: 2026-04-19T18:53:38.531Z

## Overview

- pages: 21
- uniqueLibFiles: 45
- totalFrontToLibLinks: 107
- uniqueApiRoutes: 27
- totalApiEdges: 30

## app/[locale]/(routes)/(routes)/(app)/(client)/book/address/page.tsx

### Lib dependencies

- `lib/client/api/me-client.ts` (front-to-lib-transitive)
- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/api/services-client.ts` (front-to-lib-transitive)
- `lib/client/hooks/useGoogleMapPreview.ts` (front-to-lib-transitive)
- `lib/client/hooks/useGooglePlacesAutocomplete.ts` (front-to-lib-transitive)
- `lib/client/utils/address.ts` (front-to-lib-transitive)
- `lib/client/utils/google-maps.ts` (front-to-lib-transitive)
- `lib/utils.ts` (front-to-lib-transitive)

### API calls

- `/api/me/hours` -> `app/api/me/hours/route.ts` (api-occurrence, #225cb9)
- `/api/me/instructor-services` -> `app/api/me/instructor-services/route.ts` (api-occurrence, #9722b4)
- `/api/me/profile` -> `app/api/me/profile/route.ts` (api-occurrence, #db1f54)
- `/api/me/role` -> `app/api/me/role/route.ts` (api-occurrence, #70c31d)
- `/api/me/services` -> `app/api/me/services/route.ts` (api-occurrence, #3220d5)
- `/api/me/subscription` -> `app/api/me/subscription/route.ts` (api-occurrence, #1a6ce0)

## app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx

### Lib dependencies

- `lib/client/api/booking-client.ts` (front-to-lib-transitive)
- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/api/services-client.ts` (front-to-lib-transitive)
- `lib/client/hooks/useBookingServices.ts` (front-to-lib-transitive)
- `lib/client/hooks/useBookSlot.ts` (front-to-lib-transitive)
- `lib/client/hooks/useDecodedBookingAddress.ts` (front-to-lib-transitive)
- `lib/client/hooks/useInstructorServices.ts` (front-to-lib-transitive)
- `lib/client/hooks/useInstructorWeeklyAgenda.ts` (front-to-lib-transitive)
- `lib/client/utils/booking.ts` (front-to-lib-transitive)
- `lib/utils.ts` (front-to-lib-transitive)

### API calls

- `/api/me/instructor-services` -> `app/api/me/instructor-services/route.ts` (api-occurrence, #9722b4)
- `/api/me/instructor-weekly-agenda` -> `app/api/me/instructor-weekly-agenda/route.ts` (api-occurrence, #c31d70)
- `/api/me/instructor-weekly-agenda-proposals` -> `app/api/me/instructor-weekly-agenda-proposals/route.ts` (api-occurrence, #c52645)
- `/api/me/services` -> `app/api/me/services/route.ts` (api-occurrence, #3220d5)
- `/api/slots` -> `app/api/slots/route.ts` (api-occurrence, #70b81e)

## app/[locale]/(routes)/(routes)/(app)/(client)/book/proposals/page.tsx

### Lib dependencies

- `lib/client/api/booking-client.ts` (front-to-lib-transitive)
- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/api/services-client.ts` (front-to-lib-transitive)
- `lib/client/hooks/useBookingServices.ts` (front-to-lib-transitive)
- `lib/client/hooks/useBookSlot.ts` (front-to-lib-transitive)
- `lib/client/hooks/useDecodedBookingAddress.ts` (front-to-lib-transitive)
- `lib/client/hooks/useInstructorProposalAgenda.ts` (front-to-lib-transitive)
- `lib/client/hooks/useInstructorServices.ts` (front-to-lib-transitive)
- `lib/client/utils/booking.ts` (front-to-lib-transitive)

### API calls

- `/api/me/instructor-services` -> `app/api/me/instructor-services/route.ts` (api-occurrence, #9722b4)
- `/api/me/instructor-weekly-agenda` -> `app/api/me/instructor-weekly-agenda/route.ts` (api-occurrence, #c31d70)
- `/api/me/instructor-weekly-agenda-proposals` -> `app/api/me/instructor-weekly-agenda-proposals/route.ts` (api-occurrence, #c52645)
- `/api/me/services` -> `app/api/me/services/route.ts` (api-occurrence, #3220d5)
- `/api/slots` -> `app/api/slots/route.ts` (api-occurrence, #70b81e)

## app/[locale]/(routes)/(routes)/(app)/(client)/book/services/page.tsx

### Lib dependencies

- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/api/services-client.ts` (front-to-lib-transitive)
- `lib/client/hooks/useInstructorServices.ts` (front-to-lib-transitive)

### API calls

- `/api/me/instructor-services` -> `app/api/me/instructor-services/route.ts` (api-occurrence, #9722b4)
- `/api/me/services` -> `app/api/me/services/route.ts` (api-occurrence, #3220d5)

## app/[locale]/(routes)/(routes)/(app)/(client)/layout.tsx

### Lib dependencies

- `lib/db.ts` (front-to-lib-transitive)

### API calls

- None

## app/[locale]/(routes)/(routes)/(app)/(educator)/availability/page.tsx

### Lib dependencies

- `lib/availability-utils.ts` (front-to-lib-transitive)
- `lib/client/api/availabilities-client.ts` (front-to-lib-transitive)
- `lib/client/api/me-client.ts` (front-to-lib-transitive)
- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/hooks/useAvailabilityCurrentUser.ts` (front-to-lib-transitive)
- `lib/client/hooks/useAvailabilityRangesDialogState.ts` (front-to-lib-transitive)
- `lib/client/hooks/useAvailabilityRoleGate.ts` (front-to-lib-transitive)
- `lib/client/hooks/useDayOverrides.ts` (front-to-lib-transitive)
- `lib/client/hooks/useRelativeTimeFormatter.ts` (front-to-lib-transitive)
- `lib/client/hooks/useTimedNotice.ts` (front-to-lib-transitive)
- `lib/client/hooks/useWeeklyAvailabilities.ts` (front-to-lib-transitive)
- `lib/client/hooks/useWeeklyGlobalAgendaData.ts` (front-to-lib-transitive)
- `lib/client/utils/availability-editor.ts` (front-to-lib-transitive)
- `lib/client/utils/availability-time.ts` (front-to-lib-transitive)
- `lib/client/utils/schedule-display.ts` (front-to-lib-transitive)
- `lib/utils.ts` (front-to-lib-transitive)

### API calls

- `/api/availabilities` -> `app/api/availabilities/route.ts` (api-occurrence, #b7ce1c)
- `/api/availabilities/all` -> `app/api/availabilities/all/route.ts` (api-occurrence, #97b422)
- `/api/availabilities/bulk` -> `app/api/availabilities/bulk/route.ts` (api-occurrence, #19c233)
- `/api/availabilities/day` -> `app/api/availabilities/day/route.ts` (api-occurrence, #1eb0be)
- `/api/me/hours` -> `app/api/me/hours/route.ts` (api-occurrence, #225cb9)
- `/api/me/profile` -> `app/api/me/profile/route.ts` (api-occurrence, #db1f54)
- `/api/me/role` -> `app/api/me/role/route.ts` (api-occurrence, #70c31d)
- `/api/me/subscription` -> `app/api/me/subscription/route.ts` (api-occurrence, #1a6ce0)
- `/api/slots/week` -> `app/api/slots/week/route.ts` (api-occurrence, #cf2058)
- `/api/travels/week` -> `app/api/travels/week/route.ts` (api-occurrence, #20cfbb)

## app/[locale]/(routes)/(routes)/(app)/(educator)/configuration/page.tsx

### Lib dependencies

- `lib/client/api/availabilities-client.ts` (front-to-lib-transitive)
- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/api/schedule-client.ts` (front-to-lib-transitive)
- `lib/client/api/users-client.ts` (front-to-lib-transitive)
- `lib/client/hooks/useAgencyUsers.ts` (front-to-lib-transitive)
- `lib/client/hooks/useAllAvailabilities.ts` (front-to-lib-transitive)
- `lib/client/hooks/useCommitSchedule.ts` (front-to-lib-transitive)
- `lib/client/utils/schedule-display.ts` (front-to-lib-transitive)
- `lib/schedule-utils.ts` (front-to-lib-transitive)
- `lib/utils.ts` (front-to-lib-transitive)

### API calls

- `/api/availabilities` -> `app/api/availabilities/route.ts` (api-occurrence, #b7ce1c)
- `/api/availabilities/all` -> `app/api/availabilities/all/route.ts` (api-occurrence, #97b422)
- `/api/availabilities/bulk` -> `app/api/availabilities/bulk/route.ts` (api-occurrence, #19c233)
- `/api/availabilities/day` -> `app/api/availabilities/day/route.ts` (api-occurrence, #1eb0be)
- `/api/me/weeks` -> `app/api/me/weeks/route.ts` (api-occurrence, #9824d6)
- `/api/schedule` -> `app/api/schedule/route.ts` (api-occurrence, #20d532)
- `/api/schedule/commit` -> `app/api/schedule/commit/route.ts` (api-occurrence, #bf229a)
- `/api/slots/week` -> `app/api/slots/week/route.ts` (api-occurrence, #cf2058)
- `/api/travels/week` -> `app/api/travels/week/route.ts` (api-occurrence, #20cfbb)
- `/api/users` -> `app/api/users/route.ts` (api-occurrence, #d45c1c)

## app/[locale]/(routes)/(routes)/(app)/(educator)/layout.tsx

### Lib dependencies

- `lib/db.ts` (front-to-lib-transitive)

### API calls

- None

## app/[locale]/(routes)/(routes)/(app)/layout.tsx

### Lib dependencies

- `lib/db.ts` (front-to-lib-transitive)

### API calls

- None

## app/[locale]/(routes)/(routes)/(app)/myweek/page.tsx

### Lib dependencies

- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/api/schedule-client.ts` (front-to-lib-transitive)
- `lib/client/api/services-client.ts` (front-to-lib-transitive)
- `lib/client/hooks/useMyWeeks.ts` (front-to-lib-transitive)
- `lib/client/hooks/useOwnServiceSummary.ts` (front-to-lib-transitive)
- `lib/client/utils/schedule-display.ts` (front-to-lib-transitive)
- `lib/db.ts` (front-to-lib-transitive)
- `lib/utils.ts` (front-to-lib-transitive)

### API calls

- `/api/me/instructor-services` -> `app/api/me/instructor-services/route.ts` (api-occurrence, #9722b4)
- `/api/me/services` -> `app/api/me/services/route.ts` (api-occurrence, #3220d5)
- `/api/me/weeks` -> `app/api/me/weeks/route.ts` (api-occurrence, #9824d6)
- `/api/schedule` -> `app/api/schedule/route.ts` (api-occurrence, #20d532)
- `/api/schedule/commit` -> `app/api/schedule/commit/route.ts` (api-occurrence, #bf229a)

## app/[locale]/(routes)/(routes)/(pay)/(educator)/gestion/page.tsx

### Lib dependencies

- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/api/users-client.ts` (front-to-lib-transitive)
- `lib/client/hooks/useAgencyUsers.ts` (front-to-lib-transitive)
- `lib/client/hooks/useStudentHoursMutations.ts` (front-to-lib-transitive)
- `lib/client/hooks/useUserRoleMutations.ts` (front-to-lib-transitive)
- `lib/db.ts` (front-to-lib-transitive)

### API calls

- `/api/users` -> `app/api/users/route.ts` (api-occurrence, #d45c1c)

## app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx

### Lib dependencies

- `lib/db.ts` (front-to-lib-transitive)
- `lib/stripe.ts` (front-to-lib-transitive)

### API calls

- `/api/stripe/checkout` -> `app/api/stripe/checkout/route.ts` (api-occurrence, #9fdb1f)
- `/api/stripe/portal` -> `app/api/stripe/portal/route.ts` (api-occurrence, #b99e22)
- `/api/stripe/subscription/cancel` -> `app/api/stripe/subscription/cancel/route.ts` (api-occurrence, #cfbb20)
- `/api/stripe/subscription/resume` -> `app/api/stripe/subscription/resume/route.ts` (api-occurrence, #b21abc)

## app/[locale]/(routes)/(routes)/(pay)/(educator)/layout.tsx

### Lib dependencies

- `lib/db.ts` (front-to-lib-transitive)

### API calls

- None

## app/[locale]/(routes)/(routes)/(pay)/(educator)/plans/page.tsx

### Lib dependencies

- `lib/client/api/me-client.ts` (front-to-lib-transitive)
- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/hooks/useMySubscriptionStatus.ts` (front-to-lib-transitive)
- `lib/utils.ts` (front-to-lib-transitive)

### API calls

- `/api/me/hours` -> `app/api/me/hours/route.ts` (api-occurrence, #225cb9)
- `/api/me/profile` -> `app/api/me/profile/route.ts` (api-occurrence, #db1f54)
- `/api/me/role` -> `app/api/me/role/route.ts` (api-occurrence, #70c31d)
- `/api/me/subscription` -> `app/api/me/subscription/route.ts` (api-occurrence, #1a6ce0)

## app/[locale]/(routes)/(routes)/(pay)/(educator)/services/page.tsx

### Lib dependencies

- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/api/services-client.ts` (front-to-lib-transitive)
- `lib/client/hooks/useEditableServices.ts` (front-to-lib-transitive)

### API calls

- `/api/me/instructor-services` -> `app/api/me/instructor-services/route.ts` (api-occurrence, #9722b4)
- `/api/me/services` -> `app/api/me/services/route.ts` (api-occurrence, #3220d5)

## app/[locale]/(routes)/(routes)/(pay)/accueil/page.tsx

### Lib dependencies

- `lib/utils.ts` (front-to-lib-transitive)

### API calls

- None

## app/[locale]/(routes)/(routes)/(pay)/profile/page.tsx

### Lib dependencies

- `lib/client/api/profile-client.ts` (front-to-lib-transitive)
- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/hooks/useGoogleMapPreview.ts` (front-to-lib-transitive)
- `lib/client/hooks/useGooglePlacesAutocomplete.ts` (front-to-lib-transitive)
- `lib/client/utils/address.ts` (front-to-lib-transitive)
- `lib/client/utils/google-maps.ts` (front-to-lib-transitive)

### API calls

- `/api/agency/association` -> `app/api/agency/association/route.ts` (api-occurrence, #c526c5)
- `/api/me/account_bdd` -> `app/api/me/account_bdd/route.ts` (api-occurrence, #581cce)
- `/api/me/delete-account` -> `app/api/me/delete-account/route.ts` (api-occurrence, #1fdb35)
- `/api/me/profile` -> `app/api/me/profile/route.ts` (api-occurrence, #db1f54)
- `/api/onboarding/trainer` -> `app/api/onboarding/trainer/route.ts` (api-occurrence, #bc711a)

## app/[locale]/(routes)/(routes)/layout.tsx

### Lib dependencies

- `lib/db.ts` (front-to-lib-transitive)

### API calls

- None

## app/[locale]/(routes)/home/page.tsx

### Lib dependencies

- `lib/client/api/me-client.ts` (front-to-lib-transitive)
- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/hooks/useMySubscriptionStatus.ts` (front-to-lib-transitive)
- `lib/utils.ts` (front-to-lib-transitive)

### API calls

- `/api/me/hours` -> `app/api/me/hours/route.ts` (api-occurrence, #225cb9)
- `/api/me/profile` -> `app/api/me/profile/route.ts` (api-occurrence, #db1f54)
- `/api/me/role` -> `app/api/me/role/route.ts` (api-occurrence, #70c31d)
- `/api/me/subscription` -> `app/api/me/subscription/route.ts` (api-occurrence, #1a6ce0)

## app/[locale]/(routes)/onboarding/choose-organization/page.tsx

### Lib dependencies

- `lib/client/api/availabilities-client.ts` (front-to-lib-transitive)
- `lib/client/api/profile-client.ts` (front-to-lib-transitive)
- `lib/client/api/request.ts` (front-to-lib-transitive)
- `lib/client/hooks/useAvailabilityRangesDialogState.ts` (front-to-lib-transitive)
- `lib/client/hooks/useEditableWeeklyAvailabilityDraft.ts` (front-to-lib-transitive)
- `lib/client/hooks/useGooglePlacesAutocomplete.ts` (front-to-lib-transitive)
- `lib/client/utils/address.ts` (front-to-lib-transitive)
- `lib/client/utils/availability-editor.ts` (front-to-lib-transitive)
- `lib/client/utils/availability-time.ts` (front-to-lib-transitive)
- `lib/client/utils/google-maps.ts` (front-to-lib-transitive)
- `lib/utils.ts` (front-to-lib-transitive)

### API calls

- `/api/agency/association` -> `app/api/agency/association/route.ts` (api-occurrence, #c526c5)
- `/api/availabilities` -> `app/api/availabilities/route.ts` (api-occurrence, #b7ce1c)
- `/api/availabilities/all` -> `app/api/availabilities/all/route.ts` (api-occurrence, #97b422)
- `/api/availabilities/bulk` -> `app/api/availabilities/bulk/route.ts` (api-occurrence, #19c233)
- `/api/availabilities/day` -> `app/api/availabilities/day/route.ts` (api-occurrence, #1eb0be)
- `/api/me/account_bdd` -> `app/api/me/account_bdd/route.ts` (api-occurrence, #581cce)
- `/api/me/delete-account` -> `app/api/me/delete-account/route.ts` (api-occurrence, #1fdb35)
- `/api/me/profile` -> `app/api/me/profile/route.ts` (api-occurrence, #db1f54)
- `/api/onboarding/trainer` -> `app/api/onboarding/trainer/route.ts` (api-occurrence, #bc711a)
- `/api/slots/week` -> `app/api/slots/week/route.ts` (api-occurrence, #cf2058)
- `/api/travels/week` -> `app/api/travels/week/route.ts` (api-occurrence, #20cfbb)

## app/[locale]/leastory/page.tsx

### Lib dependencies

- `lib/utils.ts` (front-to-lib-transitive)

### API calls

- None
