import { Auth, useAuth } from '@guidogerb/components-auth'

function Guard({ children }) {
  const auth = useAuth()
  if (auth?.error) return <div>Sign-in failed: {auth.error.message}</div>
  if (!auth?.isAuthenticated) return <div>Protected Loading...</div>
  return <>{children}</>
}

export default function Protected({ children, logoutUri }) {
  return (
    <Auth autoSignIn logoutUri={logoutUri}>
      <Guard>{children}</Guard>
    </Auth>
  )
}
