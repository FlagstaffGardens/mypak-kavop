export interface KavopTokenResponse {
  status: number;
  message: string;
  success: boolean;
  redirect: null;
  error: string | null;
  response: string | null; // This is the token
}

export async function fetchKavopToken(
  customerName: string
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  try {
    const url = `http://www.mypak.cn:8088/api/kavop/customer/token?customerName=${encodeURIComponent(
      customerName
    )}`;

    const response = await fetch(url);
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
