import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Call at the top of any protected /api/admin/* route handler.
 * Returns true if the request carries a valid session cookie.
 * /api/admin/login and /api/admin/logout must NOT call this.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value ?? "";
    if (!token) return false;
    return verifyToken(token);
  } catch {
    return false;
  }
}
