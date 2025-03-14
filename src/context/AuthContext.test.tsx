import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import React from 'react'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Test component that uses the auth context
const TestComponent = () => {
  const { isAuthenticated, token, login, logout } = useAuth()

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      <div data-testid="token">{token || 'No token'}</div>
      <button data-testid="login-btn" onClick={() => login('test-token')}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  test('provides authentication state and functions', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Not authenticated'
    )
    expect(screen.getByTestId('token')).toHaveTextContent('No token')

    // Test login
    fireEvent.click(screen.getByTestId('login-btn'))
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated')
    expect(screen.getByTestId('token')).toHaveTextContent('test-token')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'playdo_auth_token',
      'test-token'
    )

    // Test logout
    fireEvent.click(screen.getByTestId('logout-btn'))
    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Not authenticated'
    )
    expect(screen.getByTestId('token')).toHaveTextContent('No token')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      'playdo_auth_token'
    )
  })

  test('loads token from localStorage on mount', async () => {
    // Set token in localStorage before mounting
    localStorageMock.getItem.mockReturnValueOnce('stored-token')

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should be authenticated with the stored token
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated')
    expect(screen.getByTestId('token')).toHaveTextContent('stored-token')
    expect(localStorageMock.getItem).toHaveBeenCalledWith('playdo_auth_token')
  })
})
