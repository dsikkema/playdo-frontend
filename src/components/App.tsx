// src/components/App.tsx
import { useState, useEffect } from 'react'
import ConversationManager from './ConversationManager'
import ConversationSelector from './ConversationSelector'
import CodeEditor from './CodeEditor'
import OutputDisplay from './OutputDisplay'
import usePythonExecution from '../hooks/usePythonExecution'

function App() {
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
    initialize()
  }, [initialize])

  // Mark output as stale when code changes
  useEffect(() => {
    setOutputIsStale(true)
  }, [code])

  const handleRunCode = async () => {
    try {
      await executeCode(code)
      setOutputIsStale(false) // Mark output as fresh after running code
    } catch (error) {
      console.error('Failed to execute code:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="mb-8 text-center text-3xl font-bold text-green-600">
          Playdo
        </h1>
        <ConversationSelector
          onSelectConversation={setSelectedConversationId}
          selectedConversationId={selectedConversationId}
        />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex h-auto flex-col space-y-4">
            <div className="relative h-[60vh]">
              <CodeEditor initialCode={code} onChange={setCode} />
              <button
                onClick={handleRunCode}
                disabled={isCodeRunning || isPyodideInitializing}
                className="absolute bottom-4 right-4 rounded-full bg-green-500 p-3 text-white shadow-lg transition hover:bg-green-600 disabled:bg-green-300"
                data-testid="run-code-button"
                aria-label="Run code"
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
            <div className="h-[30vh]">
              <OutputDisplay
                stdout={result?.stdout || ''}
                stderr={result?.stderr || ''}
                isCodeRunning={isCodeRunning}
                isPyodideInitializing={isPyodideInitializing}
              />
            </div>
          </div>
          <div className="flex h-[60vh] flex-col">
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
