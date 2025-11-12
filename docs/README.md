# MyPak Connect - Documentation Index

**Complete documentation for MyPak Connect**

This directory contains all technical documentation, guides, and specifications for the MyPak Connect project.

**Last Updated:** November 12, 2024

---

## 📊 Project Status

**Current Phase:** Production with Live ERP Integration ✅

For detailed status, see [PROJECT-STATUS.md](PROJECT-STATUS.md)

---

## 📁 Documentation Structure

```
docs/
├── README.md (this file)           # Documentation index
├── PROJECT-STATUS.md               # Implementation status dashboard
│
├── guides/                         # Developer guides
│   ├── developer-onboarding.md    # ⭐ Start here for new devs
│   └── erp-integration.md         # Complete ERP integration guide
│
├── design/                         # Design system documentation
│   ├── component-system.md        # Component architecture & patterns
│   ├── status-system.md           # Product status calculation logic
│   └── implementation-report.md   # Historical design decisions
│
├── states/                         # UI state designs
│   ├── README.md                  # States overview
│   ├── healthy.md                 # Healthy state design (complete)
│   ├── single-urgent.md           # Single urgent (placeholder)
│   ├── multiple-urgent.md         # Multiple urgent (placeholder)
│   └── mixed.md                   # Mixed state (placeholder)
│
├── backend-planning/               # Technical specifications
│   ├── README.md                  # Backend docs index
│   ├── ERP-API-ENDPOINTS.md       # ⭐ Complete ERP API reference
│   ├── AUTHENTICATION.md          # Auth system design
│   ├── DATABASE-MODELS.md         # Database schema
│   ├── API-SPECIFICATION.md       # Future API specs
│   ├── RECOMMENDATION-ALGORITHM.md # Container recommendation logic
│   ├── ALGORITHM-COMPARISON.md    # Algorithm analysis
│   └── ERP-INTEGRATION-REQUIREMENTS.md # ERP requirements template
│
└── plans/                          # Implementation plans
    └── 2025-11-12-erp-integration.md # ERP integration plan
```

---

## 🚀 Quick Start for Different Roles

### New Developer

**First 30 Minutes:**
1. Read [../CLAUDE.md](../CLAUDE.md) - Most accurate system overview
2. Read [guides/developer-onboarding.md](guides/developer-onboarding.md) - Complete onboarding guide
3. Set up local environment (instructions in onboarding guide)
4. Make your first commit!

**Next Steps:**
- [design/component-system.md](design/component-system.md) - Component patterns
- [design/status-system.md](design/status-system.md) - Business logic
- [guides/erp-integration.md](guides/erp-integration.md) - ERP integration

### Product/Design

**Understanding the System:**
- [design/component-system.md](design/component-system.md) - Component architecture
- [design/status-system.md](design/status-system.md) - Status calculation logic
- [states/healthy.md](states/healthy.md) - Example state design

**Current Status:**
- [PROJECT-STATUS.md](PROJECT-STATUS.md) - What's built, what's planned

### Backend/API Engineer

**Technical Specifications:**
- [backend-planning/ERP-API-ENDPOINTS.md](backend-planning/ERP-API-ENDPOINTS.md) - Complete ERP API docs
- [backend-planning/DATABASE-MODELS.md](backend-planning/DATABASE-MODELS.md) - Database schema
- [backend-planning/AUTHENTICATION.md](backend-planning/AUTHENTICATION.md) - Auth system
- [backend-planning/RECOMMENDATION-ALGORITHM.md](backend-planning/RECOMMENDATION-ALGORITHM.md) - Algorithm spec

**Integration:**
- [guides/erp-integration.md](guides/erp-integration.md) - How ERP integration works

---

## 📚 Documentation by Topic

### Architecture & Patterns

| Document | Description | Status |
|----------|-------------|--------|
| [../CLAUDE.md](../CLAUDE.md) | AI assistant guidance - **Most accurate reference** | ✅ Current |
| [guides/erp-integration.md](guides/erp-integration.md) | Complete ERP integration guide with examples | ✅ Complete |
| [design/component-system.md](design/component-system.md) | Component architecture & adaptive styling | ✅ Complete |
| [design/status-system.md](design/status-system.md) | Product status calculation logic | ✅ Complete |

### Developer Guides

| Document | Description | Status |
|----------|-------------|--------|
| [guides/developer-onboarding.md](guides/developer-onboarding.md) | 30-minute onboarding guide for new devs | ✅ Complete |
| [guides/erp-integration.md](guides/erp-integration.md) | Deep dive into ERP integration | ✅ Complete |
| [../README.md](../README.md) | Project overview & quick start | ✅ Current |

### Technical Specifications

| Document | Description | Status |
|----------|-------------|--------|
| [backend-planning/ERP-API-ENDPOINTS.md](backend-planning/ERP-API-ENDPOINTS.md) | Complete ERP API reference | ✅ Complete |
| [backend-planning/AUTHENTICATION.md](backend-planning/AUTHENTICATION.md) | JWT auth system design | ✅ Complete |
| [backend-planning/DATABASE-MODELS.md](backend-planning/DATABASE-MODELS.md) | PostgreSQL schema (organizations, users) | ✅ Complete |
| [backend-planning/RECOMMENDATION-ALGORITHM.md](backend-planning/RECOMMENDATION-ALGORITHM.md) | Container recommendation algorithm | ✅ Complete |
| [backend-planning/ALGORITHM-COMPARISON.md](backend-planning/ALGORITHM-COMPARISON.md) | Algorithm analysis & comparison | ✅ Complete |
| [backend-planning/API-SPECIFICATION.md](backend-planning/API-SPECIFICATION.md) | Future custom API specs | 📝 Planned |

### Design Documentation

| Document | Description | Status |
|----------|-------------|--------|
| [states/healthy.md](states/healthy.md) | Complete healthy state design | ✅ Complete |
| [states/single-urgent.md](states/single-urgent.md) | Single urgent state design | 📝 Placeholder |
| [states/multiple-urgent.md](states/multiple-urgent.md) | Multiple urgent state design | 📝 Placeholder |
| [states/mixed.md](states/mixed.md) | Mixed state design | 📝 Placeholder |
| [design/implementation-report.md](design/implementation-report.md) | Historical design decisions (Nov 2024) | ♻️ Historical |

---

## 🎯 Common Tasks

### I want to...

| Task | Reference |
|------|-----------|
| **Get started as new developer** | [guides/developer-onboarding.md](guides/developer-onboarding.md) |
| **Understand ERP integration** | [guides/erp-integration.md](guides/erp-integration.md) |
| **Add a new component** | [design/component-system.md](design/component-system.md) |
| **Understand product status logic** | [design/status-system.md](design/status-system.md) |
| **Use an ERP endpoint** | [backend-planning/ERP-API-ENDPOINTS.md](backend-planning/ERP-API-ENDPOINTS.md) |
| **Modify database schema** | [backend-planning/DATABASE-MODELS.md](backend-planning/DATABASE-MODELS.md) |
| **Understand authentication** | [backend-planning/AUTHENTICATION.md](backend-planning/AUTHENTICATION.md) |
| **Check project status** | [PROJECT-STATUS.md](PROJECT-STATUS.md) |

### I'm debugging...

| Issue | Reference |
|-------|-----------|
| **ERP API errors** | [guides/erp-integration.md#troubleshooting](guides/erp-integration.md#troubleshooting) |
| **Authentication issues** | [backend-planning/AUTHENTICATION.md](backend-planning/AUTHENTICATION.md) |
| **Empty token errors** | [guides/erp-integration.md#common-errors](guides/erp-integration.md#common-errors) |
| **Component styling issues** | [design/component-system.md](design/component-system.md) |

---

## ⚠️ Important Notes

### About Mock Data

The system is **in production with live ERP integration**, but these features still use **temporary mock data:**

- **Inventory levels** (`currentStock`, `weeklyConsumption`) - using `src/lib/services/inventory.ts`
- **Container recommendations** - using `src/lib/data/mock-containers.ts`

These will be replaced with real algorithms in Phase 2.

### Most Accurate References

1. **[../CLAUDE.md](../CLAUDE.md)** - Always up-to-date, reflects current production system
2. **[PROJECT-STATUS.md](PROJECT-STATUS.md)** - Current implementation status
3. **[guides/developer-onboarding.md](guides/developer-onboarding.md)** - Comprehensive developer guide

### Archived Documentation

Historical documentation from earlier development phases has been moved to:
- `/archive/docs-old-phases/` - Project status snapshots
- `/archive/guides-dev-mode/` - Removed dev mode features

---

## 📝 Documentation Standards

### When Creating New Docs

**Structure:**
- Clear title and purpose
- Table of contents for docs >200 lines
- Code examples with syntax highlighting
- Cross-references to related docs
- Last updated date at bottom

**Format:**
- Markdown (.md) files
- Use relative links for internal docs
- Include diagrams for complex concepts
- Add "Last Updated" timestamp

**Example:**
```markdown
# Document Title

**Purpose statement**

Last Updated: YYYY-MM-DD

## Table of Contents
[...]

## Section
[...]

---

Last Updated: YYYY-MM-DD
```

### Keeping Docs Up-to-Date

- Update "Last Updated" date when making changes
- Update [PROJECT-STATUS.md](PROJECT-STATUS.md) when completing features
- Update this index when adding new docs
- Archive outdated docs instead of deleting

---

## 🔄 Documentation Workflow

### For New Features

1. **Plan:** Create design doc in `design/` or spec in `backend-planning/`
2. **Implement:** Follow spec exactly
3. **Update:** Mark feature as complete in [PROJECT-STATUS.md](PROJECT-STATUS.md)
4. **Document:** Add code examples to relevant guides

### For Bug Fixes

1. **Document issue** in troubleshooting section
2. **Fix bug**
3. **Update guides** with solution
4. **Add to common issues** if relevant

---

## 📖 External Resources

### Next.js 15

- [Next.js Docs](https://nextjs.org/docs) - Official Next.js documentation
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components) - RSC guide
- [App Router](https://nextjs.org/docs/app) - App Router documentation

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript with React](https://react-typescript-cheatsheet.netlify.app/)

### Tailwind CSS

- [Tailwind Docs](https://tailwindcss.com/docs) - Official Tailwind documentation
- [shadcn/ui](https://ui.shadcn.com/) - Component library we use

### Database

- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Drizzle ORM](https://orm.drizzle.team/) - ORM we use

---

## ❓ Need Help?

### First Steps

1. Check [../CLAUDE.md](../CLAUDE.md) - Most accurate reference
2. Check relevant guide in `guides/`
3. Check spec in `backend-planning/`
4. Check [PROJECT-STATUS.md](PROJECT-STATUS.md) for feature status

### Still Stuck?

- Check troubleshooting sections in guides
- Search codebase for similar patterns
- Ask the team
- Create an issue with specific details

---

## 📌 Quick Reference

**Must-Read Docs:**
- [../CLAUDE.md](../CLAUDE.md) - System overview (most accurate)
- [guides/developer-onboarding.md](guides/developer-onboarding.md) - New developer start
- [backend-planning/ERP-API-ENDPOINTS.md](backend-planning/ERP-API-ENDPOINTS.md) - Complete API reference

**For Development:**
- [design/component-system.md](design/component-system.md) - Component patterns
- [design/status-system.md](design/status-system.md) - Business logic
- [guides/erp-integration.md](guides/erp-integration.md) - ERP integration

**For Planning:**
- [PROJECT-STATUS.md](PROJECT-STATUS.md) - Current status & roadmap
- [backend-planning/RECOMMENDATION-ALGORITHM.md](backend-planning/RECOMMENDATION-ALGORITHM.md) - Algorithm spec

---

**This documentation represents the current production system with live ERP integration.**

For historical context, see `/archive/` directory.

Last Updated: November 12, 2024
