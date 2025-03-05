import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import CodeEditor from './CodeEditor'

// Mock the CodeMirror component since it's complex and not
// necessary to test fully in our component tests
vi.mock('@uiw/react-codemirror', () => {
  return {
    default: ({
      value,
      onChange
    }: {
      value: string
      onChange: (value: string) => void
    }) => {
      return (
        <div data-testid="code-mirror-mock">
          <textarea
            data-testid="code-editor-textarea"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
          />
        </div>
      )
    }
  }
})

describe('CodeEditor', () => {
  it('renders with the correct title', async () => {
    await act(async () => {
      render(<CodeEditor />)
    })
    expect(screen.getByText('Python Editor')).toBeInTheDocument()
  })

  it('renders with initial code when provided', async () => {
    const initialCode = 'print("Hello world")'
    await act(async () => {
      render(<CodeEditor initialCode={initialCode} />)
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
      render(<CodeEditor onChange={handleChange} />)
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
})
