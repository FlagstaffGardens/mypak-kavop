# MyPak Development Documentation

**Quick Reference for Developers**

---

## 📁 Documentation Structure

```
docs-dev/
├── README.md                        # You are here
├── repo-status.md                   # Current project status
│
├── guides/                          # How-to guides
│   ├── state-management.md          # State system deep dive
│   └── walkthrough.md               # Quick start guide
│
├── states/                          # UI state designs
│   ├── README.md                    # States overview
│   ├── healthy.md                   # ✅ Complete
│   ├── single-urgent.md             # 🚧 To do
│   ├── multiple-urgent.md           # 🚧 To do
│   └── mixed.md                     # 🚧 To do
│
└── design/                          # Design decisions
    └── implementation-report.md     # Original design report
```

---

## 🚀 Quick Start

1. **First time?** Read the root [README.md](../README.md)
2. **Want a tour?** Read [guides/walkthrough.md](./guides/walkthrough.md)
3. **Understanding states?** Read [guides/state-management.md](./guides/state-management.md)
4. **Working on a state?** Check [states/](./states/)

---

## 📚 Documentation by Purpose

### Getting Started
- [../README.md](../README.md) - Project overview and setup
- [guides/walkthrough.md](./guides/walkthrough.md) - Developer onboarding (15 min)
- [repo-status.md](./repo-status.md) - What's built, what's not

### Understanding the System
- [guides/state-management.md](./guides/state-management.md) - How state switching works
- [design/implementation-report.md](./design/implementation-report.md) - Why we built it this way

### Building Features
- [states/](./states/) - Detailed design for each UI state
- [states/healthy.md](./states/healthy.md) - Example of complete state design

---

## 🎯 Common Tasks

### Testing Different States
1. Start dev server: `npm run dev`
2. Look for purple "Dev Mode" panel in sidebar
3. Select a state from dropdown
4. Page reloads with demo data

**Details:** [guides/state-management.md](./guides/state-management.md)

### Adding a New State
1. Create scenario in `src/lib/data/mock-scenarios.ts`
2. Add to `SCENARIOS` export
3. Update `Sidebar.tsx` with new state
4. Document in `states/[name].md`

**Details:** [guides/state-management.md#adding-a-new-demo-state](./guides/state-management.md)

### Working on UI Components
1. Read the state design doc (e.g., `states/healthy.md`)
2. Implement component changes
3. Test in all relevant states
4. Update documentation if needed

---

## 📖 Documentation Status

### Complete ✅
- Overall system documentation
- State management guide
- Healthy state design
- Developer walkthrough

### In Progress 🚧
- Single urgent state design
- Multiple urgent state design
- Mixed state design

### Planned 📝
- Design system guide
- Component library docs
- API integration guide
- Testing guide

---

## 🗂️ Other Documentation

**Original Product Docs** (in `/docs`):
- Product specs and wireframes
- Original HTML prototype
- Meeting notes

**This folder** (`/docs-dev`):
- Development guides
- State designs
- Implementation decisions

---

## ❓ Questions?

- **How does the state system work?** → [guides/state-management.md](./guides/state-management.md)
- **What's the healthy state design?** → [states/healthy.md](./states/healthy.md)
- **What's built and what's not?** → [repo-status.md](./repo-status.md)
- **Quick tour of the app?** → [guides/walkthrough.md](./guides/walkthrough.md)

---

**Last Updated:** November 8, 2025
