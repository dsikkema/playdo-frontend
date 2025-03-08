import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PyodideRunner, createPyodideRunner } from './pyodide'
import type { Mock } from 'vitest'

// Define a simple type for Pyodide's output options
interface PyodideOutputOptions {
  batched?: (output: string) => void
}

// Define a type for our mocked pyodide instance
interface MockPyodideInstance {
  runPythonAsync: Mock
  setStdout: Mock
  setStderr: Mock
}

// Mock the pyodide module
vi.mock('pyodide', () => {
  const mockPyodideInstance = {
    runPythonAsync: vi.fn(),
    setStdout: vi.fn(),
    setStderr: vi.fn()
  }

  return {
    loadPyodide: vi.fn().mockResolvedValue(mockPyodideInstance)
  }
})

describe('PyodideRunner', () => {
  let pyodideRunner: PyodideRunner
  let mockPyodideInstance: MockPyodideInstance

  beforeEach(async () => {
    vi.clearAllMocks()

    // Create a fresh instance for each test
    pyodideRunner = createPyodideRunner()

    // Get the mock instance
    const { loadPyodide } = await import('pyodide')
    mockPyodideInstance =
      (await loadPyodide()) as unknown as MockPyodideInstance

    // Default success implementation
    mockPyodideInstance.runPythonAsync.mockResolvedValue('success result')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize Pyodide properly', async () => {
    // Reset call count before this test
    const { loadPyodide } = await import('pyodide')
    vi.mocked(loadPyodide).mockClear()

    // Act
    await pyodideRunner.initialize()

    // Assert
    expect(loadPyodide).toHaveBeenCalledTimes(1)
  })

  it('should execute code and capture stdout', async () => {
    // Arrange
    await pyodideRunner.initialize()

    // Mock runPythonAsync success
    mockPyodideInstance.runPythonAsync.mockResolvedValue('success result')

    // Mock stdout handler
    mockPyodideInstance.setStdout.mockImplementation(
      (options: PyodideOutputOptions) => {
        if (options && typeof options.batched === 'function') {
          options.batched('Hello from stdout')
        }
      }
    )

    // Act
    const result = await pyodideRunner.executeCode('print("test")')

    // Assert
    expect(result.stdout).toBe('Hello from stdout')
    expect(result.stderr).toBe('')
    expect(result.result).toBe('success result')
  })

  it('should execute code and capture stderr', async () => {
    // Arrange
    await pyodideRunner.initialize()

    // Mock runPythonAsync to return null for this test
    mockPyodideInstance.runPythonAsync.mockResolvedValue(null)

    // Mock stdout and stderr handlers
    mockPyodideInstance.setStdout.mockImplementation(() => {})
    mockPyodideInstance.setStderr.mockImplementation(
      (options: PyodideOutputOptions) => {
        if (options && typeof options.batched === 'function') {
          options.batched('Error output')
        }
      }
    )

    // Act
    const result = await pyodideRunner.executeCode(
      'import sys; sys.stderr.write("error")'
    )

    // Assert
    expect(result.stderr).toBe('Error output')
    expect(result.stdout).toBe('')
    expect(result.result).toBeNull()
  })

  it('should handle execution errors correctly', async () => {
    // Arrange
    await pyodideRunner.initialize()

    // Mock an error during execution
    mockPyodideInstance.runPythonAsync.mockRejectedValue(
      new Error('Python error')
    )

    // Reset stdout to avoid test interference
    mockPyodideInstance.setStdout.mockImplementation(() => {})

    // Mock stderr for the error case
    mockPyodideInstance.setStderr.mockImplementation(
      (options: PyodideOutputOptions) => {
        if (options && typeof options.batched === 'function') {
          options.batched('Traceback information')
        }
      }
    )

    // Act
    const result = await pyodideRunner.executeCode('raise Exception("error")')

    // Assert
    expect(result.stderr).toBe('Traceback information\nPython error')
    expect(result.result).toBeNull()
  })

  it('should initialize automatically when executing code', async () => {
    // Reset call count before this test
    const { loadPyodide } = await import('pyodide')
    vi.mocked(loadPyodide).mockClear()

    // Act - note we're not calling initialize() first
    await pyodideRunner.executeCode('print("test")')

    // Assert
    expect(loadPyodide).toHaveBeenCalledTimes(1)
  })

  it('should handle initialization errors', async () => {
    // Arrange
    const { loadPyodide } = await import('pyodide')
    vi.mocked(loadPyodide).mockRejectedValueOnce(new Error('Failed to load'))

    // Act & Assert
    await expect(pyodideRunner.initialize()).rejects.toThrow('Failed to load')
  })
})
