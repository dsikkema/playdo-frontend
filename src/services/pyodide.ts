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
  private originalConsoleLog: (...data: unknown[]) => void
  private originalConsoleError: (...data: unknown[]) => void
  private stdoutBuffer: string[] = []
  private stderrBuffer: string[] = []

  private constructor() {
    // Save original console methods
    this.originalConsoleLog = console.log
    this.originalConsoleError = console.error
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
      .then((pyodide) => {
        this.pyodide = pyodide
        this.status = PyodideStatus.READY
        return pyodide
      })
      .catch((error) => {
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
      const result = await this.pyodide.runPythonAsync(code)

      // Collect output
      const stdout = this.stdoutBuffer.join('\n')
      const stderr = this.stderrBuffer.join('\n')

      return {
        stdout,
        stderr,
        error: null,
        result
      }
    } catch (error) {
      // Collect output even in case of error
      const stdout = this.stdoutBuffer.join('\n')
      const stderr = this.stderrBuffer.join('\n')

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
   * Redirect stdout and stderr to buffers
   */
  private redirectOutput() {
    // Save original methods
    const originalConsoleLog = console.log
    const originalConsoleError = console.error
    const stdoutBuffer = this.stdoutBuffer
    const stderrBuffer = this.stderrBuffer

    // Override console.log to capture stdout
    console.log = function (...args) {
      const output = args.map((arg) => String(arg)).join(' ')
      stdoutBuffer.push(output)
      // Still call original for debugging
      originalConsoleLog.apply(console, args)
    }

    // Override console.error to capture stderr
    console.error = function (...args) {
      const output = args.map((arg) => String(arg)).join(' ')
      stderrBuffer.push(output)
      // Still call original for debugging
      originalConsoleError.apply(console, args)
    }

    // Set up Python stdout/stderr redirection
    if (this.pyodide) {
      this.pyodide.runPython(`
        import sys
        from pyodide.ffi import to_js

        class PyodideOutput:
            def __init__(self, console_method):
                self.console_method = console_method
                self.buffer = ''

            def write(self, text):
                self.buffer += text
                if '\\n' in text:
                    self.flush()
                return len(text)

            def flush(self):
                if self.buffer:
                    self.console_method(self.buffer.rstrip())
                    self.buffer = ''

        sys.stdout = PyodideOutput(to_js(console.log))
        sys.stderr = PyodideOutput(to_js(console.error))
      `)
    }
  }

  /**
   * Restore original stdout and stderr
   */
  private restoreOutput() {
    // Restore console methods
    console.log = this.originalConsoleLog
    console.error = this.originalConsoleError

    // Restore Python stdout/stderr
    if (this.pyodide) {
      try {
        this.pyodide.runPython(`
          import sys
          sys.stdout = sys.__stdout__
          sys.stderr = sys.__stderr__
        `)
      } catch (e) {
        console.error('Error restoring Python stdout/stderr:', e)
      }
    }
  }
}

// Export singleton instance
export default PyodideService.getInstance()
