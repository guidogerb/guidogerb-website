import './App.css'
import Welcome from './website-components/welcome-page/index.jsx'

function App() {
  return (
    <>
      {/* Public section (always visible) */}
      <div className="card">
        <p>GGP-LLC or bust!</p>
      </div>

      <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 16 }}>
        <Welcome />
      </div>
    </>
  )
}

export default App
