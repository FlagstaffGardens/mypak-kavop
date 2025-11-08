# MyPak - Developer Walkthrough

## What We Built

This is a complete inventory management dashboard for egg carton distribution with a sophisticated state management system for testing different scenarios.

## Quick Tour

### 1. Start the App

```bash
npm run dev
# Opens on localhost:3000
```

### 2. The Interface

**Left Sidebar:**
- Dashboard link
- Orders link
- Dev Mode panel (purple, at bottom - only in development)

**Main Content:**
- Dashboard with product inventory cards
- Recommendation card at top showing order status
- Orders page with containers, tracking, and history

### 3. Testing Different States

At the bottom of the sidebar, you'll see the **Dev Mode** panel.

Click the dropdown and select:

#### 🔴 Production (Default)
- Uses default mock data
- This is where real API calls will go later
- Good for "normal" development

#### ✅ Healthy State
- All products well-stocked
- No urgent actions needed
- Minimal UI - system "gets out of the way"

**What to check:**
- Recommendation card shows green/minimal state
- No critical alerts
- Clean, unobtrusive design

#### ⚠️ Single Urgent
- One container needs ordering in 3 days
- Amber color scheme
- Detailed information displayed
- Large, obvious call-to-action

**What to check:**
- Amber 4px left border on recommendation card
- Order-by date is prominent and bold
- "Review Container 1" button is 56px tall
- Full product details visible

#### 🚨 Multiple Urgent
- 3 containers need ordering (2, 5, 7 days out)
- Red color scheme (escalated urgency)
- More condensed layout
- Shows count instead of full details

**What to check:**
- Red left border (not amber)
- "3 Containers Need Ordering" message
- "View All Orders" CTA guides to /orders page
- Visual hierarchy shows escalation

#### 🔶 Mixed Urgency
- 2 urgent containers (3, 6 days)
- 2 on-track containers (18, 28 days)
- Tests prioritization logic

**What to check:**
- Urgent items shown first
- Clear visual distinction
- Both urgent and non-urgent visible
- Sorting works correctly

## Common Developer Tasks

### Task 1: Verify the Recommendation Card in All States

```bash
# 1. Select "Healthy" from dev tools
#    → Check: Green indicator, minimal layout

# 2. Select "Single Urgent"
#    → Check: Amber border, prominent date, clear CTA

# 3. Select "Multiple Urgent"
#    → Check: Red border, count shown, escalated urgency

# 4. Select "Mixed"
#    → Check: Prioritization works correctly
```

### Task 2: Test the Orders Page

```bash
# 1. Navigate to /orders
# 2. Switch between states in sidebar
# 3. Verify:
#    - Recommended Containers section updates
#    - Urgent containers have amber/red borders
#    - Non-urgent containers are clean
#    - Orders En Route and History sections stay the same
```

### Task 3: Make a UI Change and Test It

```bash
# Example: Change the recommendation card button size

# 1. Open src/components/shared/RecommendationCard.tsx
# 2. Find the button, change h-14 to h-16
# 3. Save (hot reload applies changes)
# 4. Switch between states to see change in each scenario
# 5. Revert or keep based on design decision
```

### Task 4: Add a New State

```bash
# 1. Open src/lib/data/mock-scenarios.ts
# 2. Create new scenario (copy existing one as template)
# 3. Add to SCENARIOS export
# 4. Update src/components/shared/Sidebar.tsx:
#    - Add to DemoState type
#    - Add to STATE_CONFIG object
# 5. Reload, new state appears in dropdown
```

## File Structure (Key Files)

```
mypak-kavop/
├── STATE_MANAGEMENT.md          ← Full documentation (READ THIS)
├── DESIGN-IMPLEMENTATION-REPORT.md  ← Design decisions
├── README.md                     ← Project overview
│
├── src/
│   ├── app/
│   │   ├── page.tsx             ← Dashboard (uses demo state)
│   │   └── orders/
│   │       └── page.tsx         ← Orders page
│   │
│   ├── components/
│   │   ├── shared/
│   │   │   ├── Sidebar.tsx      ← Dev tools panel here
│   │   │   ├── RecommendationCard.tsx  ← Top recommendation
│   │   │   └── ProductCard.tsx  ← Product inventory cards
│   │   │
│   │   └── orders/
│   │       ├── RecommendedContainers.tsx  ← Uses demo state
│   │       ├── OrdersEnRoute.tsx
│   │       └── OrderHistory.tsx
│   │
│   └── lib/
│       ├── data/
│       │   ├── mock-scenarios.ts    ← ALL DEMO STATES HERE
│       │   ├── mock-products.ts
│       │   └── mock-containers.ts
│       │
│       ├── types.ts
│       ├── calculations.ts
│       └── utils.ts
```

## Understanding the Code Flow

### How State Switching Works

```typescript
// 1. User clicks dropdown in Sidebar.tsx
const handleDemoStateChange = (state: DemoState) => {
  setDemoState(state);
  localStorage.setItem('demoState', state);  // Persist
  window.location.reload();                   // Apply
};

// 2. Dashboard/Orders pages load
useEffect(() => {
  const savedState = localStorage.getItem('demoState') || 'production';

  if (savedState !== 'production') {
    // Use demo data
    setProducts(SCENARIOS[savedState].products);
    setContainers(SCENARIOS[savedState].containers);
  } else {
    // Use production data (or fetch from API)
    setProducts(mockProducts);
    setContainers(mockContainers);
  }
}, []);

// 3. UI renders with appropriate data
```

### Where to Add Real API Calls

When you're ready to connect to a real backend:

```typescript
// In src/app/page.tsx

useEffect(() => {
  const savedState = localStorage.getItem('demoState');

  if (savedState !== 'production') {
    // Dev mode: use mock data
    setProducts(SCENARIOS[savedState].products);
  } else {
    // Production: fetch from API
    fetch('/api/inventory/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }
}, []);
```

## Design Principles to Maintain

### 1. Ruthless Simplicity
- Every element must earn its place
- Remove before you add
- One primary action per card

### 2. Information Hierarchy
- Most critical info is largest and boldest
- Use color sparingly (blue CTAs, amber/red urgency, green healthy)
- White space is intentional, not wasteful

### 3. Proportional Response
- Healthy state: minimal UI
- Single urgent: detailed view
- Multiple urgent: condensed, escalated

### 4. Glanceability
- Status understood in < 1 second
- High contrast (no low-contrast grays)
- Large touch targets (56px buttons)

## Testing Checklist

Before committing changes:

```
[ ] Verified in Production state
[ ] Verified in Healthy state
[ ] Verified in Single Urgent state
[ ] Verified in Multiple Urgent state
[ ] Verified in Mixed state
[ ] TypeScript compiles (npm run build)
[ ] No console errors
[ ] Dark mode works (toggle in user menu)
[ ] Sidebar collapse/expand works
```

## Common Questions

### Q: Why does the page reload when I change states?

**A:** Simplicity. It ensures clean state and prevents bugs. Real data changes would also trigger re-renders.

### Q: Can I test without reloading?

**A:** You could use React Context, but page reload is intentional for clean state.

### Q: Where is the dev panel in production?

**A:** It's hidden. Check this line in Sidebar.tsx:
```typescript
const isDev = process.env.NODE_ENV === 'development';
setShowDevTools(isDev);
```

### Q: How do I share a specific state with a stakeholder?

**A:**
1. Set the state in your browser
2. Share the dev URL
3. They can switch states themselves via the dropdown

### Q: Can I add more states?

**A:** Yes! See "Task 4: Add a New State" above or read `STATE_MANAGEMENT.md`

## Next Steps

1. **Read** `STATE_MANAGEMENT.md` for full details
2. **Test** each state to understand the UI behavior
3. **Make changes** and verify them in all states
4. **Add features** and keep testing across states

## Architecture Decisions

### Why localStorage?
- Persists across reloads
- No server needed
- Easy to clear
- Works offline

### Why Not Mock Service Worker (MSW)?
- More complex setup
- Overkill for simple state switching
- Harder for non-technical users

### Why Not Storybook?
- We want full-page context testing
- Easier for stakeholders to test
- No additional build step
- May add Storybook later for component testing

### Why Page Reload?
- Ensures clean state
- Prevents subtle bugs
- Simpler mental model
- Mirrors real data loading

## Debugging Tips

### State not changing?
1. Check browser console for errors
2. Verify localStorage: Open DevTools → Application → Local Storage
3. Should see key `demoState` with value like `'single_urgent'`

### Dev panel not showing?
1. Verify you're in development mode
2. Check: `process.env.NODE_ENV === 'development'`
3. Try restarting dev server

### Data looks wrong?
1. Check src/lib/data/mock-scenarios.ts
2. Verify SCENARIOS export includes your state
3. Console.log the loaded data to debug

## Support

Questions? Check:
1. `STATE_MANAGEMENT.md` - Comprehensive guide
2. `DESIGN-IMPLEMENTATION-REPORT.md` - Design rationale
3. Code comments in components

---

**Ready to go!** Select a state from the dev tools and start exploring.
