import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Define mock results
const mockExecutionResult = {
  stdout: 'Hello, World!',
  stderr: '',
  error: null,
  result: 'Execution result'
}

const mockErrorResult = {
  stdout: '',
  stderr: 'Error message',
  error: 'Python error occurred',
  result: null
}

// Mock the pyodideService
vi.mock('../services/pyodide', () => {
  return {
    default: {
      getStatus: vi.fn().mockReturnValue('uninitialized'),
      initialize: vi.fn().mockResolvedValue(undefined),
      executeCode: vi.fn().mockImplementation((code) => {
        if (code.includes('error')) {
          return Promise.reject(new Error('Execution failed'))
        }
        if (code.includes('raise')) {
          return Promise.resolve(mockErrorResult)
        }
        return Promise.resolve(mockExecutionResult)
      })
    },
    PyodideStatus: {
      UNINITIALIZED: 'uninitialized',
      LOADING: 'loading',
      READY: 'ready',
      ERROR: 'error'
    }
  }
})

// Import after the mock is set up
import usePythonExecution from './usePythonExecution'
import pyodideService, { PyodideStatus } from '../services/pyodide'

describe('usePythonExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should initialize Pyodide when called', async () => {
    // Arrange
    const { result } = renderHook(() => usePythonExecution())

    // Act
    await act(async () => {
      await result.current.initialize()
    })

    // Assert
    expect(pyodideService.initialize).toHaveBeenCalledTimes(1)
  })

  it('should execute code and return the result', async () => {
    // Arrange
    const { result } = renderHook(() => usePythonExecution())
    const code = 'print("Hello, World!")'

    // Mock the executeCode to return the expected result
    vi.mocked(pyodideService.executeCode).mockResolvedValueOnce(
      mockExecutionResult
    )

    // Act
    await act(async () => {
      await result.current.executeCode(code)
    })

    // Assert
    expect(pyodideService.executeCode).toHaveBeenCalledWith(code)
    expect(result.current.result).toEqual(mockExecutionResult)
    expect(result.current.isCodeRunning).toBe(false)
  })

  it('should handle Python errors during execution', async () => {
    // Arrange
    const { result } = renderHook(() => usePythonExecution())
    const code = 'raise Exception("This is a test error")'

    // Mock the executeCode to return the expected error result
    vi.mocked(pyodideService.executeCode).mockResolvedValueOnce(mockErrorResult)

    // Act
    await act(async () => {
      await result.current.executeCode(code)
    })

    // Assert
    expect(pyodideService.executeCode).toHaveBeenCalledWith(code)
    expect(result.current.result).toEqual(mockErrorResult)
  })

  it('should handle JavaScript errors during execution', async () => {
    // Arrange
    const { result } = renderHook(() => usePythonExecution())
    const code = 'error in JS'

    // Mock the executeCode to throw an error
    const error = new Error('Execution failed')
    vi.mocked(pyodideService.executeCode).mockRejectedValueOnce(error)

    // Act & Assert
    await act(async () => {
      try {
        await result.current.executeCode(code)
        // If we get here, the test should fail
        expect(true).toBe(false) // This should not be reached
      } catch (err) {
        expect(err).toBe(error)
      }
    })

    // Check state updates
    expect(result.current.isCodeRunning).toBe(false)
    expect(result.current.error).toBe(error)
    expect(result.current.result?.error).toBe('Execution failed')
  })

  it('should auto-initialize when executing code if not initialized', async () => {
    // Arrange
    vi.mocked(pyodideService.getStatus).mockReturnValue(
      PyodideStatus.UNINITIALIZED
    )
    const { result } = renderHook(() => usePythonExecution())
    const code = 'print("Hello, World!")'

    // Mock the executeCode to return the expected result
    vi.mocked(pyodideService.executeCode).mockResolvedValueOnce(
      mockExecutionResult
    )

    // Act
    await act(async () => {
      await result.current.executeCode(code)
    })

    // Assert
    expect(pyodideService.initialize).toHaveBeenCalledTimes(1)
    expect(pyodideService.executeCode).toHaveBeenCalledWith(code)
  })
})
