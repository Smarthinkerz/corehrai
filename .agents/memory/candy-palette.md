---
name: Candy Color Palette Policy
description: Corporate Refinement spec for CoreHR AI — which colors to replace and which semantic exceptions are allowed.
---

# Candy Color Palette Policy

**Rule:** Replace "candy" accent colors (purple, cyan, pink) with corporate palette equivalents. Use Python bulk-replace for many files at once.

**Why:** The "Corporate Refinement & Smoothness" spec targets professional blue/slate/indigo palette over consumer-grade candy colors.

**Replacements:**
- `purple` → `indigo` (bg-purple-100 → bg-indigo-100, text-purple-600 → text-indigo-600, etc.)
- `cyan` → `sky` (bg-cyan-100 → bg-sky-100, text-cyan-600 → text-sky-600)
- `pink` → `rose` (semantic use only, e.g. recognition/heart icons keep rose)

**Semantic exceptions (keep as-is):**
- `ShiftManagement.tsx`: evening shift uses purple — semantic color coding for shift types
- `PeerRecognition.tsx`: Heart icon with pink/rose — semantic for recognition/appreciation
- `CommandCenter.tsx` and `Copilots.tsx`: gradient accents are intentional mission-control theming
- `AuditLogDashboard.tsx`: LOGIN action type badge stays purple — semantic audit action color coding

**Bulk-replace tool:** Use Python `open(f).read().replace(old, new)` pattern across multiple files simultaneously — sed regex patterns often fail on JSX with attribute ordering.

**How to apply:** After any new page is added, grep for candy and run the Python bulk replace.
