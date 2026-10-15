# People and permissions

Daily Check-in keeps no roles of its own. Central decides who may use the app and what they may do. This file is the short version of how that reaches the code.

## Who is in the app

One collection, `people`, one document per person, the way Central keeps them. A person is an employee or a student (`personType`, copied from Central). Documents are made and updated by `jobs/centralSync.js`, so everybody Central lists for `daily-checkin` is in the list before their first sign-in.

The sync asks Central one small question every minute (the key of `/application-entitlements/version`). It reads the full list only when the key moved. Unit, job, grade, class and who teaches what are not part of that key, so they are read in bulk every two minutes. Set `DAILY_AUTO_SYNC_SECONDS` to change the minute (minimum 15, `0` turns it off). Only one server instance syncs at a time.

`Sync Now` in the quick menu runs the same sync once. Status is in the `centralsyncstates` collection.

## What a person may do

Every API route asks for a permission, and `tests/smoke/route-permissions.test.js` fails if one does not. The permission list, with the sentence Central shows next to each, is in `backend/src/constants/permissions.js`. Send it to Central with:

```
npm run permissions:sync -- --confirm-removals
```

Then build the roles in Central. The two dashboards also have scope permissions:

| Dashboard | Opens with | Shows |
| --- | --- | --- |
| Students | `student_checkins.read` | the classes assigned to the person, or their unit with `student_checkins.scope.unit`, or everyone with `student_checkins.scope.all` |
| Staff | `dashboard.read` | nobody without a scope, their unit with `dashboard.scope.unit`, everyone with `dashboard.scope.all` |

A teacher with no assigned class does not see the student dashboard at all.

`jobKind` on a person is a label worked out from Central's job level (reports, contact list, AI prompt). It never opens or closes anything, and `tests/smoke/no-role-in-gates.test.js` keeps it out of the route gates.

## Moving from the old collections

The old `users` and `userstudents` collections are not touched. Back up the database first, then:

```
npm run migrate:people          # dry-run, prints what it would do
npm run migrate:people:apply    # writes
```

Each person keeps the `_id` they had, so check-ins, notifications and support requests keep pointing at the right person. Accounts without a Central person id are listed as "needs review" and not moved; the first sync creates them from Central anyway. Running it again changes nothing for people who are already there. To go back, deploy the previous version.
