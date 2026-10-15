export interface FirebaseSession {
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}
const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const SESSION_KEY = "haven.firebase.session";
export const firebaseAuthConfigured = Boolean(API_KEY?.trim());
function requireApiKey() {
  if (!API_KEY?.trim()) throw new Error("Firebase Authentication is not configured yet. Add VITE_FIREBASE_API_KEY to .env.local, then restart the development server.");
  return API_KEY.trim();
}
function authError(code?: string) {
  const messages: Record<string, string> = {
    EMAIL_EXISTS: "An account with this email already exists. Try signing in instead.",
    OPERATION_NOT_ALLOWED: "Email and password sign-in is disabled in Firebase. Enable it in Authentication → Sign-in method.",
    TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Please wait a little and try again.",
    EMAIL_NOT_FOUND: "No account was found for that email.",
    INVALID_PASSWORD: "The password is incorrect.",
    INVALID_LOGIN_CREDENTIALS: "The email or password is incorrect.",
    USER_DISABLED: "This account has been disabled.",
    WEAK_PASSWORD: "Choose a stronger password with at least 6 characters.",
    INVALID_EMAIL: "Enter a valid email address.",
    EXPIRED_OOB_CODE: "This password-reset link has expired. Request a new one.",
    INVALID_OOB_CODE: "This password-reset link is invalid or has already been used.",
    NETWORK_REQUEST_FAILED: "Could not reach Firebase. Check your internet connection and try again.",
    API_KEY_INVALID: "The Firebase API key is invalid. Check your Firebase web app configuration.",
  };
  return messages[code ?? ""] ?? "Firebase could not complete that request. Check your Firebase configuration and try again.";
}
async function request<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${encodeURIComponent(requireApiKey())}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(authError(data.error?.message));
  return data;
}
function saveSession(data: { localId: string; email: string; idToken: string; refreshToken: string; expiresIn: string }): FirebaseSession {
  const session: FirebaseSession = { uid: data.localId, email: data.email, idToken: data.idToken, refreshToken: data.refreshToken, expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000 };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}
export async function signIn(email: string, password: string) {
  const result = await request<{ localId: string; email: string; idToken: string; refreshToken: string; expiresIn: string }>("accounts:signInWithPassword", { email: email.trim(), password, returnSecureToken: true });
  return saveSession(result);
}
export async function signUp(email: string, password: string) {
  const result = await request<{ localId: string; email: string; idToken: string; refreshToken: string; expiresIn: string }>("accounts:signUp", { email: email.trim(), password, returnSecureToken: true });
  return saveSession(result);
}
export async function sendPasswordReset(email: string) {
  await request("accounts:sendOobCode", { requestType: "PASSWORD_RESET", email: email.trim() });
}
export async function signOut() { sessionStorage.removeItem(SESSION_KEY); }
export async function getSavedSession(): Promise<FirebaseSession | null> {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as FirebaseSession;
    if (!session.refreshToken || !session.uid || !session.email) { await signOut(); return null; }
    if (session.expiresAt > Date.now() + 60_000) return session;
    const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(requireApiKey())}`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: session.refreshToken }),
    });
    const refreshed = await response.json() as { user_id?: string; id_token?: string; refresh_token?: string; expires_in?: string };
    if (!response.ok || !refreshed.id_token || !refreshed.refresh_token) { await signOut(); return null; }
    const next: FirebaseSession = { ...session, uid: refreshed.user_id ?? session.uid, idToken: refreshed.id_token, refreshToken: refreshed.refresh_token, expiresAt: Date.now() + Number(refreshed.expires_in || 3600) * 1000 };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return next;
  } catch { await signOut(); return null; }
}
