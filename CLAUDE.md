# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Extypis** - French writing workshop platform built with Next.js 15, React 19, and PostgreSQL.

## 🤖 Workflow with Specialized Agents

This project uses a **specialized agent system** (`@AGENTS.md`) for complex tasks. When the user requests a feature or asks a technical question:

1. **Automatically detect** the type of request (feature, bug, architecture question, etc.)
2. **Choose the appropriate agents** (@architecture, @database, @backend, @ui, @editor, @export, etc.)
3. **Orchestrate the workflow** by positioning yourself in each agent context sequentially
4. **Apply the specific rules** of each agent (patterns, validations, documentation)
5. **Ask for validation** between major steps

**The user doesn't need to specify agents** - you intelligently detect and orchestrate.

**Full documentation**: See `@AGENTS.md` for all 13 specialized agents and their workflows.

## Quick Start

```bash
pnpm dev                    # Development server
pnpm build                  # Production build
pnpm test                   # Run tests
npx prisma migrate dev      # Database migrations
```

## Tech Stack

- **Framework**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4 + Design System (`@/design-system`)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: **Better Auth** (!!!) with role hierarchy
- **State**: TanStack Query + Zustand
- **Editor**: Tiptap with custom extensions
- **Monitoring**: Sentry (error tracking, performance monitoring)

## Critical Rules

### 2. Data Flow Pattern

```
Components → TanStack Query hooks → Server Actions → Database
```

- **NEVER** use `useAction` directly in components
- **ALWAYS** use hooks from `src/lib/queries/`
- **OPTIMISTIC UPDATES**: Use TanStack Query optimistic updates (see below)

### 2.1. Optimistic Updates Pattern

**✅ ALWAYS use TanStack Query optimistic updates** for instant UX:

```typescript
// ✅ CORRECT - Use our optimistic helpers
import {
  prepareListOptimisticUpdate,
  applyListOptimisticUpdate,
  rollbackOptimisticUpdate,
  OptimisticPatterns,
} from "@/lib/queries/utils/optimistic-helpers";

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItemAction,
    onMutate: async (variables) => {
      const context = await prepareListOptimisticUpdate({
        queryClient,
        queryKey: ["items"],
      });

      applyListOptimisticUpdate({
        queryClient,
        queryKey: ["items"],
        updateFn: OptimisticPatterns.addToList(newItem),
      });

      return context;
    },
    onError: (_, __, context) => {
      rollbackOptimisticUpdate(queryClient, context);
    },
  });
}

// ❌ NEVER use React's useOptimistic for global state
import { useOptimistic } from "react"; // ❌
```

**Patterns Available:**

- `OptimisticPatterns.addToList(item)` - Add to list
- `OptimisticPatterns.removeFromList(id)` - Remove from list
- `OptimisticPatterns.updateInList(id, updates)` - Update in list
- `OptimisticPatterns.updateItem(updates)` - Update single item
- `OptimisticPatterns.reorderList(orderedIds)` - Reorder list

**Documentation**: `@documentation/05-techniques/optimistic-updates-tanstack.md`

### 3. Schema Evolution

When modifying Prisma schema:

1. Update types in `src/lib/types/` (with relations)
2. Update server actions in `src/lib/actions/`
3. Update TanStack Query hooks in `src/lib/queries/`

### 4. TypeScript Rules

- **NO** `any` types allowed
- Use `_` prefix for unused parameters
- All types defined in `src/lib/types/`

### 5. LocalStorage Pattern

```typescript
// ❌ NEVER
localStorage.setItem("key", value);

// ✅ ALWAYS
import { useProjectPreferences } from "@/hooks/use-preferences";
const { updatePreferences } = useProjectPreferences(projectId);
```

## Key Features

### Editor System

- **Tiptap Extensions**: Citations, footnotes, text notes
- **Undo/Redo**: LocalStorage-based with DB sync
- **SPA Architecture**: 0 server requests on navigation

### Error Handling

```typescript
mutation.mutate(data, {
  onSuccess: () => resetErrorState(),
  onError: (error) => {
    setErrorMessage(error?.message || "Erreur de connexion");
    toast.error("Description de l'erreur");
  },
});
```

### 6. Database Safety Rules - CRITICAL ⚠️

**🚨 NEVER TOUCH THE DATABASE SCHEMA WITHOUT EXPLICIT USER PERMISSION**

```typescript
// ❌ NEVER do these operations without explicit user request:
- prisma db push (bypasses migrations)
- prisma migrate reset (destroys all data)
- prisma migrate resolve (marks migrations as applied)
- Direct SQL execution on production databases
- Schema modifications without migrations
```

**✅ SAFE Database Operations:**

- `prisma migrate dev` (local development only)
- `prisma migrate deploy` (production, with user approval)
- `prisma generate` (always safe)
- `prisma migrate status` (read-only, always safe)
- `npx tsc --noEmit` (no database interaction)

**🛡️ Database Protection Protocol:**

1. **ALWAYS** ask user permission before any schema changes
2. **ALWAYS** create backups before destructive operations
3. **NEVER** run `prisma db push` on production (Supabase)
4. **NEVER** modify `_prisma_migrations` table without user consent
5. **ALWAYS** use proper migration workflow: `prisma migrate dev` → test → deploy

**Environment Protection:**

- **Local (`DATABASE_URL` with localhost)**: Relatively safe for experiments
- **Supabase/Production**: REQUIRES explicit user permission for ANY schema change
- **When in doubt**: Ask the user before executing any database command

### 7. Monitoring et Logging avec Sentry

**✅ ALWAYS use logger for error tracking** instead of console.log:

```typescript
// ✅ CORRECT - Use our logger system
import { logger } from "@/lib/utils/logger";

// Error logging with context
logger.error("Description claire de l'erreur", error, {
  component: "ComponentName",
  action: "user_action",
  context: { userId, projectId },
});

// Info logging for business events
logger.info("Événement métier important", {
  event: "user_signup",
  plan: "premium",
});

// Critical errors (payment, auth, data loss)
logger.criticalError("Erreur critique système", error, {
  severity: "high",
  impact: "user_data",
});

// ❌ NEVER use console.log in production components
console.log("Debug info"); // ❌ Disparaît en production
console.error("Error"); // ❌ Pas de contexte ni de monitoring
```

**Error Monitoring Rules:**

- **Critical errors** → `logger.criticalError()` (paiement, auth, perte de données)
- **User errors** → `logger.error()` avec contexte (composant, action)
- **Business events** → `logger.info()` (inscriptions, conversions)
- **Development only** → Keep `console.log` in scripts and dev tools

### 8. Premium Features Workflow

**Pour ajouter/modifier une feature premium :**

1. **Définir la feature** dans `src/lib/constants/premium-features.ts` :
   ```typescript
   // Ajouter à PremiumFeatureId
   export type PremiumFeatureId = ... | "ma_nouvelle_feature";

   // Ajouter la configuration
   ma_nouvelle_feature: {
     id: "ma_nouvelle_feature",
     name: "Nom affiché",
     description: "Description pour l'utilisateur",
     enabled: true, // true = premium requis, false = gratuit
   },
   ```

2. **Vérification côté client** (composants React) :
   ```typescript
   import { usePremium } from "@/hooks/use-premium";

   const { requirePremium } = usePremium();

   const handleAction = () => {
     if (!requirePremium("ma_nouvelle_feature")) {
       return; // Affiche automatiquement la modal premium
     }
     // Action premium...
   };
   ```

3. **Vérification côté serveur** :

   **Option A - Server Actions (recommandé)** : Utiliser `premiumActionClient`
   ```typescript
   import { premiumActionClient } from "@/lib/safe-action";

   export const maFeaturePremium = premiumActionClient
     .schema(monSchema)
     .action(async ({ ctx, parsedInput }) => {
       // ctx.session disponible, premium vérifié automatiquement
       // ...
     });
   ```

   **Option B - API Routes** : Utiliser `requirePremiumAccess`
   ```typescript
   import { requirePremiumAccess } from "@/lib/premium-server-check";

   // Dans l'API route
   try {
     await requirePremiumAccess(userId);
   } catch (_error) {
     return NextResponse.json({ error: "Premium requis" }, { status: 403 });
   }
   ```

**Règles :**
- `enabled: true` → Feature bloquée pour les non-premium
- `enabled: false` → Feature accessible à tous (gratuite ou pas encore implémentée)
- Toujours vérifier **client ET serveur** pour les features critiques
- Préférer `premiumActionClient` pour les Server Actions (plus propre)

## Directory Structure

**⚠️ IMPORTANT: Next.js 16 App Router Architecture**

```
app/                     # 🌐 PAGES & ROUTES (Next.js App Router)
├── (app-layout)/        # Layout groups
│   └── write/           # Protected routes
├── api/                 # API routes
├── dashboard/           # Dashboard pages
├── admin/               # Admin pages
├── auth/                # Auth routes
└── page.tsx             # Homepage

src/                     # 🏗️ APPLICATION CODE
├── components/
│   ├── editor/          # Editor components by feature
│   ├── dashboard/       # Dashboard components
│   └── providers/       # Context providers
├── design-system/       # UI components & patterns
├── lib/
│   ├── actions/         # Server actions
│   ├── queries/         # TanStack Query hooks
│   ├── types/           # TypeScript definitions
│   ├── editor/          # Tiptap extensions
│   └── storage/         # Preferences management
└── hooks/               # Custom React hooks
```

**🚨 CRITICAL RULE: Routes vs Components**

- **Pages/Routes** → `app/` directory (Next.js App Router)
- **Components/Logic** → `src/` directory
- **NEVER** create pages in `src/app/` ❌
- **ALWAYS** create pages in `app/` ✅

```env
DATABASE_URL="postgresql://..."
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

## 🤖 Agent System - CRITICAL

**⚠️ ALWAYS use the specialized agent system for complex tasks**

When the user requests a feature, bug fix, or architectural decision:

1. **READ** `@AGENTS.md` to understand available agents
2. **ANALYZE** the request to determine which agents are needed
3. **ORCHESTRATE** the workflow automatically by positioning yourself in each agent context
4. **VALIDATE** with the user between major steps

### Auto-Detection Patterns

- **Feature complète** → @architecture → @database → @backend → @ui → @tests
- **Bug fix simple** → Direct fix (or @ui/@backend as needed)
- **Question architecture** → @architecture analysis
- **Export/Documents** → @export + @backend
- **Editor extension** → @editor + @backend (if persistence)
- **Citations/References** → @bibliography + @backend

**The user does NOT need to specify agents** - you detect and orchestrate automatically.

**Documentation**: See `@AGENTS.md` for complete agent descriptions and workflows.

## Quick Reference

- **Agent System**: `@AGENTS.md` (specialized contexts for features)
- **UX Guidelines**: `@UX_UI.md`
- **SPA Architecture**: `ARCHITECTURE_SPA.md`
- **Sentry Test Tools**: `/dev-tools` (development only)

# Git Workflow & Branches

## Branch Structure

Extypis uses **GitFlow** workflow with the following branches:

### Main Branches

- **`main`** 🏭 **Production Branch**
  - **Purpose**: Stable, production-ready code only
  - **Deployment**: Automatic deployment to https://extypis.app via GitHub Actions
  - **Protection**: Protected branch - no direct push, Pull Requests only
  - **CI/CD**: Full pipeline (tests + deployment + notifications)

- **`develop`** 🧪 **Development Branch**
  - **Purpose**: Active development and testing
  - **Deployment**: No automatic deployment (tests only)
  - **Usage**: Daily development work, feature integration
  - **CI/CD**: Tests only (lint, build, typecheck)

### Hotfixes (Emergency)

```bash
# Critical fixes directly to production
git checkout -b hotfix/critical-bug main
# ... fix critical issue ...
git push origin hotfix/critical-bug
# Create PR: hotfix/critical-bug → main (immediate)
# Also merge back to develop to keep sync
```

## GitHub Actions Behavior

### On `develop` push:

- ✅ Run tests (lint, build, typecheck)
- ❌ NO deployment
- ❌ NO notifications

### On `main` push:

- ✅ Run tests (complete pipeline)
- ✅ Deploy to VPS (production)
- ✅ Health checks and notifications

### Branch Protection Rules

Recommended GitHub settings for `main`:

- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- No force pushes
- No deletions

## Quick Commands

```bash
# Switch to development
git checkout develop

# Create new feature
git checkout -b feature/my-feature develop

# Emergency production fix
git checkout -b hotfix/urgent-fix main

# Check current branch
git branch --show-current

# View workflow status
gh run list  # requires GitHub CLI
```

## Documentation References

- **Complete Workflow Guide**: `/WORKFLOW.md`
- **Feature Documentation**: Update `@documentation/04-business/features-completes.md`
- **TODOs Management**: Update `@documentation/08-archives/todo-list.md`

---

# Important Notes

- Don't `pnpm build`, **SAUF si tu t'apprêtes à faire un commit**, prefere `npx tsc --noEmit` to check types le reste du temps.

## 🚨 DATABASE SAFETY REMINDER

**BEFORE ANY DATABASE OPERATION, REMEMBER:**

- Local database (`localhost:5432/ae`) = Experimentation allowed
- Supabase database (`*.supabase.co`) = PRODUCTION - ASK PERMISSION FIRST
- **NEVER** run destructive commands without user explicit consent
- **ALWAYS** verify which database you're targeting before execution
- When unsure about a database operation's safety: **ASK THE USER FIRST**

---

_Last updated: GitFlow workflow implementation with branch protection and automated deployment_

- À chaque fois que tu élabores une todo et qu'elle est acceptée, tu dois systématiquement la mettre dans @documentation/08-archives/todo-list.md et la mettre à jour selon l'avancement de la toto.
- Tu dois toujours concevoir les nouvelles features en tenant compte de la scalabilité !

## Branch-Specific Guidelines

### Working on `develop`:

- ✅ Experiment freely - no risk to production
- ✅ Push commits regularly for backup
- ✅ Test new features and ideas
- ✅ Integration testing before production

### Working on `main`:

- ⚠️ Only through Pull Requests from `develop`
- ⚠️ Requires review and validation
- ⚠️ Triggers automatic deployment
- ⚠️ Must be production-ready code only

### Feature Branches:

- 🌱 One feature per branch
- 🌱 Descriptive names (feature/languagetool-integration)
- 🌱 Regular pushes to backup work
- 🌱 PR back to `develop` when complete
- Ne supprime JAMAIS de branche github, sous aucun prétexte !

### Password Mac (pour terminal)

`Raveg64`

ENfin, ne te met JAMAIS sur le serveur de développement pour voir les logs, demandes les moi.
