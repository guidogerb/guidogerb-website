import './App.css'

import { Auth, useAuth } from '@guidogerb/components-auth'

function ProtectedContent() {
  const auth = useAuth();
  return (
    <div>
      <h2>Welcome</h2>
      <pre>Email: {auth.user?.profile?.email || '(no email in profile)'} </pre>
    </div>
  );
}

function App() {

  return (
    <>
      {/* Public section (always visible) */}
      <div className="card">
        <p>
          GuidoGerbPublishing Store!
        </p>
      </div>

      {/* Protected section (requires sign-in) */}
      <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 16 }}>
        <h2>Protected Area</h2>
        <Auth autoSignIn logoutUri={import.meta.env.VITE_LOGOUT_URI}>
          <ProtectedContent />
        </Auth>
      </div>

    </>
  )
}

export default App
