import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { config } from '../config'

const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loginFailed, setLoginFailed] = useState(false)
  /**
   * The point of useRef is to be a stable "container" around the DOM element. It's inited to null (because I'm passing null
   * here) but on render, usernameRef.current will point to the DOM element itself. The connection comes in JSX code below
   * where the username element has ref={usernameRef}.
   *
   * This ref always has only one property: `.current`
   *
   * On re-renders, "magic happens" in react land. React actually keeps the same DOM elements there in the browser, even if
   * the React component re-rendered, and even if the DOMelement's prop's changed. If the element is removed, or if a whole
   * new element gets attached to this ref with ref={usernameRef}, then the .current will be nulled or updated respectively.
   */
  const usernameRef = useRef<HTMLInputElement>(null)

  /**
   * Note: using the magic of context here. whenever the context updates, all components that depend on it (including this one)
   * will re-render. Hence the need to avoid super global context objects - composition is key, because it means updates to
   * one context (e.g. useTheme, if there was one) won't cause re-renders to components that only depend on useAuth
   */
  const { login } = useAuth()

  useEffect(() => {
    if (loginFailed) {
      setUsername('')
      setPassword('')
      usernameRef.current?.focus()
    }
  }, [loginFailed])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    /**
     * Quick reminder: calling hooks like useState inside conditions (not in the same order each time) is the problem, but
     * calling the _setters_ that are _returned by_ the hooks is fine in an out-of-order or conditional way.
     */
    setLoginFailed(false)
    setIsLoading(true)

    /**
     * Note: it's unnecessary to check for empty username/pwd here because they have 'required' prop set in the jsx
     */
    try {
      const response = await fetch(`${config.backendUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      if (response.status === 401) {
        setLoginFailed(true)
        setError('Invalid username or password')
        setIsLoading(false)
        throw new Error('Login failed. Please check your credentials.')
      } else if (!response.ok) {
        throw new Error('An unexpected error occurred')
      }

      const data = await response.json()
      login(data.access_token)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-green-600">
            Playdo
          </h1>
          <h2 className="mt-2 text-center text-xl text-gray-600">
            Sign in to your account
          </h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                ref={usernameRef}
                name="username"
                type="text"
                autoComplete="username"
                required
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
