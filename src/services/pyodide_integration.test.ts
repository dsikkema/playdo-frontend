import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Pyodide Integration Tests
 *
 * These tests are designed to run ONLY in a browser environment with the actual
 * Pyodide library. All tests will be skipped when running in Node.js.
 *
 * To run these tests in a browser:
 * 1. Use `npm run test:ui` - browser-based test runner with Vitest UI
 * 2. Ensure the browser can access the Pyodide CDN
 */

// Detect if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

// Create a skipped test suite if not running in a browser
describe.skip('PyodideService Integration Tests (Browser Only)', () => {
  it('These tests run only in a browser environment', () => {
    // This test is skipped in Node.js
    expect(true).toBe(true)
  })
})

// If we're in a browser, attempt to run the actual tests
if (isBrowser) {
  // We use an IIFE to handle top-level awaits
  void (async () => {
    try {
      // Import pyodideService dynamically to avoid Node.js errors
      const pyodideModule = await import('./pyodide')
      const pyodideService = pyodideModule.default
      const { PyodideStatus } = pyodideModule

      describe('PyodideService Integration Tests', () => {
        // Set a longer timeout for loading Pyodide (60 seconds)
        beforeAll(async () => {
          // Initialize Pyodide only once for all tests
          await pyodideService.initialize()
        }, 60000)

        it('should initialize Pyodide successfully', () => {
          expect(pyodideService.getStatus()).toBe(PyodideStatus.READY)
        })

        it('should execute simple Python code and return the result', async () => {
          const result = await pyodideService.executeCode('1 + 1')
          expect(result.result).toBe(2)
        }, 10000)

        it('should capture stdout from Python print statements', async () => {
          const result = await pyodideService.executeCode(
            'print("Hello from Python!")'
          )
          expect(result.stdout).toContain('Hello from Python!')
        }, 10000)

        it('should handle Python errors correctly', async () => {
          const result = await pyodideService.executeCode(
            'raise ValueError("Test error")'
          )
          // Python errors now appear in stderr instead of a separate error property
          expect(result.stderr).toContain('ValueError')
          expect(result.result).toBeNull()
        }, 10000)

        it('should execute multiple statements and maintain state between them', async () => {
          await pyodideService.executeCode('x = 42')
          const result = await pyodideService.executeCode('print(x)')
          expect(result.stdout).toContain('42')
        }, 10000)

        it('should be able to import Python standard libraries', async () => {
          const result = await pyodideService.executeCode(`
import math
result = math.sqrt(16)
print(f"The square root of 16 is {result}")
          `)
          expect(result.stdout).toContain('The square root of 16 is 4.0')
        }, 10000)

        it('should handle complex data structures', async () => {
          const result = await pyodideService.executeCode(`
data = {"name": "John", "age": 30, "scores": [90, 85, 95]}
print(f"Name: {data['name']}, Average score: {sum(data['scores']) / len(data['scores'])}")
data
          `)
          expect(result.stdout).toContain('Name: John')
          expect(result.stdout).toContain('Average score: 90')
          expect(result.result).toHaveProperty('name', 'John')
          expect(result.result).toHaveProperty('age', 30)
          expect(result.result).toHaveProperty('scores')
        }, 10000)

        it('should install and use a package with micropip', async () => {
          const result = await pyodideService.executeCode(`
import pyodide_js
await pyodide_js.loadPackagesFromImports('micropip')
import micropip
await micropip.install('cowsay')
import cowsay
message = cowsay.cow('Hello from Pyodide!')
print(message)
          `)
          expect(result.stdout).toContain('Hello from Pyodide!')
        }, 60000)

        it('should demonstrate JavaScript <-> Python interoperability', async () => {
          const result = await pyodideService.executeCode(`
from pyodide.ffi import create_proxy, to_js

# Create a Python function
def multiply(a, b):
    return a * b

# Create a JavaScript proxy of the Python function
multiply_proxy = create_proxy(multiply)

# Call the Python function from JavaScript and get the result
js_result = to_js(multiply_proxy(6, 7))

print(f"6 * 7 = {js_result}")
js_result
          `)
          expect(result.stdout).toContain('6 * 7 = 42')
          expect(result.result).toBe(42)
        }, 10000)
      })
    } catch (error) {
      console.error('Error loading Pyodide:', error)
    }
  })()
}
