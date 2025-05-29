import { useEffect, useRef } from 'react'

export interface OutputDisplayProps {
  stdout: string
  stderr: string
  isCodeRunning?: boolean
  isPyodideInitializing?: boolean
}

function OutputDisplay({
  stdout,
  stderr,
  isCodeRunning = false,
  isPyodideInitializing = false
}: OutputDisplayProps) {
  const outputRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [stdout, stderr])

  const hasOutput = stdout || stderr

  return (
    <div className="flex size-full flex-col rounded-lg border border-gray-200 bg-white shadow-soft transition-all duration-300 hover:shadow-lg">
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">Output</div>
          {isCodeRunning ? (
            <div className="flex animate-fade-in items-center">
              <div className="mr-2 size-2 animate-pulse rounded-full bg-primary-500"></div>
              <span className="text-xs text-gray-500">Running...</span>
            </div>
          ) : null}
        </div>
      </div>
      <div
        ref={outputRef}
        className="size-full overflow-auto p-4 font-mono text-sm"
        data-testid="output-display"
      >
        {isCodeRunning && !hasOutput && (
          <div className="flex h-full animate-fade-in items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="mb-3 flex space-x-1">
                <div
                  className="size-2 animate-bounce-soft rounded-full bg-primary-400"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="size-2 animate-bounce-soft rounded-full bg-primary-500"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="size-2 animate-bounce-soft rounded-full bg-primary-600"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
              <div className="text-gray-400">Running code...</div>
            </div>
          </div>
        )}

        {isPyodideInitializing && (
          <div className="flex h-full animate-fade-in items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="mb-3">
                <svg
                  className="size-8 animate-spin-slow text-primary-500"
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
              </div>
              <div className="text-gray-400">
                Initializing Python environment...
              </div>
            </div>
          </div>
        )}

        {!isCodeRunning && !isPyodideInitializing && !hasOutput && (
          <div className="flex h-full animate-fade-in items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <svg
                className="mb-3 size-12 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div className="text-gray-400">
                Run your code to see output here
              </div>
              <div className="mt-1 text-xs text-gray-300">
                Click the play button or press Ctrl+Enter
              </div>
            </div>
          </div>
        )}

        {/* Standard output */}
        {stdout && (
          <pre
            className="mb-2 animate-fade-in-up whitespace-pre-wrap break-words text-gray-800"
            data-testid="stdout"
          >
            {stdout}
          </pre>
        )}

        {/* Error output (stderr and exceptions) */}
        {stderr && (
          <pre
            className="animate-fade-in-up whitespace-pre-wrap break-words text-red-500"
            data-testid="error-output"
          >
            {stderr && <span>{stderr}</span>}
          </pre>
        )}
      </div>
    </div>
  )
}

export default OutputDisplay
