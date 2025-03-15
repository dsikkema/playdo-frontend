import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Login from './Login'
import React from 'react'
import { config } from '../config'

// Mock fetch
global.fetch = vi.fn()

// Create a mock login function that we can track
const mockLoginFn = vi.fn()

// Mock the auth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLoginFn,
    isAuthenticated: false
  })
}))

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock implementation
    vi.mocked(fetch).mockReset()
  })

  test('renders login form', () => {
    render(<Login />)

    expect(screen.getByText('Playdo')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  test('handles successful login', async () => {
    // Mock successful fetch response
    const mockToken = 'test-token-123'
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: mockToken })
    } as Response)

    render(<Login />)

    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'testuser' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    // Check if fetch was called correctly
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`${config.backendUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: 'testuser', password: 'password123' })
      })
    })

    // Check if login was called with the token
    await waitFor(() => {
      expect(mockLoginFn).toHaveBeenCalledWith(mockToken)
    })
  })

  test('handles login failure', async () => {
    // Mock failed fetch response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' })
    } as Response)

    render(<Login />)

    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'testuser' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' }
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Login failed/)).toBeInTheDocument()
    })

    // Check login function was not called
    expect(mockLoginFn).not.toHaveBeenCalled()
  })

  test('displays loading state during login', async () => {
    // Mock delayed response
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ access_token: 'test-token' })
              } as Response),
            100
          )
        )
    )

    render(<Login />)

    // Fill in the form and submit
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'testuser' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    // Check if button shows loading state
    expect(screen.getByRole('button')).toHaveTextContent('Signing in...')
    expect(screen.getByRole('button')).toBeDisabled()

    // Wait for the login to complete
    await waitFor(() => {
      expect(mockLoginFn).toHaveBeenCalled()
    })
  })
})
