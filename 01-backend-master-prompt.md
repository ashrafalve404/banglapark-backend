# MASTER PROMPT — Bangla Park Limited Backend (NestJS)

Use this entire document as your system/project brief. Read it fully before writing any code. Ask clarifying questions ONLY if something below is genuinely ambiguous — otherwise implement exactly as specified.

---

## 1. Project Identity

**Project Name:** Bangla Park Limited
**Document Type:** Product Requirements Document (PRD) — Backend Implementation
**Repository location:** `banglaparkweb/backend`

### 1.1 Product Vision

Bangla Park Limited is a modern MLM-enabled e-commerce platform that combines online shopping, referral-based network marketing, wallet management, commission distribution, and membership activation into a single ecosystem. Users register for free, purchase products, build referral teams, earn commissions based on referral activity, receive daily benefits based on active team size, and manage earnings through a secure in-app wallet.

This is **not** a plain e-commerce store. It is a **membership-driven MLM e-commerce backend** where:
- Registration is free.
- Product purchases activate membership (30-day cycle).
- Referrals build an unlimited-width network (no visual tree required).
- Generation commission rewards sponsors up to 10 levels deep, only once per new member.
- A daily cron job pays "Daily Benefit" based on active downline count.
- A wallet system logs every transaction immutably.
- Admin has full control and visibility over all of the above.

---

## 2. Tech Stack (mandatory)

- **Framework:** NestJS (latest stable, TypeScript strict mode)
- **ORM:** Prisma (preferred) with PostgreSQL
- **Auth:** JWT (access token + refresh token), Passport strategies, RBAC (roles: `USER`, `ADMIN`, `SUPER_ADMIN`)
- **Caching / Queues:** Redis + BullMQ (for cron-driven jobs and async commission processing)
- **Scheduling:** `@nestjs/schedule` for the daily benefit cron, backed by BullMQ for heavy processing at scale
- **Validation:** `class-validator` + `class-transformer` DTOs on every endpoint
- **Docs:** Swagger (`@nestjs/swagger`) auto-generated, fully annotated
- **Logging:** Structured logging (e.g. `pino` or Nest's Logger with a JSON transport), request correlation IDs
- **Rate limiting:** `@nestjs/throttler`
- **Containerization:** Docker + docker-compose (app, postgres, redis)
- **Testing:** Jest for unit tests on all commission/wallet logic (this is financial logic — it must be tested)

---

## 3. Folder Structure (inside `backend/`)

```
src/
  main.ts
  app.module.ts
  common/
    decorators/
    guards/            (JwtAuthGuard, RolesGuard)
    filters/           (global exception filter)
    interceptors/      (logging, transform response)
    pipes/
  config/              (env validation, config module)
  modules/
    auth/
    users/
    referral/
    products/
    categories/
    orders/
    wallet/
    commission/        (generation commission engine)
    daily-benefit/      (cron + calculation logic)
    withdrawal/
    notifications/
    admin/
    reports/
  prisma/
    schema.prisma
    migrations/
  jobs/                (BullMQ processors)
test/
docker-compose.yml
Dockerfile
.env.example
```

---

## 4. Core Business Rules (FINAL — implement exactly as written)

### 4.1 Registration & Activation
- Registration is **completely free** — no payment required to create an account.
- A new account's status defaults to `INACTIVE`.
- Account becomes `ACTIVE` only when the user completes a qualifying order of **≥ BDT 2,000** AND that order reaches status `DELIVERED`.
- On activation, `active_until = delivery_date + 30 days`.
- **Every month, the user must place another qualifying order (≥ BDT 2,000) before `active_until` expires.** If they do not, once `active_until` passes, the account automatically flips to `INACTIVE` and **no further commissions (daily benefit or generation) are added** from that point on.
- Re-purchasing after expiry re-activates the account for another 30 days (`active_until` resets from the new delivery date), but — see 4.3 — **does NOT re-trigger generation commission.**
- If a user is `INACTIVE`, they receive **zero** commission of any kind (daily benefit or generation) while inactive, and they are **excluded from their upline's/downline's active-count calculations** while inactive.

### 4.2 Referral System
- Every user gets a unique `referral_code` and shareable `referral_link` on registration (no purchase required to get a referral link).
- A new user may register under an existing member's referral code, creating one `parent_id` relationship (single sponsor, unlimited children).
- **No visual/graphical referral tree is required in the UI or API response.** Instead, expose aggregate stats: total referrals, active referrals, inactive referrals, and team performance summaries.
- There is **no cap on how many people a user can refer.**

### 4.3 Generation Commission
- Distributed across **10 sponsor levels** upward from a newly activated member.
- Triggered **once only**: when a member's **first-ever qualifying order** (≥ BDT 2,000) reaches status `DELIVERED`.
- On that trigger, credit **BDT 200 flat** to each of the 10 sponsor levels above the new member (Level 1 = direct sponsor ... Level 10 = 10th-level upline), provided that sponsor is currently `ACTIVE`. If a sponsor level is `INACTIVE` at the time of the event, that sponsor **receives nothing** for this event (do not queue it for later; it's simply skipped).
- **Reactivation (2nd, 3rd, ... purchase) by the same member NEVER triggers generation commission again.** Use an `is_first_activation` flag (or check `GenerationCommission` history for `from_user_id`) to enforce idempotency.
- Must run inside a DB transaction: order status update → activation update → generation commission fan-out → wallet credit, all-or-nothing.

### 4.4 Daily Benefit (Cron)
- Runs automatically every day (midnight, server timezone Asia/Dhaka) via a scheduled job.
- For every currently `ACTIVE` user, count their currently `ACTIVE` downline members (direct + indirect team members who are themselves active — clarify exact counting scope as "active team size," i.e. total active members in their entire referral network, not just direct).
- Apply this fixed-tier table (no interpolation — match the tier the count falls into; use the specification as thresholds, i.e. count ≥ tier value):

| Active Team Members | Daily Benefit |
|---|---|
| 5 | 100 |
| 20 | 200 |
| 50 | 300 |
| 100 | 500 |
| 500 | 1,000 |
| 5,000 | 2,000 |
| 10,000 | 5,000 |

- A user must themselves be `ACTIVE` to receive any daily benefit, regardless of team size.
- Only `ACTIVE` downline members count toward the threshold; inactive ones are excluded entirely.
- Credit the wallet automatically, generate a `WalletTransaction` of type `DAILY_BENEFIT` with a clear description and date reference (idempotent per user per day — never double-pay if the job reruns).
- Implement this as a BullMQ job so it can be safely retried/scaled for large user bases.

### 4.5 Wallet System
- Every user has exactly one wallet with a running `balance`.
- Every credit/debit must produce an **immutable** `WalletTransaction` row: `type` (`GENERATION_COMMISSION`, `DAILY_BENEFIT`, `PURCHASE`, `WITHDRAWAL`, `REFUND`, `ADMIN_ADJUSTMENT`), `amount`, `balance_after`, `reference_id`, `description`, `created_at`.
- Never allow direct balance mutation outside the transaction-logging service — build one central `WalletService.credit()` / `WalletService.debit()` used everywhere.

### 4.6 Withdrawal
- Minimum withdrawal amount: **BDT 1,000**.
- Supported methods: **bKash, Nagad, Rocket, Bank Transfer** (bank transfer requires account name, account number, bank name, branch).
- Flow: user requests → status `PENDING` → admin reviews → `APPROVED` (balance deducted, transaction logged) or `REJECTED` (no deduction, reason required).
- Do not deduct balance at request time — only on admin approval — but do lock/reserve the requested amount so it can't be double-withdrawn (e.g. a `pending_withdrawal` amount field, or check `available_balance = balance - sum(pending requests)`).

### 4.7 Order Lifecycle
`PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → CANCELLED`
- Commission logic (generation + activation) fires **only** on transition into `DELIVERED`.
- `CANCELLED` orders must never produce commission, wallet credit, or activation, at any stage. If an order is cancelled *after* delivery-triggered commissions were already paid, out of scope unless you want to add a reversal flag — implement a `commission_reversed` boolean on refund/cancellation-after-delivery for future-proofing, but default behavior is: cancellation before delivery = no commission ever generated in the first place.

---

## 5. Database Schema (Prisma models — implement these, extend as needed)

```prisma
model User {
  id              String   @id @default(uuid())
  name            String
  email           String   @unique
  phone           String   @unique
  passwordHash    String
  role            Role     @default(USER)
  referralCode    String   @unique
  parentId        String?
  parent          User?    @relation("Referral", fields: [parentId], references: [id])
  children        User[]   @relation("Referral")
  status          UserStatus @default(INACTIVE)
  activeUntil     DateTime?
  isFirstActivated Boolean @default(false)
  wallet          Wallet?
  orders          Order[]
  createdAt       DateTime @default(now())
}

enum Role { USER ADMIN SUPER_ADMIN }
enum UserStatus { ACTIVE INACTIVE }

model Wallet {
  id           String   @id @default(uuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id])
  balance      Decimal  @default(0)
  transactions WalletTransaction[]
}

model WalletTransaction {
  id           String   @id @default(uuid())
  walletId     String
  wallet       Wallet   @relation(fields: [walletId], references: [id])
  type         TxType
  amount       Decimal
  balanceAfter Decimal
  referenceId  String?
  description  String
  createdAt    DateTime @default(now())
}

enum TxType { GENERATION_COMMISSION DAILY_BENEFIT PURCHASE WITHDRAWAL REFUND ADMIN_ADJUSTMENT }

model Product {
  id         String   @id @default(uuid())
  name       String
  price      Decimal
  stock      Int
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])
  images     String[]
  createdAt  DateTime @default(now())
}

model Category {
  id       String    @id @default(uuid())
  name     String
  products Product[]
}

model Order {
  id            String      @id @default(uuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  items         OrderItem[]
  total         Decimal
  status        OrderStatus @default(PENDING)
  isQualifying  Boolean     @default(false) // total >= 2000
  deliveredAt   DateTime?
  createdAt     DateTime    @default(now())
}

enum OrderStatus { PENDING CONFIRMED PROCESSING SHIPPED DELIVERED CANCELLED }

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  quantity  Int
  price     Decimal
}

model GenerationCommission {
  id         String   @id @default(uuid())
  toUserId   String
  fromUserId String
  level      Int
  amount     Decimal
  createdAt  DateTime @default(now())
}

model DailyBenefitLog {
  id        String   @id @default(uuid())
  userId    String
  date      DateTime
  teamCount Int
  amount    Decimal
  @@unique([userId, date]) // idempotency guard
}

model WithdrawalRequest {
  id            String   @id @default(uuid())
  userId        String
  amount        Decimal
  method        WithdrawMethod
  accountDetails Json
  status        WithdrawStatus @default(PENDING)
  reason        String?
  createdAt     DateTime @default(now())
  reviewedAt    DateTime?
}

enum WithdrawMethod { BKASH NAGAD ROCKET BANK }
enum WithdrawStatus { PENDING APPROVED REJECTED }
```

---

## 6. API Modules to Build

1. **Auth** — register (with optional `referralCode` query param), login, refresh token, logout, forgot/reset password
2. **Users** — profile CRUD, activation status, `active_until` countdown, referral stats endpoint
3. **Referral** — get my referral code/link, list of direct + total team, active/inactive counts
4. **Products & Categories** — public listing, filtering, search, admin CRUD
5. **Orders** — cart-to-order checkout, order status admin updates, order history
6. **Wallet** — balance, transaction history (paginated, filterable by type/date)
7. **Commission** — internal service triggered on order `DELIVERED`; admin report endpoints
8. **Daily Benefit** — cron job + admin dashboard endpoint to view daily benefit logs/rules
9. **Withdrawal** — user request, admin approve/reject, history
10. **Admin** — user management (activate/deactivate override, ban), platform stats, income rule configuration (make the tier table and BDT 200/2000 thresholds admin-configurable, not hardcoded, for future flexibility)
11. **Notifications** — in-app notification log (activation reminders, commission received, withdrawal status)
12. **Reports** — sales report, commission payout report, active-user report (CSV export)

---

## 7. Non-Functional Requirements

- All monetary fields use `Decimal` (never float) to avoid rounding errors.
- Every write to wallet balance must happen inside a DB transaction alongside its transaction log row.
- Global exception filter returns consistent error shape: `{ statusCode, message, error, timestamp, path }`.
- Rate-limit auth endpoints aggressively (brute-force protection).
- Full Swagger docs at `/api/docs`.
- `.env.example` with all required variables (DB url, JWT secrets, Redis url, cron timezone).
- Seed script to create an initial `SUPER_ADMIN` and sample products/categories.
- Unit tests required for: commission fan-out logic, daily benefit tier calculation, wallet credit/debit atomicity, activation expiry logic.

---

## 8. Build Order (do it in this sequence)

**Phase 1:** Project scaffold, Prisma schema + migrations, Auth module, Users module, Referral module
**Phase 2:** Products, Categories, Orders (with qualifying-order + delivery status logic)
**Phase 3:** Wallet service, Generation Commission engine, Withdrawal module
**Phase 4:** Daily Benefit cron/BullMQ job, Notifications
**Phase 5:** Admin module (full management + configurable income rules), Reports, Swagger polish, Docker, seed data

Confirm each phase compiles and passes its unit tests before moving to the next.
