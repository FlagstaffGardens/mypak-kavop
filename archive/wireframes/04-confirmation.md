# Order Confirmation

**Entry point:** User clicks "APPROVE ORDER" on Container Review screen → Lands here

---

## Navigation

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Review                                           │
│                                    Valley Park Farms • Ian   │
└─────────────────────────────────────────────────────────────┘
```

---

## Page Structure

```
CONFIRM ORDER

[ORDER SUMMARY]

[CONFIRM & SUBMIT BUTTON]
```

---

## Order Summary

```
┌─────────────────────────────────────────────────────────────┐
│  CONFIRM YOUR ORDER                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Container 1                                                │
│                                                             │
│  Order by: Nov 12, 2025                                     │
│  Expected Delivery: Dec 27, 2025                            │
│  Shipping Term: DDP - Delivered Duty Paid                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PRODUCTS (3)                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Woolworths Cage Free 700g                   33,000 cartons │
│  FYFE Family 800g Free Range                 35,000 cartons │
│  Coles Free Range 800g                       23,000 cartons │
│  ───────────────────────────────────────────────────────── │
│  Total:                                      91,000 cartons │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ADDITIONAL DETAILS                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Customer Order Number: PO-2024-NOV-EGGS                    │
│  Comments: Please ensure delivery before Christmas rush     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ✉️  A confirmation email will be sent to:                  │
│  ian@valleyparkfarms.com                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Action Buttons

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃                                                       ┃  │
│  ┃  CONFIRM & SUBMIT ORDER                              ┃  │
│  ┃                                                       ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                             │
│  [ ← Go Back & Edit ]                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Success State (after submission)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ✓                                        │
│                                                             │
│              ORDER SUBMITTED                                │
│                                                             │
│  Order #MP-2024-1923 has been sent to MyPak                 │
│  Confirmation email sent to ian@valleyparkfarms.com         │
│                                                             │
│  Expected Delivery: Dec 27, 2025                            │
│                                                             │
│  [ View Order Details ]   [ Back to Dashboard ]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Interactions

**Review summary:**
- User can see complete order details before final submission
- Shows products, quantities, shipping details, order number, comments
- Email address displayed where confirmation will be sent

**Go back:**
- Click "← Go Back & Edit" → Returns to Container Review screen
- All entered data preserved (quantities, shipping details, etc.)

**Submit order:**
- Click "CONFIRM & SUBMIT ORDER" → Order submitted to MyPak system
- Success screen appears with order number
- Email sent to user's registered email address
- Order appears in "Orders En Route" section

**After success:**
- Click "View Order Details" → Navigate to Order Details screen (shows full order info)
- Click "Back to Dashboard" → Navigate to Dashboard
  - Container 1 recommendation disappears
  - Product charts update with approved order spikes
  - Container 2 recommendation appears (if urgent)

---

## Email Notification

**Subject:** Order Confirmation - Container 1 (#MP-2024-1923)

**Body:**
```
Hi Ian,

Your order has been confirmed!

Order #: MP-2024-1923
Order Date: Nov 7, 2025
Expected Delivery: Dec 27, 2025

Products:
• Woolworths Cage Free 700g - 33,000 cartons
• FYFE Family 800g Free Range - 35,000 cartons
• Coles Free Range 800g - 23,000 cartons

Total: 91,000 cartons

Shipping Term: DDP - Delivered Duty Paid
Your PO Number: PO-2024-NOV-EGGS

View order details: [Link to Orders tab]

Questions? Contact your MyPak representative.

Thanks,
MyPak Team
```

---

*Status: Draft - needs review*
