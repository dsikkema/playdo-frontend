import { loadPyodide, type PyodideInterface } from 'pyodide'

/**
 * Possible states for the Pyodide runtime
 */
export enum PyodideStatus {
  UNINITIALIZED = 'uninitialized',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error'
}

/**
 * Type for the execution result
 */
export interface ExecutionResult {
  stdout: string
  stderr: string
  error: string | null
  result: unknown
}

/**
 * Singleton class to manage the Pyodide runtime
 */
class PyodideService {
  private static instance: PyodideService
  private pyodidePromise: Promise<PyodideInterface> | null = null
  private pyodide: PyodideInterface | null = null
  private status: PyodideStatus = PyodideStatus.UNINITIALIZED
  private stdoutBuffer: string[] = []
  private stderrBuffer: string[] = []

  private constructor() {
    // Nothing to initialize now that we're using pyodide.setStdout/setStderr
  }

  /**
   * Get the singleton instance of PyodideService
   */
  public static getInstance(): PyodideService {
    if (!PyodideService.instance) {
      PyodideService.instance = new PyodideService()
    }
    return PyodideService.instance
  }

  /**
   * Initialize Pyodide runtime
   */
  public async initialize(): Promise<PyodideInterface> {
    if (this.pyodide) {
      return this.pyodide
    }

    if (this.pyodidePromise) {
      return this.pyodidePromise
    }

    this.status = PyodideStatus.LOADING
    this.pyodidePromise = loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
    })
      .then((pyodide: PyodideInterface) => {
        this.pyodide = pyodide
        this.status = PyodideStatus.READY
        return pyodide
      })
      .catch((error: Error) => {
        this.status = PyodideStatus.ERROR
        console.error('Failed to load Pyodide:', error)
        throw error
      })

    return this.pyodidePromise
  }

  /**
   * Get the current status of the Pyodide runtime
   */
  public getStatus(): PyodideStatus {
    return this.status
  }

  /**
   * Execute Python code and capture stdout, stderr, and the return value
   */
  public async executeCode(code: string): Promise<ExecutionResult> {
    if (!this.pyodide && this.status !== PyodideStatus.LOADING) {
      await this.initialize()
    }

    if (!this.pyodide) {
      throw new Error('Pyodide is not initialized')
    }

    // Clear output buffers
    this.stdoutBuffer = []
    this.stderrBuffer = []

    // Redirect stdout and stderr
    this.redirectOutput()

    try {
      // Execute the code
      const result: unknown = await this.pyodide.runPythonAsync(code)

      // Collect output
      const stdout: string = this.stdoutBuffer.join('\n')
      const stderr: string = this.stderrBuffer.join('\n')

      return {
        stdout,
        stderr,
        error: null,
        result
      }
    } catch (error: unknown) {
      // Collect output even in case of error
      const stdout: string = this.stdoutBuffer.join('\n')
      const stderr: string = this.stderrBuffer.join('\n')

      return {
        stdout,
        stderr,
        error: error instanceof Error ? error.message : String(error),
        result: null
      }
    } finally {
      // Restore original console methods
      this.restoreOutput()
    }
  }

  /**
   * Redirect stdout and stderr to capture output
   */
  private redirectOutput(): void {
    // Clear output buffers
    this.stdoutBuffer = []
    this.stderrBuffer = []

    if (this.pyodide) {
      // Set stdout handler
      this.pyodide.setStdout({
        batched: (output: string) => {
          this.stdoutBuffer.push(output)
        }
      })

      // Set stderr handler
      this.pyodide.setStderr({
        batched: (output: string) => {
          this.stderrBuffer.push(output)
        }
      })
    }
  }

  /**
   * Restore original stdout and stderr
   */
  private restoreOutput(): void {
    // Restore Python stdout/stderr by passing no handler (reverts to default)
    if (this.pyodide) {
      this.pyodide.setStdout({})
      this.pyodide.setStderr({})
    }
  }
}

// Export singleton instance
export default PyodideService.getInstance()
