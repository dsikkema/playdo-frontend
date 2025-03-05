import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PyodideRunner, createPyodideRunner } from './pyodide'

// Mock the loadPyodide function
vi.mock('pyodide', () => {
  const mockPyodideInstance = {
    runPython: vi.fn(),
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

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks()

    // Create a new instance for each test
    pyodideRunner = createPyodideRunner()

    // Mock the runPythonAsync implementation
    const { loadPyodide } = await import('pyodide')
    const pyodideInstance = await loadPyodide()

    // Default implementation for successful execution
    vi.mocked(pyodideInstance.runPythonAsync).mockImplementation(
      (code: string) => {
        if (code.includes('raise')) {
          throw new Error('Python error occurred')
        }
        return Promise.resolve('Python execution result')
      }
    )

    // Mock setStdout and setStderr to simulate output collection
    // Using any here because we're in tests and exact typing of the mock isn't critical
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(pyodideInstance.setStdout).mockImplementation((options: any) => {
      if (options && typeof options.batched === 'function') {
        // Only simulate output if we're executing code that would produce output
        // We'll manually trigger this in specific tests
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(pyodideInstance.setStderr).mockImplementation((options: any) => {
      if (options && typeof options.batched === 'function') {
        // Only simulate output if we're executing code that would produce output
        // We'll manually trigger this in specific tests
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should execute code and capture stdout', async () => {
    // Arrange
    await pyodideRunner.initialize()

    const { loadPyodide } = await import('pyodide')
    const pyodideInstance = await loadPyodide()

    // Setup stdout simulation for this test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(pyodideInstance.setStdout).mockImplementation((options: any) => {
      if (options && typeof options.batched === 'function') {
        // Simulate stdout output
        options.batched('Hello, Pyodide!')
      }
    })

    const code = 'print("Hello, Pyodide!")'

    // Act
    const result = await pyodideRunner.executeCode(code)

    // Assert
    expect(result.stdout).toContain('Hello, Pyodide!')
    expect(result.stderr).toBe('')
    expect(result.error).toBeNull()
    expect(result.result).toBe('Python execution result')
  })

  it('should handle Python errors correctly', async () => {
    // Arrange
    await pyodideRunner.initialize()

    const { loadPyodide } = await import('pyodide')
    const pyodideInstance = await loadPyodide()

    // Setup stderr simulation for this test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(pyodideInstance.setStderr).mockImplementation((options: any) => {
      if (options && typeof options.batched === 'function') {
        // Simulate stderr output
        options.batched('Error traceback')
      }
    })

    const code = 'raise Exception("This is a test error")'

    // Act
    const result = await pyodideRunner.executeCode(code)

    // Assert
    expect(result.stderr).toContain('Error traceback')
    expect(result.error).toContain('Python error occurred')
    expect(result.result).toBeNull()
  })

  it('should handle empty code input', async () => {
    // Arrange
    await pyodideRunner.initialize()

    // Act
    const result = await pyodideRunner.executeCode('')

    // Assert
    expect(result.stdout).toBe('')
    expect(result.stderr).toBe('')
    expect(result.error).toBeNull()
  })

  it('should call output handlers when provided', async () => {
    // Arrange
    await pyodideRunner.initialize()

    const { loadPyodide } = await import('pyodide')
    const pyodideInstance = await loadPyodide()

    // Setup stdout/stderr simulation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(pyodideInstance.setStdout).mockImplementation((options: any) => {
      if (options && typeof options.batched === 'function') {
        options.batched('Stdout message')
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(pyodideInstance.setStderr).mockImplementation((options: any) => {
      if (options && typeof options.batched === 'function') {
        options.batched('Stderr message')
      }
    })

    // Create mock handlers
    const onStdout = vi.fn()
    const onStderr = vi.fn()

    // Act
    await pyodideRunner.executeCode('print("test")', { onStdout, onStderr })

    // Assert
    expect(onStdout).toHaveBeenCalledWith('Stdout message')
    expect(onStderr).toHaveBeenCalledWith('Stderr message')
  })

  it('should throw an error if Pyodide initialization fails', async () => {
    // Arrange - setup loadPyodide to fail
    const { loadPyodide } = await import('pyodide')
    vi.mocked(loadPyodide).mockRejectedValueOnce(
      new Error('Initialization failed')
    )

    // Create a new instance that will fail to initialize
    const failingRunner = createPyodideRunner()

    // Act & Assert
    await expect(failingRunner.initialize()).rejects.toThrow(
      'Initialization failed'
    )
  })
})
