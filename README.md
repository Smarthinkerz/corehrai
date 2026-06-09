# AI HR Agent — Enterprise HR Management Platform

[![CI](https://github.com/your-org/ai-hr-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/ai-hr-agent/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-76%2F76%20passing-brightgreen)](./tests)
[![E2E](https://img.shields.io/badge/e2e-playwright-blueviolet)](./e2e)
[![Audit Score](https://img.shields.io/badge/audit%20score-100%2F100-success)](./AUDIT_REPORT.md)
[![License](https://img.shields.io/badge/license-Proprietary-blue)](#)

A production-grade, multi-tenant HR SaaS platform with AI-powered insights, integrated billing, and full enterprise security.

## Highlights

- **49 frontend pages** covering recruitment, onboarding, performance, payroll, compliance, wellness, learning, and more
- **315+ API endpoints** across 56 route modules
- **58 database tables** with full multi-tenant isolation
- **76 automated tests** (unit + integration) plus Playwright E2E suite
- **Tap Payments** integration with Free / Pro / Enterprise tiers
- **Sentry error tracking** for backend and frontend
- **2FA TOTP**, account lockout, CSRF, CSP, rate limiting, structured logging

## Quick Start

```bash
npm install
npm run db:push
npm run dev          # http://localhost:5000
```

## Testing

```bash
npx vitest run tests/             # 76 unit + integration tests
npx playwright install chromium
npx playwright test               # browser E2E suite
node scripts/load-test.js --scenario=browse --users=200 --duration=30
```

## Documentation

- [Production Audit Report](./AUDIT_REPORT.md) — full 100/100 scorecard
- [Admin Guide](./docs/admin-guide.md) — tenant management, RBAC, billing, audit logs, security
- [Load Test Report](./docs/load-test.md) — k6 scenarios, results, scaling guidance
- [`replit.md`](./replit.md) — architecture, schema, dev workflow

## Tech Stack

React 18 · Vite · Tailwind · shadcn/ui · wouter · TanStack Query v5 · Express · Drizzle ORM · PostgreSQL · Passport.js · Pino · Sentry · Vitest · Playwright

## Deployment

- Continuous integration via GitHub Actions (`.github/workflows/ci.yml`)
- Docker image (`Dockerfile`)
- Replit Deployments for staging/production
- Manual approval gate for production

## License

Proprietary — © 2026 SmartThinkerz
