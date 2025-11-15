export interface KavopTokenResponse {
  status: number;
  message: string;
  success: boolean;
  redirect: null;
  error: string | null;
  response: string | null; // This is the token
}

/**
 * Fetch Kavop token for a customer from the ERP system
 *
 * ⚠️ SECURITY NOTE: This API uses HTTP (not HTTPS) because the ERP system
 * does not support HTTPS. This means tokens are transmitted in plain text.
 *
 * Mitigation strategies:
 * - Deploy application and ERP on same private network
 * - Use VPN for production traffic
 * - Implement token rotation/expiration
 * - Monitor for suspicious activity
 * - Consider network-level encryption (WireGuard, etc.)
 */
export async function fetchKavopToken(
  customerName: string
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  try {
    // Using HTTP because ERP system doesn't support HTTPS
    const url = `http://www.mypak.cn:8088/api/kavop/customer/token?customerName=${encodeURIComponent(
      customerName
    )}`;

    // Auth key for Kavop API - required for all customer token requests
    const authKey = process.env.KAVOP_API_AUTH_KEY;
    if (!authKey) {
      throw new Error("KAVOP_API_AUTH_KEY environment variable is not set");
    }

    const response = await fetch(url, {
      headers: {
        Authorization: authKey,
      },
    });

    const data: KavopTokenResponse = await response.json();

    if (data.success && data.response) {
      return { success: true, token: data.response };
    } else {
      return { success: false, error: data.error || "Unknown error" };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
