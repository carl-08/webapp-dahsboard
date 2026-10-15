import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import { AuthScreen } from "./components/AuthScreen";
import { firebaseAuthConfigured, getSavedSession, signOut, type FirebaseSession } from "./services/firebaseAuth";

export default function App() {
  const [session, setSession] = useState<FirebaseSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    getSavedSession().then((saved) => {
      if (active) setSession(saved);
    }).finally(() => {
      if (active) setCheckingSession(false);
    });
    return () => { active = false; };
  }, []);

  async function handleSignOut() {
    await signOut();
    setSession(null);
  }

  if (checkingSession) {
    return <main className="auth-loading"><span className="auth-loading-mark">H</span><span>Securing your session…</span></main>;
  }
  if (!session) return <AuthScreen configured={firebaseAuthConfigured} onAuthenticated={setSession} />;
  return <Dashboard authenticatedEmail={session.email} onSignOut={handleSignOut} />;
}
