import { useEffect, useState } from 'react'
import { useUser } from './context/UserContext.jsx'

export function UserProfile({
  onUpdate,
  onLogout,
  onLinkCustomer,
  showCustomerId = true,
}) {
  const { user, status, loading, updateProfile, logout, setStripeCustomerId } =
    useUser()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [customerId, setCustomerId] = useState(user?.stripeCustomerId ?? '')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    setCustomerId(user?.stripeCustomerId ?? '')
  }, [user?.email, user?.name, user?.stripeCustomerId])

  const handleSubmit = (event) => {
    event.preventDefault()
    updateProfile({ name, email })
    onUpdate?.({ ...user, name, email })
    setMessage('Profile updated.')
  }

  const handleLinkCustomer = (event) => {
    event.preventDefault()
    setStripeCustomerId(customerId)
    onLinkCustomer?.(customerId)
    setMessage('Stripe customer ID linked.')
  }

  const handleLogout = () => {
    logout()
    onLogout?.()
  }

  return (
    <aside className="gg-pos__profile">
      <header>
        <h2>Operator</h2>
        <p>Status: {loading ? 'Loading…' : status}</p>
      </header>
      <form className="gg-pos__profile-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button type="submit">Save profile</button>
      </form>
      {showCustomerId && (
        <form className="gg-pos__profile-stripe" onSubmit={handleLinkCustomer}>
          <label>
            Stripe customer ID
            <input
              type="text"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            />
          </label>
          <button type="submit">Link customer</button>
        </form>
      )}
      <button type="button" onClick={handleLogout} className="gg-pos__profile-logout">
        Log out
      </button>
      {message && <p className="gg-pos__profile-message">{message}</p>}
    </aside>
  )
}
