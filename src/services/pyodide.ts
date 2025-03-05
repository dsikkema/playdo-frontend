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

  /**
   * Initialize a new Pyodide instance
   */
  public async initialize(): Promise<PyodideInterface> {
    if (this.pyodide) {
      return this.pyodide
    }

    try {
      this.status = PyodideStatus.LOADING
      this.pyodide = await loadPyodide()
      this.status = PyodideStatus.READY
      return this.pyodide
    } catch (error) {
      this.status = PyodideStatus.ERROR
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
