# AI HR Agent - Enterprise SaaS Platform

## Overview
AI-powered HR management platform with recruitment, onboarding, employee engagement, compliance tracking, wellness programs, workforce analytics, and AI-driven insights. Production-grade SaaS with multi-tenancy, billing, and enterprise security.

## Architecture
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, wouter routing, TanStack Query v5
- **Backend**: Express.js, TypeScript, Passport.js (local strategy), session-based auth
- **Database**: PostgreSQL via Drizzle ORM (~55 tables)
- **AI**: OpenAI GPT-4o for insights, candidate evaluation, sentiment analysis, learning paths, resume PII redaction, multilingual translation
- **Security**: helmet, cors, express-rate-limit, CSP headers, account lockout, email verification
- **Email**: Nodemailer with Mailtrap sandbox

## Project Structure
- `shared/schema.ts` — All Drizzle table definitions, insert schemas, and types
- `server/routes.ts` — Thin route orchestrator (mounts all route modules + global error handler)
- `server/routes/` — Modular route handlers (40+ route modules)
- `server/middleware/` — Security, RBAC, pagination, validation, feature gating
  - `security.ts` — Helmet CSP, CORS, rate limiting (API: 500/15min, auth: 20/15min, password reset: 5/15min)
  - `rbac.ts` — Role-based access control (requireRole, requireMinRole)
  - `pagination.ts` — Server-side pagination helpers (parsePagination, paginatedResponse)
  - `validate.ts` — Zod validation middleware (validateBody, validateParams)
  - `featureGating.ts` — Plan-based feature gating (free/pro/enterprise)
- `server/services/` — Business logic services
  - `authService.ts` — Password reset, email verification, account lockout, login audit
  - `openai.ts` — OpenAI GPT-4o integration
  - `emailService.ts` — Branded email templates via Mailtrap
- `server/routes/organizations.ts` — Multi-tenant organization CRUD + usage
- `server/routes/billing.ts` — Subscription plans, Tap Payments checkout, plan management
- `server/routes/gdpr.ts` — GDPR data export and deletion request endpoints
- `server/routes/legal.ts` — Terms of Service, Privacy Policy, DPA
- `server/dbStorage.ts` — DatabaseStorage class implementing IStorage interface
- `server/storage.ts` — IStorage interface definition
- `server/auth.ts` — Passport.js with account lockout, login audit, password reset, email verification
- `server/seed.ts` — Database seeding script
- `client/src/App.tsx` — Route definitions with ErrorBoundary and auth-protected layout
- `client/src/hooks/use-auth.tsx` — AuthProvider context
- `client/src/hooks/usePageTitle.ts` — Dynamic page title management
- `client/src/components/ErrorBoundary.tsx` — React error boundary with retry/reload
- `client/src/components/layout/Sidebar.tsx` — Collapsible grouped sidebar navigation
- `client/src/pages/Legal.tsx` — Terms/Privacy/DPA pages
- `client/src/pages/Billing.tsx` — Pricing plans with Tap Payments checkout integration
- `client/src/pages/DataPrivacy.tsx` — GDPR data export, deletion requests, privacy rights
- `client/src/pages/auth-page.tsx` — Login, register, forgot password, reset password, email verification

## Database Schema (~55 tables)
### Core
users, organizations, candidates, employees, onboarding_tasks, hr_tasks, departments

### Auth & Security
password_reset_tokens, email_verification_tokens, login_audit_log

### HR Operations
compliance_records, engagement_surveys, survey_responses, activity_logs, job_postings, interviews, documents, announcements, notifications, leave_requests, performance_reviews, review_feedback, payroll_records, saved_reports, recognitions, knowledge_articles, attendance_records, onboarding_templates

### Wellness & Engagement
wellness_programs, wellness_enrollments, wellness_metrics, peer_recognitions, anonymous_feedbacks, one_on_one_meetings

### AI & Intelligence
vr_training_modules, vr_training_sessions, digital_twin_scenarios, emotion_analyses, sentiment_analyses, chatbot_conversations, ai_learning_logs, interview_sessions, workforce_forecasts, resignation_risk_assessments, policy_compliance_checks

### Talent & Development
talent_marketplace_projects, talent_marketplace_applications, career_paths, onboarding_buddies, learning_courses, learning_enrollments

### Operations
offer_letter_templates, generated_offers, compliance_reports, shifts, shift_swap_requests

## Authentication & Security
- Session-based auth with Passport.js local strategy
- Passwords hashed with scrypt
- Sessions stored in PostgreSQL via connect-pg-simple
- Account lockout: 5 failed attempts → 30 minute lock
- Login audit logging (success/failure with IP, user agent)
- Password reset flow via email tokens (1 hour expiry)
- Email verification on signup
- Rate limiting: API (500/15min), Auth (20/15min), Password Reset (5/15min)
- CSP headers, CORS, Helmet security
- Default admin: sarah.johnson / Welcome1!

## Multi-Tenancy & Billing
- Organizations table with tenant isolation
- Three pricing tiers: Free ($0, 3 users/10 employees), Pro ($29/mo, 25 users/100 employees), Enterprise ($99/mo, unlimited)
- Feature gating middleware per plan
- Payments via Tap Payments (checkout.tap.company) — POST to https://smarthinkerz.replit.app/api/checkout
- Plan upgrade redirects to Tap checkout, downgrade handled locally
- Tap webhook endpoint for payment confirmation

## Frontend Features
- Collapsible grouped sidebar (Overview, People, Recruitment, Onboarding, Performance, Learning, Engagement, Operations, AI & Intelligence, Communications, System)
- Error boundaries on all protected routes
- Dynamic page titles per route
- Forgot password / reset password flows
- Email verification handling
- Legal pages (Terms, Privacy, DPA)
- Billing & subscription management with Tap Payments
- GDPR Data Privacy page (export, deletion requests, privacy rights)
- Skip-to-content accessibility link
- 48+ pages total

## Testing
- Framework: Vitest (76 tests across 3 test files)
- `tests/schema.test.ts` — Schema definition & insert schema validation (18 tests)
- `tests/auth.test.ts` — Password hashing, session security, validation, CSRF, pagination, feature gating, RBAC, logger (30 tests)
- `tests/api.test.ts` — API health, security headers, auth guards, auth flow, pagination, validation (28 tests)
- Run: `npx vitest run tests/`

## Development Commands
- `npm run dev` — Start dev server (Express + Vite on port 5000)
- `npm run db:push` — Push schema changes to PostgreSQL
- `npm run db:push --force` — Force push with potential data loss

## API Endpoints
- Auth: POST /api/login, /api/register, /api/logout, GET /api/user
- Password: POST /api/forgot-password, /api/reset-password
- Email: POST /api/verify-email, /api/resend-verification
- Health: GET /api/health (status, uptime, version)
- Organizations: GET/POST/PATCH /api/organizations, GET /:id/users, /:id/usage
- Billing: GET /api/billing/plans, /api/billing/current, POST /api/billing/checkout, /api/billing/upgrade, /api/billing/webhook/tap
- GDPR: GET /api/gdpr/export, POST /api/gdpr/delete-request
- Legal: GET /api/legal/terms, /api/legal/privacy, /api/legal/dpa
- All CRUD endpoints support optional pagination via ?page=N&limit=N query params
- Default query function auto-unwraps paginated responses for frontend compatibility
- 290+ API endpoints total across 40+ route modules

## Validation
- All state-changing routes use Zod schema validation via `validateBody` middleware or inline `.parse()`/`.safeParse()`
- Billing checkout/upgrade routes validate plan and cycle parameters
- Self-service leave requests validate type, dates, and reason
- All insert schemas generated from Drizzle with `createInsertSchema` from `drizzle-zod`
