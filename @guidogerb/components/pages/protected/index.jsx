import { Auth, useAuth } from '@guidogerb/components-auth'

function EmailLine() {
    const auth = useAuth();
    return (
        <div>
            <pre>Email: {auth?.user?.profile?.email || '(not logged in)'} </pre>
        </div>
    );
}
export default function Protected({ children, logoutUri }) {
  return (
    <Auth autoSignIn logoutUri={logoutUri}>
      <EmailLine />
      {children}
    </Auth>
  );
}
