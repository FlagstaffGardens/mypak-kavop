# Decimal Pallet Input Support

**Date:** 2025-11-13
**Status:** Implemented

## Overview

Enable users to input decimal values (up to 1 decimal place) for Current Stock and Weekly Consumption pallet quantities in the inventory update modal. This allows for more precise inventory tracking when partial pallets are in stock or consumed.

## Requirements

- **Current Stock (Pallets):** Accept decimal input up to 1 decimal place (e.g., 63.5)
- **Weekly Consumption (Pallets):** Accept decimal input up to 1 decimal place (e.g., 10.7)
- **Target SOH (Weeks):** Keep as whole numbers only (no decimals)

## Implementation

### 1. EditableNumberCell Component

**Location:** `src/components/shared/EditableNumberCell.tsx`

**Changes:**
- Added `allowDecimals?: boolean` prop (default: false)
- Added `maxDecimals?: number` prop (default: 1)
- Enhanced `handleChange` to support decimal input validation:
  - When `allowDecimals={false}`: Only digits and commas allowed (whole numbers)
  - When `allowDecimals={true}`: Digits and one decimal point allowed
  - Enforces maximum decimal places (default 1)
  - Strips leading zeros automatically (e.g., "01.5" → "1.5")
- Updated `displayValue` logic:
  - Decimal mode: Show raw decimal value (e.g., "63.5")
  - Whole number mode: Show with comma separators (e.g., "1,234")
- Updated `handleBlur` to validate and revert invalid inputs

### 2. InventoryEditTable Component

**Location:** `src/components/shared/InventoryEditTable.tsx`

**Changes:**
- Added `allowDecimals={true}` and `maxDecimals={1}` to Current Stock input field
- Added `allowDecimals={true}` and `maxDecimals={1}` to Weekly Consumption input field
- Target SOH field unchanged (no props = defaults to whole numbers only)

**Conversion Logic:**
The existing conversion from pallets to cartons already handles decimals correctly:
```typescript
const cartons = Math.round(value * p.piecesPerPallet);
// Example: 63.5 pallets × 5,760 cartons/pallet = 365,760 cartons
```

## User Experience

### Input Behavior

**Decimal Fields (Current Stock, Weekly Consumption):**
- User can type decimal values: `63.5`, `10.7`, `0.3`
- Only one decimal point allowed
- Maximum 1 decimal place enforced
- Leading zeros stripped automatically: `01.5` → `1.5`
- Invalid input reverts to previous value on blur

**Whole Number Field (Target SOH):**
- User can only type whole numbers: `6`, `12`, `18`
- No decimal point allowed
- Commas added for large numbers: `1234` → `1,234`

### Display Format

**Focused (editing):**
- Raw value shown: `63.5`, `10.7`

**Unfocused (display):**
- Decimal fields: `63.5` (no comma separators)
- Whole number fields: `1,234` (with comma separators)

**Carton Conversion:**
- Always shown below input field
- Example: "pallets = 365,760 cartons (5,760/pallet)"

## Technical Notes

- **Backend Storage:** Values stored as cartons (integers) in database
- **Frontend Calculation:** Pallets converted to cartons via `Math.round(pallets × piecesPerPallet)`
- **Precision:** 1 decimal place provides sufficient precision without introducing floating-point complexity
- **Validation:** All existing validation rules (warnings, errors) continue to work with decimal values

## Testing

✅ TypeScript compilation passes
✅ Production build succeeds
- Manual testing recommended: Test decimal input in inventory update modal
- Test cases:
  - Enter `63.5` in Current Stock → Should display "365,760 cartons"
  - Enter `10.7` in Weekly Consumption → Should calculate correctly
  - Enter `6.5` in Target SOH → Should reject decimals, only accept `6`
  - Enter `01.5` → Should auto-correct to `1.5`
  - Enter `1.23` → Should limit to `1.2`
  - Enter invalid text → Should revert to previous value

## Future Enhancements

- Consider increasing precision to 2 decimal places if needed
- Add visual indicator showing decimal input is supported
- Add keyboard shortcuts for common decimal values (e.g., `.5` shortcut)
