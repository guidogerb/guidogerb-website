import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '../public/vite.svg'
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
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>

      {/* Public section (always visible) */}
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      {/* Protected section (requires sign-in) */}
      <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 16 }}>
        <h2>Protected Area</h2>
        <Auth autoSignIn>
          <ProtectedContent />
        </Auth>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
