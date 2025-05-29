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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50/20 px-4 py-12 dark:from-gray-900 dark:to-gray-800 sm:px-6 lg:px-8">
      <div className="w-full max-w-md animate-fade-in space-y-8">
        <div>
          <h1 className="mt-6 animate-scale-in bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-center text-4xl font-extrabold text-transparent">
            Playdo
          </h1>
          <h2 className="mt-2 text-center text-xl text-gray-600 dark:text-gray-300">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Welcome to your Python learning journey
          </p>
        </div>

        {error && (
          <div className="animate-fade-in-down rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-800 dark:bg-red-900/50">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        <form
          className="mt-8 space-y-6 rounded-2xl bg-white p-8 shadow-soft dark:bg-gray-800"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
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
                className="relative block w-full appearance-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-300 sm:text-sm"
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
                className="relative block w-full appearance-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-300 sm:text-sm"
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
              className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:from-primary-600 hover:to-primary-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="mr-2 size-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
