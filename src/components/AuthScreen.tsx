import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Fingerprint, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { sendPasswordReset, signIn, signUp, type FirebaseSession } from "../services/firebaseAuth";
import "./AuthScreen.css";
type Mode = "signin" | "signup" | "reset";
export function AuthScreen({ configured, onAuthenticated }: { configured: boolean; onAuthenticated: (session: FirebaseSession) => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess("");
    if (!configured) { setError("Firebase setup is incomplete. Add your Firebase Web API key to .env.local and restart the app."); return; }
    setBusy(true);
    try {
      if (mode === "reset") { await sendPasswordReset(email); setSuccess("If this email belongs to an account, Firebase will send password-reset instructions."); }
      else { const session = mode === "signup" ? await signUp(email, password) : await signIn(email, password); onAuthenticated(session); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }
  const isReset = mode === "reset";
  return <main className="haven-auth">
    <section className="auth-story">
      <div className="auth-brand"><span className="auth-brand-mark"><ShieldCheck size={22} /></span><span>haven<small>HOME SECURITY</small></span></div>
      <div className="auth-story-content">
        <span className="auth-overline"><span /> CONTEXT-AWARE HOUSEHOLD MONITORING</span>
        <h1>A calmer way to<br /><em>stay aware.</em></h1>
        <p>Audio-first event detection, with visual verification only when a qualifying sound is detected.</p>
        <div className="auth-feature-list">
          <div><span><Fingerprint size={18} /></span><div><strong>Event-triggered verification</strong><small>Face recognition runs only after a qualifying audio event.</small></div></div>
          <div><span><LockKeyhole size={18} /></span><div><strong>Private by design</strong><small>Selected event records and snapshots only—not continuous audio or video.</small></div></div>
        </div>
      </div>
      <div className="auth-story-footer"><span className="auth-pulse" /> THESIS PROTOTYPE <span className="auth-footer-divider">/</span> SECURE HOUSEHOLD ACCESS</div>
    </section>
    <section className="auth-panel-wrap"><div className="auth-panel">
      <div className="auth-mobile-brand"><span className="auth-brand-mark"><ShieldCheck size={20} /></span><strong>haven</strong></div>
      <span className="auth-kicker">{isReset ? "ACCOUNT RECOVERY" : mode === "signup" ? "CREATE YOUR ACCESS" : "WELCOME BACK"}</span>
      <h2>{isReset ? "Reset your password" : mode === "signup" ? "Create your account" : "Sign in to Haven"}</h2>
      <p className="auth-subtitle">{isReset ? "We'll send a password reset link if the email is registered." : mode === "signup" ? "Create a secure account to review household event history." : "Your household events, thoughtfully organized."}</p>
      {!configured && <div className="auth-setup-notice"><strong>Firebase setup required</strong><span>Add <code>VITE_FIREBASE_API_KEY</code> to <code>.env.local</code>, enable Email/Password in Firebase Authentication, then restart the app.</span></div>}
      <form className="auth-form" onSubmit={submit}>
        <label>Email address<span className="auth-input-wrap"><Mail size={17} /><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></span></label>
        {!isReset && <label>Password<span className="auth-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"} value={password} onChange={e => setPassword(e.target.value)} minLength={6} required /><button type="button" className="auth-show-password" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>}
        {mode === "signin" && <button type="button" className="auth-forgot" onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}>Forgot password?</button>}
        {error && <p className="auth-message auth-error" role="alert">{error}</p>}
        {success && <p className="auth-message auth-success" role="status">{success}</p>}
        <button className="auth-submit" type="submit" disabled={busy || !configured}>{busy ? "Please wait…" : isReset ? "Send reset link" : mode === "signup" ? "Create account" : "Sign in"} <ArrowRight size={17} /></button>
      </form>
      <div className="auth-switch">{isReset ? <button onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}>Back to sign in</button> : mode === "signup" ? <>Already have access? <button onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}>Sign in</button></> : <>New to Haven? <button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}>Create an account</button></>}</div>
      <div className="auth-privacy"><Sparkles size={14} /><span>Protected access for authorized household members</span></div>
    </div></section>
  </main>;
}
