import { getCurrentUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { ErpApiResponse, ErpProduct, ErpOrder } from './types';

const ERP_BASE_URL = 'http://www.mypak.cn:8088/api/kavop';

/**
 * Get organization's kavop_token for the current user
 */
async function getOrgToken(): Promise<string> {
  const user = await getCurrentUser();

  if (!user || !user.orgId) {
    throw new Error('User not authenticated or no organization');
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.org_id, user.orgId));

  if (!org) {
    throw new Error('Organization not found');
  }

  return org.kavop_token;
}

/**
 * Fetch products from ERP API
 */
export async function fetchErpProducts(): Promise<ErpProduct[]> {
  const token = await getOrgToken();

  const response = await fetch(`${ERP_BASE_URL}/product/list`, {
    headers: {
      'Authorization': token,
    },
    cache: 'no-store', // Always fresh data for now
  });

  if (!response.ok) {
    throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
  }

  const data: ErpApiResponse<ErpProduct[]> = await response.json();

  if (!data.success) {
    throw new Error(`ERP API error: ${data.error}`);
  }

  return data.response;
}

/**
 * Fetch current orders (APPROVED + IN_TRANSIT) from ERP API
 */
export async function fetchErpCurrentOrders(): Promise<ErpOrder[]> {
  const token = await getOrgToken();

  const response = await fetch(`${ERP_BASE_URL}/order/current`, {
    headers: {
      'Authorization': token,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
  }

  const data: ErpApiResponse<ErpOrder[]> = await response.json();

  if (!data.success) {
    throw new Error(`ERP API error: ${data.error}`);
  }

  return data.response;
}

/**
 * Fetch completed orders from ERP API
 */
export async function fetchErpCompletedOrders(): Promise<ErpOrder[]> {
  const token = await getOrgToken();

  const response = await fetch(`${ERP_BASE_URL}/order/complete`, {
    headers: {
      'Authorization': token,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
  }

  const data: ErpApiResponse<ErpOrder[]> = await response.json();

  if (!data.success) {
    throw new Error(`ERP API error: ${data.error}`);
  }

  return data.response;
}
