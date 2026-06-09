# AI HR Agent — Administrator Guide

This guide explains how administrators operate the AI HR Agent platform: tenant management, role assignment, billing, audit logging, and security best practices.

---

## 1. Tenant (Organization) Management

The platform is fully multi‑tenant. Each company is an **organization** with isolated users, employees, departments, and configuration.

### Creating an Organization
1. Visit `/auth` and switch to the **Register** tab.
2. Fill in your full name, email, password, and (optionally) the new company name.
3. On submission, a new `organizations` row is created and the registering user becomes its first admin.

### Switching Organizations
Users that belong to multiple organizations can switch tenants from the **profile menu** in the top-right of the dashboard. The active organization ID is stored in the session and used by every API request as a tenant filter.

### Inviting Users
1. Sign in as an admin.
2. Navigate to **Settings → Users** (or `/users`).
3. Click **Invite User**, enter email, full name, and choose a role.
4. The new user receives a verification email and must confirm before logging in.

### Suspending or Removing Users
- Set a user's `status` to `inactive` to disable login while preserving history.
- Use **Delete** to permanently remove a user (their owned records reassign to the org admin).

---

## 2. Role-Based Access Control (RBAC)

Roles are enforced server-side via the `requireMinRole(role)` middleware.

| Role | Capabilities |
|---|---|
| **employee** | View own profile, submit leave/expense requests, view announcements, take surveys, complete training |
| **manager** | All employee capabilities + view/approve direct reports' requests, manage team performance reviews, view team analytics |
| **admin** | Full access: manage all users, departments, billing, integrations, security settings, audit logs |

### Assigning Roles
1. **Settings → Users** → click a user.
2. Change the **Role** dropdown.
3. Save. Change is immediate.

### Best Practice
- Keep at least **two admins** per organization to avoid lockout.
- Use **manager** role for team leads instead of granting admin.
- Audit role changes monthly via the audit log.

---

## 3. Billing and Plan Management

The platform integrates with **Tap Payments** at `https://smarthinkerz.replit.app/api/checkout`.

### Plans

| Plan | Max Users | Max Employees | Key Features |
|---|---|---|---|
| **Free** | 5 | 10 | Core HR, basic analytics |
| **Pro** | 50 | 250 | + AI insights, advanced analytics, integrations |
| **Enterprise** | Unlimited | Unlimited | + SSO, custom branding, dedicated support, SLA |

### Subscribing or Upgrading
1. Navigate to **Settings → Billing** (or `/pricing`).
2. Pick a plan and billing cycle (Monthly or Annual — annual gets ~20% discount).
3. Click **Upgrade** → you're redirected to the Tap checkout.
4. After successful payment, the webhook at `/api/billing/webhook/tap` activates the plan immediately.

### Viewing Current Plan
- `GET /api/billing/current` returns the active plan, available features, and resource limits.
- The Settings → Billing UI also surfaces usage vs. limits.

### Downgrading or Cancelling
- Downgrades take effect at the **end of the current billing period**.
- Cancellations preserve data in read‑only mode for 30 days, then archive.

---

## 4. Audit Log Review

Every security-sensitive event is recorded in the `loginAuditLog` table and other event tables.

### What Is Logged
- All login attempts (success / failure / locked out) with IP address and user agent
- Password resets and email verifications
- 2FA enable / disable / verify events
- Role changes
- Plan upgrades / downgrades
- GDPR export and deletion requests

### Reviewing Logs
1. Navigate to **Settings → Security → Audit Log** (admin only).
2. Filter by user, event type, date range, or IP.
3. Export to CSV for compliance reporting.

### Retention
- Audit logs are kept for **two years** by default.
- For longer retention, configure the optional warehouse export integration.

---

## 5. Security Best Practices

### Two-Factor Authentication (2FA)
Strongly recommended for **all admin accounts**.

**To enable for your account:**
1. **Settings → Security → Two-Factor Authentication**.
2. Click **Enable 2FA** — a QR code appears.
3. Scan with Google Authenticator, Authy, or 1Password.
4. Enter the 6-digit code to confirm.

**To require 2FA for all admins** (org-wide):
- **Settings → Security → Policy** → toggle **Require 2FA for admins**.

### Account Lockout
- After **5 failed login attempts**, an account locks for **30 minutes**.
- Admins can manually unlock from **Settings → Users → [user] → Unlock**.
- All lockout events appear in the audit log.

### CSRF Protection
- All state-changing requests (POST/PUT/PATCH/DELETE) require a CSRF token.
- The frontend automatically fetches it from `/api/csrf-token` and attaches it via the `x-csrf-token` header.
- API integrations must call the same endpoint and include the token.

### Password Policy
- Minimum 8 characters, must include uppercase, lowercase, and a number.
- Enforced both client-side (Zod) and server-side.
- Passwords hashed with **scrypt** + per-password 16-byte random salt.

### Session Security
- Sessions stored server-side in PostgreSQL.
- Cookies are `HttpOnly`, `SameSite=Lax`, `Secure` in production.
- Session secret rotates per deployment.

### Data Privacy (GDPR)
- Users can self-serve **data export** at `/data-privacy` → `GET /api/gdpr/export`.
- Users can request **account deletion** at `/data-privacy` → `POST /api/gdpr/delete-request`.
- Admins must approve deletion requests within 30 days.

### Recommended Operational Hygiene
- Review the audit log **weekly**.
- Rotate API keys and integration secrets **quarterly**.
- Run the security scan from **Settings → Security → Scan** before each major release.
- Subscribe to status updates at `status.smarthinkerz.com`.

---

## 6. Common Admin Tasks

| Task | Path |
|---|---|
| Invite a user | Settings → Users → Invite |
| Reset a user's password | Settings → Users → [user] → Send Reset Link |
| Unlock an account | Settings → Users → [user] → Unlock |
| Change a user's role | Settings → Users → [user] → Role dropdown |
| Upgrade plan | Settings → Billing → Upgrade |
| Configure SSO (Enterprise) | Settings → Integrations → SSO |
| Export audit log | Settings → Security → Audit Log → Export CSV |
| Review GDPR requests | Settings → Compliance → Data Requests |
| Configure backup schedule | Settings → System → Backups |

---

## 7. Support and Escalation

- In‑app help: click the **?** icon in the top bar to open the knowledge base.
- Email support: `support@smarthinkerz.com`
- Enterprise customers: dedicated Slack channel and 4-hour SLA.
