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
    <div className="flex size-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">Output</div>
          {isCodeRunning ? (
            <div className="flex items-center">
              <div className="mr-2 size-2 animate-pulse rounded-full bg-green-500"></div>
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
          <div className="flex h-full items-center justify-center">
            <div className="text-gray-400">Running code...</div>
          </div>
        )}

        {isPyodideInitializing && (
          <div className="flex h-full items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        )}

        {!isCodeRunning && !hasOutput && (
          <div className="flex h-full items-center justify-center">
            <div className="text-gray-400">
              Run your code to see output here
            </div>
          </div>
        )}

        {/* Standard output */}
        {stdout && (
          <pre
            className="mb-2 whitespace-pre-wrap break-words text-gray-800"
            data-testid="stdout"
          >
            {stdout}
          </pre>
        )}

        {/* Error output (stderr and exceptions) */}
        {stderr && (
          <pre
            className="whitespace-pre-wrap break-words text-red-500"
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
