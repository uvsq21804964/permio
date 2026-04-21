# API call summary

Generated at: 2026-04-19T18:53:38.523Z

## Overview

- mappedOccurrences: 33
- unmatchedOccurrences: 84
- uniqueApiPaths: 27
- uniqueRouteFiles: 27
- uniqueSourceFiles: 12

## API routes

### /api/agency/association

- routeFile: `app/api/agency/association/route.ts`
- color: `#c526c5`
- callers: 1

  - `lib/client/api/profile-client.ts` (api-occurrence)

### /api/availabilities

- routeFile: `app/api/availabilities/route.ts`
- color: `#b7ce1c`
- callers: 1

  - `lib/client/api/availabilities-client.ts` (api-occurrence)

### /api/availabilities/all

- routeFile: `app/api/availabilities/all/route.ts`
- color: `#97b422`
- callers: 1

  - `lib/client/api/availabilities-client.ts` (api-occurrence)

### /api/availabilities/bulk

- routeFile: `app/api/availabilities/bulk/route.ts`
- color: `#19c233`
- callers: 1

  - `lib/client/api/availabilities-client.ts` (api-occurrence)

### /api/availabilities/day

- routeFile: `app/api/availabilities/day/route.ts`
- color: `#1eb0be`
- callers: 1

  - `lib/client/api/availabilities-client.ts` (api-occurrence)

### /api/me/account_bdd

- routeFile: `app/api/me/account_bdd/route.ts`
- color: `#581cce`
- callers: 1

  - `lib/client/api/profile-client.ts` (api-occurrence)

### /api/me/delete-account

- routeFile: `app/api/me/delete-account/route.ts`
- color: `#1fdb35`
- callers: 1

  - `lib/client/api/profile-client.ts` (api-occurrence)

### /api/me/hours

- routeFile: `app/api/me/hours/route.ts`
- color: `#225cb9`
- callers: 2

  - `lib/client/api/me-client.ts` (api-occurrence)
  - `lib/client/hooks/useAvailabilityCurrentUser.ts` (api-occurrence)

### /api/me/instructor-services

- routeFile: `app/api/me/instructor-services/route.ts`
- color: `#9722b4`
- callers: 1

  - `lib/client/api/services-client.ts` (api-occurrence)

### /api/me/instructor-weekly-agenda

- routeFile: `app/api/me/instructor-weekly-agenda/route.ts`
- color: `#c31d70`
- callers: 1

  - `lib/client/api/booking-client.ts` (api-occurrence)

### /api/me/instructor-weekly-agenda-proposals

- routeFile: `app/api/me/instructor-weekly-agenda-proposals/route.ts`
- color: `#c52645`
- callers: 1

  - `lib/client/api/booking-client.ts` (api-occurrence)

### /api/me/profile

- routeFile: `app/api/me/profile/route.ts`
- color: `#db1f54`
- callers: 2

  - `lib/client/api/me-client.ts` (api-occurrence)
  - `lib/client/api/profile-client.ts` (api-occurrence)

### /api/me/role

- routeFile: `app/api/me/role/route.ts`
- color: `#70c31d`
- callers: 2

  - `lib/client/api/me-client.ts` (api-occurrence)
  - `lib/client/hooks/useAvailabilityCurrentUser.ts` (api-occurrence)

### /api/me/services

- routeFile: `app/api/me/services/route.ts`
- color: `#3220d5`
- callers: 1

  - `lib/client/api/services-client.ts` (api-occurrence)

### /api/me/subscription

- routeFile: `app/api/me/subscription/route.ts`
- color: `#1a6ce0`
- callers: 1

  - `lib/client/api/me-client.ts` (api-occurrence)

### /api/me/weeks

- routeFile: `app/api/me/weeks/route.ts`
- color: `#9824d6`
- callers: 1

  - `lib/client/api/schedule-client.ts` (api-occurrence)

### /api/onboarding/trainer

- routeFile: `app/api/onboarding/trainer/route.ts`
- color: `#bc711a`
- callers: 1

  - `lib/client/api/profile-client.ts` (api-occurrence)

### /api/schedule

- routeFile: `app/api/schedule/route.ts`
- color: `#20d532`
- callers: 1

  - `lib/client/api/schedule-client.ts` (api-occurrence)

### /api/schedule/commit

- routeFile: `app/api/schedule/commit/route.ts`
- color: `#bf229a`
- callers: 1

  - `lib/client/api/schedule-client.ts` (api-occurrence)

### /api/slots

- routeFile: `app/api/slots/route.ts`
- color: `#70b81e`
- callers: 1

  - `lib/client/api/booking-client.ts` (api-occurrence)

### /api/slots/week

- routeFile: `app/api/slots/week/route.ts`
- color: `#cf2058`
- callers: 1

  - `lib/client/api/availabilities-client.ts` (api-occurrence)

### /api/stripe/checkout

- routeFile: `app/api/stripe/checkout/route.ts`
- color: `#9fdb1f`
- callers: 2

  - `app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx` (api-occurrence)
  - `components/home/PlansSansSimulation.tsx` (api-occurrence)

### /api/stripe/portal

- routeFile: `app/api/stripe/portal/route.ts`
- color: `#b99e22`
- callers: 1

  - `app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx` (api-occurrence)

### /api/stripe/subscription/cancel

- routeFile: `app/api/stripe/subscription/cancel/route.ts`
- color: `#cfbb20`
- callers: 1

  - `app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx` (api-occurrence)

### /api/stripe/subscription/resume

- routeFile: `app/api/stripe/subscription/resume/route.ts`
- color: `#b21abc`
- callers: 1

  - `app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx` (api-occurrence)

### /api/travels/week

- routeFile: `app/api/travels/week/route.ts`
- color: `#20cfbb`
- callers: 1

  - `lib/client/api/availabilities-client.ts` (api-occurrence)

### /api/users

- routeFile: `app/api/users/route.ts`
- color: `#d45c1c`
- callers: 3

  - `app/api/users/[id]/role/route.ts` (api-occurrence)
  - `app/api/users/[id]/route.ts` (api-occurrence)
  - `lib/client/api/users-client.ts` (api-occurrence)

## Source files

### app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx

- `/api/stripe/checkout` -> `app/api/stripe/checkout/route.ts` (api-occurrence, #9fdb1f)
- `/api/stripe/portal` -> `app/api/stripe/portal/route.ts` (api-occurrence, #b99e22)
- `/api/stripe/subscription/cancel` -> `app/api/stripe/subscription/cancel/route.ts` (api-occurrence, #cfbb20)
- `/api/stripe/subscription/resume` -> `app/api/stripe/subscription/resume/route.ts` (api-occurrence, #b21abc)

### app/api/users/[id]/role/route.ts

- `/api/users` -> `app/api/users/route.ts` (api-occurrence, #d45c1c)

### app/api/users/[id]/route.ts

- `/api/users` -> `app/api/users/route.ts` (api-occurrence, #d45c1c)

### components/home/PlansSansSimulation.tsx

- `/api/stripe/checkout` -> `app/api/stripe/checkout/route.ts` (api-occurrence, #9fdb1f)

### lib/client/api/availabilities-client.ts

- `/api/availabilities` -> `app/api/availabilities/route.ts` (api-occurrence, #b7ce1c)
- `/api/availabilities/all` -> `app/api/availabilities/all/route.ts` (api-occurrence, #97b422)
- `/api/availabilities/bulk` -> `app/api/availabilities/bulk/route.ts` (api-occurrence, #19c233)
- `/api/availabilities/day` -> `app/api/availabilities/day/route.ts` (api-occurrence, #1eb0be)
- `/api/slots/week` -> `app/api/slots/week/route.ts` (api-occurrence, #cf2058)
- `/api/travels/week` -> `app/api/travels/week/route.ts` (api-occurrence, #20cfbb)

### lib/client/api/booking-client.ts

- `/api/me/instructor-weekly-agenda` -> `app/api/me/instructor-weekly-agenda/route.ts` (api-occurrence, #c31d70)
- `/api/me/instructor-weekly-agenda-proposals` -> `app/api/me/instructor-weekly-agenda-proposals/route.ts` (api-occurrence, #c52645)
- `/api/slots` -> `app/api/slots/route.ts` (api-occurrence, #70b81e)

### lib/client/api/me-client.ts

- `/api/me/hours` -> `app/api/me/hours/route.ts` (api-occurrence, #225cb9)
- `/api/me/profile` -> `app/api/me/profile/route.ts` (api-occurrence, #db1f54)
- `/api/me/role` -> `app/api/me/role/route.ts` (api-occurrence, #70c31d)
- `/api/me/subscription` -> `app/api/me/subscription/route.ts` (api-occurrence, #1a6ce0)

### lib/client/api/profile-client.ts

- `/api/agency/association` -> `app/api/agency/association/route.ts` (api-occurrence, #c526c5)
- `/api/me/account_bdd` -> `app/api/me/account_bdd/route.ts` (api-occurrence, #581cce)
- `/api/me/delete-account` -> `app/api/me/delete-account/route.ts` (api-occurrence, #1fdb35)
- `/api/me/profile` -> `app/api/me/profile/route.ts` (api-occurrence, #db1f54)
- `/api/onboarding/trainer` -> `app/api/onboarding/trainer/route.ts` (api-occurrence, #bc711a)

### lib/client/api/schedule-client.ts

- `/api/me/weeks` -> `app/api/me/weeks/route.ts` (api-occurrence, #9824d6)
- `/api/schedule` -> `app/api/schedule/route.ts` (api-occurrence, #20d532)
- `/api/schedule/commit` -> `app/api/schedule/commit/route.ts` (api-occurrence, #bf229a)

### lib/client/api/services-client.ts

- `/api/me/instructor-services` -> `app/api/me/instructor-services/route.ts` (api-occurrence, #9722b4)
- `/api/me/services` -> `app/api/me/services/route.ts` (api-occurrence, #3220d5)

### lib/client/api/users-client.ts

- `/api/users` -> `app/api/users/route.ts` (api-occurrence, #d45c1c)

### lib/client/hooks/useAvailabilityCurrentUser.ts

- `/api/me/hours` -> `app/api/me/hours/route.ts` (api-occurrence, #225cb9)
- `/api/me/role` -> `app/api/me/role/route.ts` (api-occurrence, #70c31d)

## Unmatched

- `app/[locale]/(routes)/(routes)/(app)/(client)/book/address/page.tsx` -> `/api/me-client` (api-occurrence)
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/address/page.tsx` -> `/api/services-client` (api-occurrence)
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx` -> `/api/request` (api-occurrence)
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/proposals/page.tsx` -> `/api/request` (api-occurrence)
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/proposals/page.tsx` -> `/api/services-client` (api-occurrence)
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/services/page.tsx` -> `/api/services-client` (api-occurrence)
- `app/[locale]/(routes)/(routes)/(pay)/(educator)/services/page.tsx` -> `/api/services-client` (api-occurrence)
- `app/[locale]/(routes)/(routes)/(pay)/profile/page.tsx` -> `/api/profile-client` (api-occurrence)
- `app/[locale]/(routes)/onboarding/choose-organization/page.tsx` -> `/api/profile-client` (api-occurrence)
- `app/api/agency/association/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/availabilities/all/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/availabilities/all/route.ts` -> `/api/availabilities]` (api-occurrence)
- `app/api/availabilities/bulk/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/availabilities/day/[id]/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/availabilities/day/[id]/route.ts` -> `/api/day-availabilities` (api-occurrence)
- `app/api/availabilities/day/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/availabilities/day/route.ts` -> `/api/availabilities/day]` (api-occurrence)
- `app/api/availabilities/day/route.ts` -> `/api/day-availabilities]` (api-occurrence)
- `app/api/availabilities/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/availabilities/route.ts` -> `/api/availabilities]` (api-occurrence)
- `app/api/me/account_bdd/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/me/delete-account/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/me/hours/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/me/instructor-services/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/me/instructor-services/route.ts` -> `/api/me/instructor-services]` (api-occurrence)
- `app/api/me/instructor-weekly-agenda-proposals/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/me/instructor-weekly-agenda-proposals/route.ts` -> `/api/me/instructor-weekly-agenda]` (api-occurrence)
- `app/api/me/instructor-weekly-agenda/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/me/instructor-weekly-agenda/route.ts` -> `/api/me/instructor-weekly-agenda]` (api-occurrence)
- `app/api/me/profile/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/me/profile/route.ts` -> `/api/me/profile]` (api-occurrence)
- `app/api/me/services/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/me/services/route.ts` -> `/api/me/services]` (api-occurrence)
- `app/api/me/weeks/route.ts` -> `/api/agenda/last-week]` (api-occurrence)
- `app/api/me/weeks/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/me/weeks/route.ts` -> `/api/distancematrix/json` (api-occurrence)
- `app/api/onboarding/trainer/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/schedule/commit/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/schedule/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/slots/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/slots/route.ts` -> `/api/slots]` (api-occurrence)
- `app/api/stripe/create-checkout-session/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/travels/week/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/users/[id]/hours/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/users/[id]/role/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/users/[id]/route.ts` -> `/api/auth-server` (api-occurrence)
- `app/api/users/route.ts` -> `/api/auth-server` (api-occurrence)
- `components/gestion/UserManagement.tsx` -> `/api/users-client` (api-occurrence)
- `components/optimal-schedule.tsx` -> `/api/schedule-client` (api-occurrence)
- `components/schedule/CalculatedAgendaSection.tsx` -> `/api/users-client` (api-occurrence)
- `components/services/EditableServicesCatalog.tsx` -> `/api/services-client` (api-occurrence)
- `components/services/SelectableServicesCatalog.tsx` -> `/api/services-client` (api-occurrence)
- `components/services/ServiceFormDialog.tsx` -> `/api/services-client` (api-occurrence)
- `lib/client/api/availabilities-client.ts` -> `/api/request` (api-occurrence)
- `lib/client/api/booking-client.ts` -> `/api/request` (api-occurrence)
- `lib/client/api/me-client.ts` -> `/api/request` (api-occurrence)
- `lib/client/api/profile-client.ts` -> `/api/me-client` (api-occurrence)
- `lib/client/api/profile-client.ts` -> `/api/request` (api-occurrence)
- `lib/client/api/schedule-client.ts` -> `/api/request` (api-occurrence)
- `lib/client/api/services-client.ts` -> `/api/request` (api-occurrence)
- `lib/client/api/users-client.ts` -> `/api/request` (api-occurrence)
- `lib/client/hooks/useAgencyUsers.ts` -> `/api/users-client` (api-occurrence)
- `lib/client/hooks/useAllAvailabilities.ts` -> `/api/availabilities-client` (api-occurrence)
- `lib/client/hooks/useAvailabilityCurrentUser.ts` -> `/api/me-client` (api-occurrence)
- `lib/client/hooks/useAvailabilityRoleGate.ts` -> `/api/me-client` (api-occurrence)
- `lib/client/hooks/useBookSlot.ts` -> `/api/booking-client` (api-occurrence)
- `lib/client/hooks/useCommitSchedule.ts` -> `/api/schedule-client` (api-occurrence)
- `lib/client/hooks/useDayOverrides.ts` -> `/api/availabilities-client` (api-occurrence)
- `lib/client/hooks/useEditableServices.ts` -> `/api/request` (api-occurrence)
- `lib/client/hooks/useEditableServices.ts` -> `/api/services-client` (api-occurrence)
- `lib/client/hooks/useEditableWeeklyAvailabilityDraft.ts` -> `/api/availabilities-client` (api-occurrence)
- `lib/client/hooks/useEditableWeeklyAvailabilityDraft.ts` -> `/api/profile-client` (api-occurrence)
- `lib/client/hooks/useInstructorProposalAgenda.ts` -> `/api/booking-client` (api-occurrence)
- `lib/client/hooks/useInstructorServices.ts` -> `/api/services-client` (api-occurrence)
- `lib/client/hooks/useInstructorWeeklyAgenda.ts` -> `/api/booking-client` (api-occurrence)
- `lib/client/hooks/useMySubscriptionStatus.ts` -> `/api/me-client` (api-occurrence)
- `lib/client/hooks/useMyWeeks.ts` -> `/api/schedule-client` (api-occurrence)
- `lib/client/hooks/useOwnServiceSummary.ts` -> `/api/services-client` (api-occurrence)
- `lib/client/hooks/useStudentHoursMutations.ts` -> `/api/users-client` (api-occurrence)
- `lib/client/hooks/useUserRoleMutations.ts` -> `/api/users-client` (api-occurrence)
- `lib/client/hooks/useWeeklyAvailabilities.ts` -> `/api/availabilities-client` (api-occurrence)
- `lib/client/hooks/useWeeklyGlobalAgendaData.ts` -> `/api/availabilities-client` (api-occurrence)
- `lib/client/utils/booking.ts` -> `/api/booking-client` (api-occurrence)
- `lib/server/services/instructor-agenda-service.ts` -> `/api/distancematrix/json` (api-occurrence)
