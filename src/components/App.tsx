// src/components/App.tsx
import { useState, useEffect, useCallback } from 'react'
import ConversationManager from './ConversationManager'
import ConversationSelector from './ConversationSelector'
import CodeEditor from './CodeEditor'
import OutputDisplay from './OutputDisplay'
import Login from './Login'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../context/AuthContext'
import usePythonExecution from '../hooks/usePythonExecution'

function App() {
  const { isAuthenticated, logout } = useAuth()
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null)
  const [code, setCode] = useState(
    "# Write your Python code here\nprint('Hello, Playdo!')"
  )
  const [outputIsStale, setOutputIsStale] = useState(true)

  // below function does code execution and populates outputs into result. Happens
  // on every component re-render. That way the OutputElement below can display
  // it all.
  const {
    executeCode,
    initialize,
    result,
    isCodeRunning,
    isPyodideInitializing
  } = usePythonExecution()

  // Initialize Pyodide on component mount
  useEffect(() => {
    if (isAuthenticated) {
      initialize()
    }
  }, [initialize, isAuthenticated])

  // Clear all user-specific state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedConversationId(null)
      setCode("# Write your Python code here\nprint('Hello, Playdo!')")
      setOutputIsStale(true)
    }
  }, [isAuthenticated])

  // Mark output as stale when code changes
  useEffect(() => {
    setOutputIsStale(true)
  }, [code])

  const handleRunCode = useCallback(async () => {
    try {
      await executeCode(code)
      setOutputIsStale(false) // Mark output as fresh after running code
    } catch (error) {
      console.error('Failed to execute code:', error)
    }
  }, [code, executeCode])

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <Login />
  }

  // Otherwise, show the main application
  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 to-primary-50/20 dark:from-gray-900 dark:to-gray-800">
      {/* Fixed header */}
      <header className="z-10 bg-white/90 shadow-soft backdrop-blur-sm transition-all duration-300 dark:bg-gray-800/90">
        <div className="container mx-auto px-4 py-3">
          <div className="relative flex items-center">
            {/* Left - App Title */}
            <div className="absolute left-4">
              <h1 className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-xl font-bold text-transparent">
                Playdo
              </h1>
            </div>

            {/* Center - Conversation Selector */}
            <div className="mx-auto">
              <ConversationSelector
                onSelectConversation={setSelectedConversationId}
                selectedConversationId={selectedConversationId}
              />
            </div>

            {/* Right - Theme toggle and Logout button */}
            <div className="absolute right-4 flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={logout}
                className="text-sm text-gray-600 transition-colors duration-200 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - non-scrollable container */}
      <div className="container mx-auto flex-1 animate-fade-in overflow-hidden p-4">
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Code editor column - left side */}
          <div className="flex h-full flex-col overflow-hidden">
            {/* Code editor - take 2/3 height */}
            <div className="mb-4 grow overflow-hidden">
              <div className="relative h-full">
                <CodeEditor
                  initialCode={code}
                  onChange={setCode}
                  onRunCode={handleRunCode}
                />
                <button
                  onClick={handleRunCode}
                  disabled={isCodeRunning || isPyodideInitializing}
                  className="absolute bottom-4 right-4 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 p-3 text-white shadow-soft transition-all duration-200 hover:scale-105 hover:shadow-glow-green disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:hover:scale-100"
                  data-testid="run-code-button"
                  aria-label="Run code"
                  title="Run code (Ctrl+Enter)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6"
                  >
                    {/*The below is a play button in SVG*/}
                    <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Output display - take 1/3 height */}
            <div className="h-1/3 overflow-y-auto">
              <OutputDisplay
                stdout={result?.stdout || ''}
                stderr={result?.stderr || ''}
                isCodeRunning={isCodeRunning}
                isPyodideInitializing={isPyodideInitializing}
              />
            </div>
          </div>

          {/* Conversation column - right side */}
          <div className="h-full overflow-hidden">
            <ConversationManager
              conversationId={selectedConversationId}
              currentCode={code}
              stdout={result?.stdout || null}
              stderr={result?.stderr || null}
              outputIsStale={outputIsStale}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
