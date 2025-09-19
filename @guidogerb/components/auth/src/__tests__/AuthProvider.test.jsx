import React from 'react'
import { render, screen } from '@testing-library/react'

const providerPropsLog = vi.hoisted(() => [])

vi.mock('react-oidc-context', () => ({
  AuthProvider: ({ children, ...props }) => {
    providerPropsLog.push(props)
    return <div data-testid="oidc-provider">{children}</div>
  },
}))

vi.mock('../LoginCallback.jsx', () => ({
  default: () => <div data-testid="login-callback" />,
}))

import AuthProvider from '../AuthProvider.jsx'
import { restoreLocation, setMockLocation } from './testUtils.js'

describe('AuthProvider', () => {
  let consoleErrorSpy
  let consoleLogSpy

  beforeEach(() => {
    providerPropsLog.length = 0
    vi.unstubAllEnvs()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    setMockLocation('http://localhost/')
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
    vi.unstubAllEnvs()
  })

  afterAll(() => {
    restoreLocation()
  })

  it('renders a helpful error block when required OIDC settings are missing', () => {
    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>,
    )

    expect(screen.getByText(/missing required oidc settings/i)).toBeInTheDocument()
    expect(screen.getByText(/authority or metadataUrl/i)).toBeInTheDocument()
    expect(providerPropsLog).toHaveLength(0)
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('merges props and environment defaults before delegating to the OIDC provider', () => {
    vi.stubEnv('VITE_COGNITO_AUTHORITY', 'https://env-authority.example')
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'env-client')
    vi.stubEnv('VITE_COGNITO_SCOPE', 'openid email')
    vi.stubEnv('VITE_RESPONSE_TYPE', 'token')
    vi.stubEnv('VITE_COGNITO_POST_LOGOUT_REDIRECT_URI', 'https://env.example/logout')
    vi.stubEnv('VITE_REDIRECT_URI', 'https://env.example/callback')

    render(
      <AuthProvider
        authority="https://prop-authority.example"
        client_id="prop-client"
        scope="openid profile"
        loginCallbackPath="/custom-callback"
      >
        <div>child</div>
      </AuthProvider>,
    )

    expect(providerPropsLog).toHaveLength(1)
    expect(providerPropsLog[0]).toMatchObject({
      authority: 'https://prop-authority.example',
      client_id: 'prop-client',
      redirect_uri: 'https://env.example/callback',
      response_type: 'token',
      scope: 'openid profile',
      post_logout_redirect_uri: 'https://env.example/logout',
      loadUserInfo: true,
    })
    expect(screen.queryByTestId('login-callback')).not.toBeInTheDocument()
  })

  it('renders the login callback screen on the configured callback path', () => {
    vi.stubEnv('VITE_COGNITO_METADATA_URL', 'https://env.example/.well-known/openid-configuration')
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'env-client')

    setMockLocation('http://localhost/auth/callback')

    render(
      <AuthProvider loginCallbackPath="/auth/callback">
        <div>child</div>
      </AuthProvider>,
    )

    expect(screen.getByTestId('login-callback')).toBeInTheDocument()
    expect(providerPropsLog).toHaveLength(1)
  })

  it('derives redirect_uri from the current origin when configuration omits it', () => {
    vi.stubEnv('VITE_COGNITO_METADATA_URL', 'https://env.example/.well-known/openid-configuration')
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'env-client')

    setMockLocation('https://app.example/dashboard')

    render(
      <AuthProvider loginCallbackPath="/auth/callback">
        <div>child</div>
      </AuthProvider>,
    )

    expect(providerPropsLog).toHaveLength(1)
    expect(providerPropsLog[0]).toMatchObject({
      redirect_uri: 'https://app.example/auth/callback',
    })
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[AuthProvider] Using redirect_uri:',
      'https://app.example/auth/callback',
    )
  })

  it('warns when the configured redirect_uri does not share the current origin', () => {
    vi.stubEnv('VITE_COGNITO_AUTHORITY', 'https://authority.example')
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'env-client')
    vi.stubEnv('VITE_REDIRECT_URI', 'https://remote.example/callback')

    setMockLocation('https://app.local/dashboard')
    consoleErrorSpy.mockClear()

    render(
      <AuthProvider loginCallbackPath="/auth/callback">
        <div>child</div>
      </AuthProvider>,
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[AuthProvider] redirect_uri mismatch.\n - Current origin: ',
      'https://app.local',
      '\n - Configured redirect_uri:',
      'https://remote.example/callback',
      expect.stringContaining('Action: Update Cognito App client Callback URLs'),
      'https://app.local/auth/callback',
    )
  })

  it('derives authority from the Cognito domain alias and honors metadata overrides', () => {
    vi.stubEnv('VITE_COGNITO_DOMAIN', 'https://tenant-domain.example')
    vi.stubEnv(
      'VITE_COGNITO_METADATA_URL',
      'https://tenant-domain.example/.well-known/openid-configuration',
    )
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'env-client')
    vi.stubEnv('VITE_REDIRECT_URI', '')

    render(
      <AuthProvider loginCallbackPath="/auth/callback">
        <div>child</div>
      </AuthProvider>,
    )

    expect(providerPropsLog).toHaveLength(1)
    expect(providerPropsLog[0]).toMatchObject({
      authority: 'https://tenant-domain.example',
      metadataUrl: 'https://tenant-domain.example/.well-known/openid-configuration',
      client_id: 'env-client',
      redirect_uri: 'http://localhost/auth/callback',
    })
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('ignores blank environment values and still produces a valid configuration', () => {
    vi.stubEnv('VITE_COGNITO_AUTHORITY', '')
    vi.stubEnv('VITE_COGNITO_DOMAIN', '')
    vi.stubEnv(
      'VITE_COGNITO_METADATA_URL',
      'https://metadata.example/.well-known/openid-configuration',
    )
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'env-client')
    vi.stubEnv('VITE_REDIRECT_URI', '')

    render(
      <AuthProvider authority="" client_id="" loginCallbackPath="/auth/callback">
        <div>child</div>
      </AuthProvider>,
    )

    expect(providerPropsLog).toHaveLength(1)
    expect(providerPropsLog[0].authority).toBeUndefined()
    expect(providerPropsLog[0]).toMatchObject({
      metadataUrl: 'https://metadata.example/.well-known/openid-configuration',
      client_id: 'env-client',
      redirect_uri: 'http://localhost/auth/callback',
    })
  })
})
