import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { ErpApiResponse, ErpProduct, ErpOrder } from './types';

const ERP_BASE_URL = 'http://www.mypak.cn:8088/api/kavop';

/**
 * Get organization's kavop_token by orgId
 * Note: Accepts orgId directly to avoid calling cookies() inside cached functions.
 */
async function getOrgTokenByOrgId(orgId: string): Promise<string> {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.org_id, orgId));

  if (!org) {
    throw new Error('Organization not found');
  }

  if (!org.kavop_token || org.kavop_token.trim() === '') {
    throw new Error(`Organization "${org.org_name}" has no kavop_token configured. Please contact support to set up your ERP integration.`);
  }

  return org.kavop_token;
}

/**
 * Fetch products from ERP API
 */
export const getCachedErpProducts = unstable_cache(
  async (orgId: string, version: string): Promise<ErpProduct[]> => {
    const token = await getOrgTokenByOrgId(orgId);

    const response = await fetch(`${ERP_BASE_URL}/product/list`, {
      headers: {
        'Authorization': token,
      },
    });

    if (!response.ok) {
      throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
    }

    const data: ErpApiResponse<ErpProduct[]> = await response.json();

    if (!data.success) {
      throw new Error(`ERP API error: ${data.error}`);
    }

    return data.response;
  },
  ['erp:products'],
  { revalidate: 300, tags: ['erp:products'] }
);

/**
 * Fetch current orders (APPROVED + IN_TRANSIT) from ERP API
 */
export const getCachedErpCurrentOrders = unstable_cache(
  async (orgId: string, version: string): Promise<ErpOrder[]> => {
    const token = await getOrgTokenByOrgId(orgId);

    const response = await fetch(`${ERP_BASE_URL}/order/current`, {
      headers: {
        'Authorization': token,
      },
    });

    if (!response.ok) {
      throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
    }

    const data: ErpApiResponse<ErpOrder[]> = await response.json();

    if (!data.success) {
      throw new Error(`ERP API error: ${data.error}`);
    }

    return data.response;
  },
  ['erp:orders:current'],
  { revalidate: 180, tags: ['erp:orders'] }
);

/**
 * Fetch completed orders from ERP API
 */
export const getCachedErpCompletedOrders = unstable_cache(
  async (orgId: string, version: string): Promise<ErpOrder[]> => {
    const token = await getOrgTokenByOrgId(orgId);

    const response = await fetch(`${ERP_BASE_URL}/order/complete`, {
      headers: {
        'Authorization': token,
      },
    });

    if (!response.ok) {
      throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
    }

    const data: ErpApiResponse<ErpOrder[]> = await response.json();

    if (!data.success) {
      throw new Error(`ERP API error: ${data.error}`);
    }

    return data.response;
  },
  ['erp:orders:completed'],
  { revalidate: 600, tags: ['erp:orders'] }
);
