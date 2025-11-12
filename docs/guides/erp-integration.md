# ERP Integration Guide

## Overview

MyPak Connect integrates with MyPak ERP API to fetch live product and order data.

## Architecture

**Pattern:** Server Components with Client Islands

```
Server Component (page.tsx)
  ↓ Fetch from ERP API
  ↓ Transform data
  ↓ Pass as props
Client Component (interactive UI)
```

## Data Sources

### Live from ERP
- Products (`/api/kavop/product/list`)
- Current orders (`/api/kavop/order/current`)
- Completed orders (`/api/kavop/order/complete`)

### Temporary Mock Data
- Inventory levels (TODO: implement real inventory tracking)
- Container recommendations (TODO: implement algorithm)

## Authentication

Uses stored `kavop_token` from database:
1. User logs in → JWT cookie with `orgId`
2. Server Component calls ERP client
3. ERP client queries DB for org's `kavop_token`
4. Token sent in `Authorization` header to ERP API

## Error Handling

- Error boundaries catch fetch failures
- Loading states show during data fetch
- User-friendly error messages

## Future Enhancements

1. Implement real inventory tracking
2. Build recommendation algorithm
3. Add caching with Next.js cache API
4. Add revalidation on demand
