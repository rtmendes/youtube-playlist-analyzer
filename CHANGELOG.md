# Changelog

## 2026-07-02

### PR #2 — feat/comment-analysis-persist (merged)
- Comment analysis + starred comments + persistent subdomain.
- Gate fixes before merge: type errors vs newer main (index-signature
  constraint, Set iteration target, zod record arity, localStorage defaults)
  — tsc 0 errors, 620/620 tests, build clean, no secrets in diff.
- ⚠️ DB APPLY HELD: schema adds `user_settings` table (additive). Migration
  (`drizzle-kit generate && migrate`) is a SEPARATE founder-gated step —
  back up DB first. `drizzle-kit push` forbidden on prod.
