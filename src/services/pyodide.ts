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
 * Creates and manages a Pyodide instance
 */
export class PyodideRunner {
  private pyodide: PyodideInterface | null = null
  private status: PyodideStatus = PyodideStatus.UNINITIALIZED
  private initPromise: Promise<PyodideInterface> | null = null

  /**
   * Initialize a new Pyodide instance
   */
  public async initialize(): Promise<PyodideInterface> {
    // If we already have a Pyodide instance, return it
    if (this.pyodide) {
      return this.pyodide
    }

    // If we're already loading, return the existing promise
    if (this.initPromise) {
      return this.initPromise
    }

    try {
      this.status = PyodideStatus.LOADING

      // Create and store the initialization promise
      this.initPromise = loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.3/full/',
        fullStdLib: true
      })

      // Await the promise and store the result
      this.pyodide = await this.initPromise
      this.status = PyodideStatus.READY
      return this.pyodide
    } catch (error) {
      this.status = PyodideStatus.ERROR
      this.initPromise = null
      console.error('Failed to load Pyodide:', error)
      throw error
    }
  }

  /**
   * Execute Python code and return the result
   * This method doesn't maintain any state between calls
   */
  public async executeCode(code: string): Promise<ExecutionResult> {
    if (!this.pyodide) {
      await this.initialize()
    }

    if (!this.pyodide) {
      throw new Error('Pyodide is not initialized')
    }

    // Set up output capture
    const stdoutBuffer: string[] = []
    const stderrBuffer: string[] = []

    // Set up stdout handler
    this.pyodide.setStdout({
      batched: (output: string) => {
        stdoutBuffer.push(output)
      }
    })

    // Set up stderr handler
    this.pyodide.setStderr({
      batched: (output: string) => {
        stderrBuffer.push(output)
      }
    })

    try {
      // Execute the code
      const result: unknown = await this.pyodide.runPythonAsync(code)

      // Collect output
      const stdout: string = stdoutBuffer.join('\n')
      const stderr: string = stderrBuffer.join('\n')

      return {
        stdout,
        stderr,
        error: null,
        result
      }
    } catch (error) {
      // Collect output even if execution failed
      const stdout: string = stdoutBuffer.join('\n')
      const stderr: string = stderrBuffer.join('\n')

      return {
        stdout,
        stderr,
        error: error instanceof Error ? error.message : String(error),
        result: null
      }
    }
  }

  /**
   * Get the current status of the Pyodide runtime
   */
  public getStatus(): PyodideStatus {
    return this.status
  }

  /**
   * Check if Pyodide is initialized
   */
  public isInitialized(): boolean {
    return this.pyodide !== null
  }
}

/**
 * Factory function to create a PyodideRunner instance
 */
export function createPyodideRunner(): PyodideRunner {
  return new PyodideRunner()
}

// For backward compatibility, maintain a singleton instance
const singletonInstance = new PyodideRunner()

export default singletonInstance
