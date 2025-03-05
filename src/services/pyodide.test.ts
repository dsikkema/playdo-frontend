import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import pyodideService, { PyodideStatus } from './pyodide'

// Mock the loadPyodide function
vi.mock('pyodide', () => {
  const mockPyodideInstance = {
    runPython: vi.fn(),
    runPythonAsync: vi.fn()
  }

  return {
    loadPyodide: vi.fn().mockResolvedValue(mockPyodideInstance)
  }
})

// Type for accessing private properties in tests
type PyodideServicePrivate = {
  pyodide: unknown | null
  status: PyodideStatus
}

describe('PyodideService', () => {
  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock the runPythonAsync implementation
    const { loadPyodide } = await import('pyodide')
    const pyodideInstance = await loadPyodide()

    // Default implementation for successful execution
    vi.mocked(pyodideInstance.runPythonAsync).mockImplementation(
      (code: string) => {
        if (code.includes('print')) {
          console.log('Hello, Pyodide!')
        }

        if (code.includes('raise')) {
          throw new Error('Python error occurred')
        }

        return Promise.resolve('Python execution result')
      }
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should execute code and capture stdout', async () => {
    // Arrange
    await pyodideService.initialize()
    // Clear call count from the initialize method
    vi.clearAllMocks()

    const code = 'print("Hello, Pyodide!")'

    // Act
    const result = await pyodideService.executeCode(code)

    // Assert
    expect(result.stdout).toContain('Hello, Pyodide!')
    expect(result.stderr).toBe('')
    expect(result.error).toBeNull()
    expect(result.result).toBe('Python execution result')
  })

  it('should handle Python errors correctly', async () => {
    // Arrange
    await pyodideService.initialize()
    // Clear call count for testing
    vi.clearAllMocks()

    const code = 'raise Exception("This is a test error")'

    // Act
    const result = await pyodideService.executeCode(code)

    // Assert
    expect(result.error).toContain('Python error occurred')
    expect(result.result).toBeNull()
  })

  it('should handle empty code input', async () => {
    // Arrange
    await pyodideService.initialize()
    // Clear call count for testing
    vi.clearAllMocks()

    // Act
    const result = await pyodideService.executeCode('')

    // Assert
    expect(result.stdout).toBe('')
    expect(result.stderr).toBe('')
    expect(result.error).toBeNull()
  })

  it('should throw an error if Pyodide is not initialized', async () => {
    // Manually set pyodide to null for this test
    // Using type assertion to access private property
    ;(pyodideService as unknown as PyodideServicePrivate)['pyodide'] = null
    ;(pyodideService as unknown as PyodideServicePrivate)['status'] =
      PyodideStatus.ERROR

    // Act & Assert
    await expect(pyodideService.executeCode('print("test")')).rejects.toThrow(
      'Pyodide is not initialized'
    )
  })
})
