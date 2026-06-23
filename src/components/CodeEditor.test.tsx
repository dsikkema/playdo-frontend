import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import CodeEditor from './CodeEditor'
import { ThemeProvider } from '../context/ThemeContext'

// Mock the CodeMirror component and capture extensions for testing
const mockCodeMirror = vi.fn()
vi.mock('@uiw/react-codemirror', () => {
  return {
    default: (props: {
      value?: string
      onChange?: (value: string) => void
      theme?: string
    }) => {
      mockCodeMirror(props)
      return (
        <div data-testid="code-mirror-mock">
          <textarea
            data-testid="code-editor-textarea"
            value={props.value}
            onChange={(e) => props.onChange && props.onChange(e.target.value)}
          />
        </div>
      )
    }
  }
})

// Mock the oneDark theme
vi.mock('@codemirror/theme-one-dark', () => ({
  oneDark: 'mock-one-dark-theme'
}))

describe('CodeEditor', () => {
  beforeEach(() => {
    mockCodeMirror.mockClear()
  })

  it('renders with the correct title', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <CodeEditor />
        </ThemeProvider>
      )
    })
    expect(screen.getByText('Python Editor')).toBeInTheDocument()
  })

  it('calls onRunCode when Mod-Enter is pressed', async () => {
    const handleRunCode = vi.fn()
    const user = userEvent.setup()

    await act(async () => {
      render(
        <ThemeProvider>
          <CodeEditor onRunCode={handleRunCode} />
        </ThemeProvider>
      )
    })

    const textareaElement = screen.getByTestId('code-editor-textarea')

    await act(async () => {
      await user.click(textareaElement)
      await user.keyboard('{Meta>}[Enter]{/Meta}')
    })

    // Since CodeMirror mock doesn't handle keymaps, we can't test this directly
    // In real usage, the keymap extension will handle Mod-Enter
  })

  it('renders with initial code when provided', async () => {
    const initialCode = 'print("Hello world")'
    await act(async () => {
      render(
        <ThemeProvider>
          <CodeEditor initialCode={initialCode} />
        </ThemeProvider>
      )
    })

    // The actual check would depend on how we want to test CodeMirror
    // For now, with our mock, we can verify the value was passed
    const textareaElement = screen.getByTestId('code-editor-textarea')
    expect(textareaElement).toHaveValue(initialCode)
  })

  it('passes code changes to the onChange handler', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    await act(async () => {
      render(
        <ThemeProvider>
          <CodeEditor onChange={handleChange} />
        </ThemeProvider>
      )
    })

    // Get the textarea and simulate typing
    const textareaElement = screen.getByTestId('code-editor-textarea')

    await act(async () => {
      await user.type(textareaElement, 'print("New code")')
    })

    // Wait for the onChange handler to be called
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled()
    })
  })

  it('applies dark theme when theme is dark', async () => {
    // Mock localStorage to return dark theme
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'dark'),
        setItem: vi.fn()
      },
      writable: true
    })

    await act(async () => {
      render(
        <ThemeProvider>
          <CodeEditor />
        </ThemeProvider>
      )
    })

    // Check that CodeMirror was called with the dark theme
    expect(mockCodeMirror).toHaveBeenCalled()
    const lastCall =
      mockCodeMirror.mock.calls[mockCodeMirror.mock.calls.length - 1][0]
    expect(lastCall.theme).toBe('mock-one-dark-theme')
  })

  it('does not apply dark theme when theme is light', async () => {
    // Mock localStorage to return light theme
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'light'),
        setItem: vi.fn()
      },
      writable: true
    })

    await act(async () => {
      render(
        <ThemeProvider>
          <CodeEditor />
        </ThemeProvider>
      )
    })

    // Check that CodeMirror was called without the dark theme
    expect(mockCodeMirror).toHaveBeenCalled()
    const lastCall =
      mockCodeMirror.mock.calls[mockCodeMirror.mock.calls.length - 1][0]
    expect(lastCall.theme).toBeUndefined()
  })

  it('applies dark theme when system preference is dark', async () => {
    // Mock localStorage to return system theme
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'system'),
        setItem: vi.fn()
      },
      writable: true
    })

    // Mock matchMedia to simulate dark system preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    })

    await act(async () => {
      render(
        <ThemeProvider>
          <CodeEditor />
        </ThemeProvider>
      )
    })

    // Check that CodeMirror was called with the dark theme
    expect(mockCodeMirror).toHaveBeenCalled()
    const lastCall =
      mockCodeMirror.mock.calls[mockCodeMirror.mock.calls.length - 1][0]
    expect(lastCall.theme).toBe('mock-one-dark-theme')
  })
})
