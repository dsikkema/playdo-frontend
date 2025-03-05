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
 * Interface for output handlers
 */
export interface OutputHandlers {
  onStdout?: (output: string) => void
  onStderr?: (output: string) => void
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
      this.pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      })
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
  public async executeCode(
    code: string,
    outputHandlers?: OutputHandlers
  ): Promise<ExecutionResult> {
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
        outputHandlers?.onStdout?.(output)
      }
    })

    // Set up stderr handler
    this.pyodide.setStderr({
      batched: (output: string) => {
        stderrBuffer.push(output)
        outputHandlers?.onStderr?.(output)
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
    } catch (error: unknown) {
      // Collect output even in case of error
      const stdout: string = stdoutBuffer.join('\n')
      const stderr: string = stderrBuffer.join('\n')

      return {
        stdout,
        stderr,
        error: error instanceof Error ? error.message : String(error),
        result: null
      }
    } finally {
      // Restore original handlers
      if (this.pyodide) {
        this.pyodide.setStdout({})
        this.pyodide.setStderr({})
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
