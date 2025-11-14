import { unstable_cache } from 'next/cache';
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
  console.log('🔍 [ERP Client] Current user:', user ? { userId: user.userId, orgId: user.orgId, email: user.email } : 'null');

  if (!user || !user.orgId) {
    throw new Error('User not authenticated or no organization');
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.org_id, user.orgId));

  console.log('🔍 [ERP Client] Organization found:', org ? { org_id: org.org_id, org_name: org.org_name, has_token: !!org.kavop_token, token_length: org.kavop_token?.length || 0 } : 'null');

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
export async function fetchErpProducts(): Promise<ErpProduct[]> {
  const user = await getCurrentUser();
  if (!user?.orgId) throw new Error('Not authenticated');

  return unstable_cache(
    async (orgId: string) => {
      const token = await getOrgToken();

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
    { revalidate: 300, tags: ['erp-products'] }
  )(user.orgId);
}

/**
 * Fetch current orders (APPROVED + IN_TRANSIT) from ERP API
 */
export async function fetchErpCurrentOrders(): Promise<ErpOrder[]> {
  const user = await getCurrentUser();
  if (!user?.orgId) throw new Error('Not authenticated');

  return unstable_cache(
    async (orgId: string) => {
      const token = await getOrgToken();

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
    { revalidate: 180, tags: ['erp-orders'] }
  )(user.orgId);
}

/**
 * Fetch completed orders from ERP API
 */
export async function fetchErpCompletedOrders(): Promise<ErpOrder[]> {
  const user = await getCurrentUser();
  if (!user?.orgId) throw new Error('Not authenticated');

  return unstable_cache(
    async (orgId: string) => {
      const token = await getOrgToken();

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
    { revalidate: 600, tags: ['erp-orders'] }
  )(user.orgId);
}
