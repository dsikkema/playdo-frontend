import { useState, useCallback } from 'react'
import pyodideService, {
  ExecutionResult,
  PyodideStatus
} from '../services/pyodide'

interface UsePythonExecutionState {
  result: ExecutionResult | null
  isCodeRunning: boolean
  isPyodideInitializing: boolean
  status: PyodideStatus
  error: Error | null
}

export function usePythonExecution() {
  const [state, setState] = useState<UsePythonExecutionState>({
    result: null,
    isCodeRunning: false,
    isPyodideInitializing: false,
    status: pyodideService.getStatus(),
    error: null
  })

  /**
   * Initialize Pyodide if not already initialized
   * TOODO: understand better useCallback and its memoization of returned function references, as it's used by
   * the initialize and executeCode callbacks
   */
  const initialize = useCallback(async () => {
    if (
      state.status === PyodideStatus.UNINITIALIZED ||
      state.status === PyodideStatus.ERROR
    ) {
      try {
        setState((prev) => ({ ...prev, isPyodideInitializing: true }))
        await pyodideService.initialize()
        setState((prev) => ({
          ...prev,
          isPyodideInitializing: false,
          status: pyodideService.getStatus(),
          error: null
        }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isPyodideInitializing: false,
          status: PyodideStatus.ERROR,
          error:
            error instanceof Error
              ? error
              : new Error('Failed to initialize Pyodide')
        }))
      }
    }
  }, [state.status])

  // Execute Python code
  const executeCode = useCallback(
    async (code: string) => {
      try {
        // Set code running state and clear previous results
        setState((prev) => ({
          ...prev,
          isCodeRunning: true,
          result: {
            stdout: '',
            stderr: '',
            error: null,
            result: null
          }
        }))

        // Initialize if needed
        if (state.status === PyodideStatus.UNINITIALIZED) {
          await initialize()
        }

        // Execute the code
        const result = await pyodideService.executeCode(code)

        // Update state with results
        setState((prev) => ({
          ...prev,
          result,
          isCodeRunning: false,
          error: null
        }))

        return result
      } catch (error) {
        // Handle execution errors
        setState((prev) => ({
          ...prev,
          isCodeRunning: false,
          error:
            error instanceof Error
              ? error
              : new Error('Failed to execute code'),
          result: {
            stdout: '',
            stderr: '',
            error: error instanceof Error ? error.message : String(error),
            result: null
          }
        }))

        // Re-throw for caller to handle if needed
        throw error
      }
    },
    [initialize, state.status]
  )

  return {
    executeCode,
    initialize,
    ...state
  }
}

export default usePythonExecution
