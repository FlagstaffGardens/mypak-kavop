# Order Details Modal - Implementation Plan

**Date:** 2025-11-12
**Feature:** Order Details Modal for Live Orders
**Status:** Ready for Implementation

## Overview

Add a modal dialog to display detailed order information when users click "View Details" on the Live Orders page. The modal will show complete order data including product line items, shipping details, and special instructions.

## User Experience

### Current State
- Orders page shows summary cards with basic info (order number, total products/cartons, dates)
- "View Details" button is disabled
- No way to view detailed product breakdown or special instructions

### Target State
- "View Details" button opens a center modal overlay
- Modal displays all order information in a clean, readable format
- Desktop: Product line items in table format
- Mobile: Product line items in card format
- Modal is read-only (no editing/actions)

## Design

### Visual Layout

**Modal Header:**
- Ship icon + Order number (e.g., "Order #515897")
- Status badge (IN TRANSIT)
- Close button (X)

**Order Summary Section:**
- Products and cartons summary (e.g., "5 products • 90,550 cartons")
- Two-column grid:
  - Column 1: ORDERED date, SHIPPING TERM
  - Column 2: EXPECTED ARRIVAL date, CUSTOMER PO

**Products Section:**
- Section header: "PRODUCTS"
- Desktop: Table with columns (SKU, Product Name, Quantity)
- Mobile: Cards showing same info with labels
- Responsive breakpoint at `sm` (640px)

**Comments Section (conditional):**
- Only shows if `comments` field exists and is non-empty
- Section header: "SPECIAL INSTRUCTIONS"
- Full text display with proper line breaks

### Component Hierarchy

```
OrdersEnRoute.tsx (modified)
  └─> OrderDetailsModal.tsx (new)
        ├─> Dialog (shadcn/ui)
        ├─> DialogHeader
        ├─> DialogContent
        │     ├─> Order Summary
        │     ├─> Products Table/Cards
        │     └─> Comments Section
        └─> DialogFooter (close button)
```

## Technical Implementation

### Task 1: Create OrderDetailsModal Component

**File:** `src/components/orders/OrderDetailsModal.tsx`

**Props Interface:**
```typescript
interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Component Structure:**
- Use shadcn Dialog component for modal
- Accept `Order | null` (null when closed)
- `open` boolean controls visibility
- `onOpenChange` callback for close actions

**Styling:**
- Match existing design system (all-caps labels, clean spacing)
- Use Tailwind responsive classes for desktop/mobile variants
- Desktop table: visible on `sm:` breakpoint and up
- Mobile cards: visible below `sm:` breakpoint

**Data Display:**
- Format dates using existing date formatting
- Format numbers with `toLocaleString()` for cartons
- Handle missing/optional fields gracefully:
  - `eta` might be null, fall back to `requiredEta`
  - `comments` might be empty
  - `customerOrderNumber` might be empty

### Task 2: Update OrdersEnRoute Component

**File:** `src/components/orders/OrdersEnRoute.tsx`

**Changes:**
1. Add state for selected order:
   ```typescript
   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
   ```

2. Update "View Details" button:
   - Remove `disabled` prop
   - Add `onClick` handler: `onClick={() => setSelectedOrder(order)}`

3. Add modal component:
   ```typescript
   <OrderDetailsModal
     order={selectedOrder}
     open={selectedOrder !== null}
     onOpenChange={(open) => !open && setSelectedOrder(null)}
   />
   ```

### Task 3: Verify ERP Data Transformation

**File:** `src/lib/erp/transforms.ts`

**Check:** Ensure `transformErpOrder` includes all required fields:
- ✅ `orderNumber` - mapped
- ✅ `orderedDate` - mapped
- ✅ `eta` / `requiredEta` - mapped to `deliveryDate`
- ✅ `status` - mapped
- ✅ `shippingTerm` - mapped
- ✅ `customerOrderNumber` - mapped
- ✅ `comments` - mapped
- ✅ `lines` - mapped to `products` array with `sku`, `productName`, `qty`

**Action:** No changes needed - all fields already transformed correctly.

### Task 4: Verify ERP Types

**File:** `src/lib/erp/types.ts`

**Check:** Ensure `ErpOrder` interface includes all fields from API:
- ✅ All fields present in interface

**Action:** No changes needed.

## Testing Plan

1. **Data Verification:**
   - Check that all ERP order fields are present in transformed Order
   - Verify optional fields (comments, customerOrderNumber) handled correctly

2. **UI Testing:**
   - Open modal from Live Orders page
   - Verify all data displays correctly
   - Test close button functionality
   - Test clicking outside modal to close
   - Test ESC key to close

3. **Responsive Testing:**
   - Desktop (≥640px): Verify table layout
   - Mobile (<640px): Verify card layout
   - Test various screen sizes

4. **Edge Cases:**
   - Order with no comments
   - Order with empty customerOrderNumber
   - Order with many products (scrolling)
   - Order with long product names
   - Order with null ETA (uses requiredEta)

## Files to Create

1. `src/components/orders/OrderDetailsModal.tsx` - New modal component

## Files to Modify

1. `src/components/orders/OrdersEnRoute.tsx` - Add modal state and integration

## Dependencies

- shadcn/ui Dialog component (already installed)
- lucide-react icons (already installed)
- Existing Order type from `@/lib/types`

## Success Criteria

- [ ] "View Details" button is enabled on Live Orders
- [ ] Clicking button opens modal with correct order data
- [ ] Modal displays all order information clearly
- [ ] Desktop shows table layout for products
- [ ] Mobile shows card layout for products
- [ ] Comments section only appears when comments exist
- [ ] Modal can be closed via X button, outside click, or ESC key
- [ ] Modal styling matches existing design system
- [ ] No console errors or warnings
- [ ] Works with live ERP data

## Future Enhancements (Out of Scope)

- Export order details to PDF
- Email order details
- Edit order information
- Track shipment updates
- Similar modal for Completed Orders tab
