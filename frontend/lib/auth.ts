export type AuthProvider = "clerk" | "authjs";

export const authProvider =
  (process.env.NEXT_PUBLIC_AUTH_PROVIDER as AuthProvider | undefined) ?? "clerk";

export async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  // Replace this with Clerk/Auth.js token retrieval.
  return window.localStorage.getItem("resume_builder_token");
}

export async function getAuthHeaders() {
  const token = await getAccessToken();
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`
  };
}
