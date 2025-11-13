> **⚠️ ARCHIVED DOCUMENT - OBSOLETE**
>
> **Date Archived:** 2024-11-12
>
> **Reason:** This document describes a dev mode state switcher feature that was **removed from the codebase** when the system transitioned to live ERP integration in November 2024.
>
> **Current System:** MyPak Connect now uses **live data from the MyPak ERP API**. There is no mock data system or state switcher in production.
>
> **For Current Information:** See [docs/guides/erp-integration.md](../../docs/guides/erp-integration.md) and [CLAUDE.md](../../CLAUDE.md)
>
> ---

# State Management & Development Workflow

## Overview

This document explains how we handle multiple UI states during development and how to test different scenarios without needing real data.

## The Problem

When building inventory management features, we need to handle multiple UI states:

- **Healthy**: All products well-stocked, no urgent actions needed
- **Single Urgent**: One container needs ordering soon
- **Multiple Urgent**: Multiple containers need immediate attention
- **Mixed**: Some containers urgent, some on track

During development, we don't have real data, and we need to quickly switch between these states to:
- Verify UI behavior in each scenario
- Test edge cases
- Demo to stakeholders
- Validate design decisions

## Our Approach

We use a **dev-only state switcher** built directly into the sidebar that allows developers to toggle between different mock data scenarios.

### Key Principles

1. **In-Context Testing**: Test states where users will see them (dashboard/orders), not on a separate demo page
2. **Zero Production Impact**: State switcher only appears in development mode
3. **Persistent**: Selected state survives page reloads
4. **Easy to Remove**: When real API is ready, just connect the data - no major refactoring needed

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Sidebar.tsx                       │
│  ┌───────────────────────────────────────────────┐  │
│  │  Dev Tools Panel (NODE_ENV === 'development') │  │
│  │                                                │  │
│  │  State Dropdown:                               │  │
│  │  • 🔴 Production                               │  │
│  │  • ✅ Healthy                                  │  │
│  │  • ⚠️ Single Urgent                           │  │
│  │  • 🚨 Multiple Urgent                         │  │
│  │  • 🔶 Mixed                                    │  │
│  └───────────────────────────────────────────────┘  │
│                        ↓                             │
│              localStorage.setItem('demoState')       │
│              window.location.reload()                │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│              Dashboard/Orders Pages                  │
│                                                      │
│  useEffect(() => {                                   │
│    const state = localStorage.getItem('demoState')  │
│    if (state !== 'production') {                    │
│      setData(SCENARIOS[state])                      │
│    } else {                                          │
│      setData(productionData)                        │
│    }                                                 │
│  }, [])                                              │
└─────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── components/
│   └── shared/
│       └── Sidebar.tsx              # Contains dev tools panel
├── lib/
│   └── data/
│       ├── mock-scenarios.ts        # All demo scenarios
│       ├── mock-products.ts         # Production mock data
│       └── mock-containers.ts       # Production mock data
└── app/
    ├── page.tsx                     # Dashboard - uses demo state
    └── orders/
        ├── page.tsx                 # Orders page
        └── components/
            └── RecommendedContainers.tsx  # Uses demo state
```

## Demo States Explained

### 1. Production (Default)
**Purpose**: Uses the default mock data (will be replaced with real API calls)

**Data**:
- Uses `mockProducts` and `mockContainers` from `src/lib/data/`
- Currently shows mock data, but this is where real API calls will go

**When to use**:
- Default development state
- When testing with "normal" data

### 2. Healthy ✅
**Purpose**: Demonstrates the UI when everything is running smoothly

**Characteristics**:
- All containers have 25+ days until order deadline
- No critical products
- Minimal, unobtrusive UI
- Shows that the system "gets out of the way" when there's nothing urgent

**What to verify**:
- Recommendation card shows green state
- No alarm/urgency visuals
- "All good" messaging is clear
- UI doesn't waste screen space when no action needed

**File**: `healthyScenario` in `src/lib/data/mock-scenarios.ts`

### 3. Single Urgent ⚠️
**Purpose**: One container needs ordering within 3 days

**Characteristics**:
- Container 1: Order by date is 3 days away
- Products are running low (1-2 weeks of stock remaining)
- Amber color scheme
- Generous spacing to draw attention
- Clear call-to-action: "Review Container 1"

**What to verify**:
- Recommendation card has amber left border (4px)
- Order-by date is prominent and bold
- Full details visible (products, cartons, dates)
- CTA button is large and obvious (56px height)
- User can immediately understand the urgency

**File**: `singleUrgentScenario` in `src/lib/data/mock-scenarios.ts`

### 4. Multiple Urgent 🚨
**Purpose**: Multiple containers need ordering (escalated urgency)

**Characteristics**:
- 3 containers with order deadlines: 2, 5, and 7 days away
- Red color scheme (more urgent than single)
- More condensed layout (shows count instead of full details)
- CTA changes to "View All Orders" (guides to orders page)

**What to verify**:
- Red left border (not amber)
- Shows count: "3 Containers Need Ordering"
- Displays earliest deadlines
- CTA guides user to comprehensive view
- Visual hierarchy escalates urgency

**File**: `multipleUrgentScenario` in `src/lib/data/mock-scenarios.ts`

### 5. Mixed 🔶
**Purpose**: Demonstrates prioritization when containers have varied urgency

**Characteristics**:
- 2 urgent containers (3 and 6 days)
- 2 on-track containers (18 and 28 days)
- Shows how system handles mixed scenarios
- Tests sorting and filtering logic

**What to verify**:
- Urgent items displayed first
- Visual distinction between urgent/non-urgent
- User can differentiate priorities at a glance
- Orders page shows proper categorization

**File**: `mixedUrgencyScenario` in `src/lib/data/mock-scenarios.ts`

## Developer Workflow

### Day-to-Day Development

1. **Start dev server**: `npm run dev`
2. **Open app**: Navigate to `localhost:3000`
3. **Open sidebar**: You'll see the "Dev Mode" panel at the bottom
4. **Select a state**: Click the dropdown and choose a scenario
5. **Page reloads**: Automatically applies the new demo data
6. **Iterate**: Make UI changes and see them in different states

### Testing a New Feature

```bash
# Example: Testing the recommendation card redesign

1. Select "Healthy" state
   → Verify minimal UI, no urgency

2. Select "Single Urgent" state
   → Verify amber styling, prominent dates, clear CTA

3. Select "Multiple Urgent" state
   → Verify red styling, condensed layout, count shown

4. Select "Mixed" state
   → Verify prioritization logic

5. Switch back to "Production"
   → Verify default data still works
```

### Adding a New Demo State

1. **Define the scenario** in `src/lib/data/mock-scenarios.ts`:

```typescript
export const newScenario: ContainerRecommendation[] = [
  {
    id: 1,
    containerNumber: 1,
    orderByDate: '...',
    // ... rest of data
  }
];
```

2. **Add to SCENARIOS export**:

```typescript
export const SCENARIOS = {
  // ... existing states
  new_state: {
    containers: newScenario,
    products: [],
  },
};
```

3. **Update Sidebar.tsx** state config:

```typescript
const STATE_CONFIG: Record<DemoState, { label: string; emoji: string; color: string }> = {
  // ... existing states
  new_state: { label: 'New State', emoji: '🎯', color: 'text-blue-700 dark:text-blue-400' },
};
```

4. **Update type definition** in Sidebar.tsx:

```typescript
type DemoState = 'production' | 'healthy' | 'single_urgent' | 'multiple_urgent' | 'mixed' | 'new_state';
```

## Transition to Production

When the real API is ready:

### Option 1: Replace Mock Data (Recommended)

```typescript
// In src/app/page.tsx

useEffect(() => {
  const savedState = localStorage.getItem('demoState') as DemoState;

  if (savedState !== 'production') {
    // Dev mode: use mock data
    setProducts(SCENARIOS[savedState].products);
  } else {
    // Production: fetch from API
    fetchProductsFromAPI().then(setProducts);
  }
}, []);
```

### Option 2: Environment-Based

```typescript
// Check if we're in dev mode
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  // Use demo state system
  const state = localStorage.getItem('demoState');
  setData(SCENARIOS[state]);
} else {
  // Production: use real API
  const data = await fetch('/api/inventory');
  setData(data);
}
```

### Removing Dev Tools Entirely

The dev tools panel in the sidebar automatically hides in production:

```typescript
// In Sidebar.tsx
const [showDevTools, setShowDevTools] = useState(false);

useEffect(() => {
  const isDev = process.env.NODE_ENV === 'development';
  setShowDevTools(isDev);  // Only shows in dev
}, []);
```

To completely remove:
1. Delete the "Dev Tools - State Switcher" section from `src/components/shared/Sidebar.tsx`
2. Remove `src/lib/data/mock-scenarios.ts`
3. Update pages to only use real API calls

## Design Decisions

### Why This Approach?

**✅ Advantages**:
- Test states in actual context (not separate demo page)
- Fast iteration (no page switching)
- Persists across reloads
- Zero impact on production
- Easy to add new states
- Self-documenting (state names are descriptive)

**❌ Alternatives Considered**:

1. **Separate /demo page**:
   - Problem: Context switching is slow, doesn't reflect real UX

2. **URL parameters** (`?state=urgent`):
   - Problem: Easy to accidentally share demo URLs, clutters browser history

3. **Feature flags service** (LaunchDarkly):
   - Problem: Overkill for local dev, adds external dependency

4. **Mock Service Worker (MSW)**:
   - Problem: More complex setup, harder for non-technical stakeholders

### Why localStorage?

- Persists across page reloads
- Isolated to developer's browser
- No server/database needed
- Easy to clear (just change dropdown)
- Works offline

### Why Page Reload on State Change?

Simplicity. We could use React Context or state management, but:
- Page reload ensures clean state
- Prevents subtle bugs from stale state
- Mirrors how real data changes would work (page navigations)
- Simpler mental model for developers

## Common Questions

### Q: Why not use Storybook?

**A**: Storybook is great for component libraries, but we wanted:
- States tested in full-page context
- Easier for non-engineers to test
- No additional build step
- Test interactions between components

We may add Storybook later for component-level testing.

### Q: How do I test with real API data?

**A**:
1. Set state to "Production"
2. Update the data fetching code to call your real API
3. The pages will use that instead of mock data

### Q: Can stakeholders use this?

**A**: Yes! Just:
1. Share the dev URL
2. Tell them to click the sidebar dropdown
3. They can switch states themselves

### Q: Does this work with hot reload?

**A**: Yes! Make code changes and see them immediately in whatever state you've selected.

### Q: What if I forget which state I'm in?

**A**: The sidebar always shows the current state with an emoji indicator.

## Future Enhancements

Potential improvements we might add:

1. **State descriptions**: Hover tooltip explaining what each state demonstrates
2. **Keyboard shortcuts**: `Cmd+1` for healthy, `Cmd+2` for urgent, etc.
3. **State comparison**: Split-screen view of two states
4. **Recording**: Save screenshots of each state for documentation
5. **Admin panel**: Web UI for non-developers to test states in staging

## Related Documentation

- `DESIGN-IMPLEMENTATION-REPORT.md` - Original design decisions and implementation details
- `README.md` - General project setup and development instructions
- `src/lib/types.ts` - TypeScript types for containers and products

## Questions or Issues?

If something isn't clear or you want to add a new state, ask in Slack #engineering or open an issue in GitHub.
