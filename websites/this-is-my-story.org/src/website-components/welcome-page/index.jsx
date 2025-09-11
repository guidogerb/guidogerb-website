import { useEffect } from 'react'
import { useAuth } from '@guidogerb/components-auth'

export default function Welcome({ children }) {
  const auth = useAuth()

  useEffect(() => {
    console.debug('auth', auth)
  }, [auth])

  if (auth?.error) return <div>Sign-in failed: {auth.error.message}</div>
  if (!auth?.isAuthenticated) return <div>Welcome Loading...</div>

  const name =
    auth?.user?.profile?.['cognito:username'] ?? auth?.user?.profile?.name ?? 'userNotAvailable'

  return (
    <div>
      <h3>Welcome {name}</h3>
      {children}
    </div>
  )
}
