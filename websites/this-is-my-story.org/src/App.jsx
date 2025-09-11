import './App.css'
import Protected from '@guidogerb/components-pages-protected'
import Welcome from './website-components/welcome-page/index.jsx'

function App() {
  return (
    <>
      {/* Public section (always visible) */}
      <div className="card">
        <p>ThisIsMyStory or bust!</p>
      </div>

      <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 16 }}>
        {/* Protected section (requires sign-in) */}
        <Protected logoutUri={import.meta.env.VITE_LOGOUT_URI}>
          <Welcome />
        </Protected>
      </div>
    </>
  )
}

export default App
