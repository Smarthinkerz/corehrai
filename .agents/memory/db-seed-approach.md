---
name: DB Seed Approach
description: How to safely run DB operations in this CoreHR project without triggering interactive prompts.
---

# DB Seed Approach

**Rule:** Use `node << 'ENDSCRIPT' ... ENDSCRIPT` heredoc syntax for all database operations. Never use `npm run db:push` interactively (it prompts about vr_platform_configs_platform_unique constraint).

**Why:** `npm run db:push` is interactive and blocks in CI/agent context.

**Pattern:**
```bash
node << 'ENDSCRIPT'
const {Pool}=require('pg');
const p=new Pool({connectionString:process.env.DATABASE_URL});
p.query(`INSERT INTO ... WHERE NOT EXISTS (SELECT 1 FROM ... WHERE ...)`)
  .then(r=>{ console.log('Rows:', r.rowCount); p.end(); })
  .catch(e=>{ console.error('ERROR:', e.message); p.end(); });
ENDSCRIPT
```

**Always use `WHERE NOT EXISTS`** guards to make seeds idempotent.

**Chain multiple seeds** with `.then()` to avoid connection leaks.

**How to apply:** Any time you need to seed data or run schema checks in this project.
