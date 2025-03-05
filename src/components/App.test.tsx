import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import App from './App'
import usePythonExecution from '../hooks/usePythonExecution'
import { PyodideStatus } from '../services/pyodide'

// Note: deleted previous implementation that mocked api out, because App doesn't directly use api,
// and children components that _do_ use it are mocked in this test, and this fact helps demonstrate
// the value of mocking out those child components entirely.

// Mock the child components
vi.mock('./ConversationSelector', () => ({
  default: ({
    onSelectConversation,
    selectedConversationId
  }: {
    onSelectConversation: (id: number | null) => void
    selectedConversationId: number | null
  }) => (
    <div data-testid="conversation-selector">
      {/**
       * Note: replaces the html content implementation of the real ConversationSelector, because we don't need or care about those implementation
       * details. We only need something in the test component so that we can hook into it and cause the 'onSelectConversation' callback to be
       * called. This is because of the way that the parent and child components interrelate to one another - the child can run the parent's
       * code by means of callbacks.
       *
       * For instance, in one of the tests below, we see:
       * ```
       *     await user.click(screen.getByTestId('select-conversation-button'))
       * ```
       * Which is the test's way of causing the child to run the callback, by clicking the button that's wired up to the callback.
       *
       * The key idea is this test only cares about the way in which the parent interacts with the children, not on the internal
       * workings of the children.
       */}
      <button
        onClick={() => onSelectConversation(1)}
        data-testid="select-conversation-button"
      >
        Select Conversation 1
      </button>
      <div data-testid="selected-id">{selectedConversationId}</div>
    </div>
  )
}))

vi.mock('./ConversationView', () => ({
  default: ({ conversationId }: { conversationId: number | null }) => (
    <div data-testid="conversation-view">
      {conversationId
        ? `Viewing conversation ${conversationId}`
        : 'No conversation selected'}
    </div>
  )
}))

vi.mock('./CodeEditor', () => ({
  default: ({
    initialCode,
    onChange
  }: {
    initialCode: string
    onChange: (code: string) => void
  }) => (
    <div data-testid="code-editor">
      <textarea
        data-testid="code-editor-textarea"
        value={initialCode}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  )
}))

// Mock the usePythonExecution hook
vi.mock('../hooks/usePythonExecution', () => ({
  default: vi.fn(() => ({
    executeCode: vi.fn().mockImplementation(() => {
      // Simulate successful execution
      return Promise.resolve({
        stdout: 'Execution output',
        stderr: '',
        error: null,
        result: null
      })
    }),
    initialize: vi.fn().mockResolvedValue(undefined),
    result: {
      stdout: 'Execution output',
      stderr: '',
      error: null,
      result: null
    },
    isLoading: false,
    status: PyodideStatus.READY,
    error: null
  }))
}))

// Mock CodeEditor to avoid issues with CodeMirror in tests
vi.mock('./CodeEditor', () => ({
  default: vi.fn(({ initialCode, onChange }) => (
    <div data-testid="mock-code-editor">
      <textarea
        data-testid="mock-code-input"
        value={initialCode}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  ))
}))

// Mock other components for simplicity
vi.mock('./ConversationView', () => ({
  default: vi.fn(() => <div data-testid="mock-conversation-view" />)
}))

vi.mock('./ConversationSelector', () => ({
  default: vi.fn(() => <div data-testid="mock-conversation-selector" />)
}))

describe('<App />', () => {
  const mockExecuteCode = vi.fn().mockResolvedValue({
    stdout: 'Execution output',
    stderr: '',
    error: null,
    result: null
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePythonExecution).mockReturnValue({
      executeCode: mockExecuteCode,
      initialize: vi.fn().mockResolvedValue(undefined),
      result: {
        stdout: 'Execution output',
        stderr: '',
        error: null,
        result: null
      },
      isLoading: false,
      status: PyodideStatus.READY,
      error: null
    })
  })

  it('should render the main components correctly', () => {
    // Arrange & Act
    render(<App />)

    // Assert
    expect(screen.getByTestId('mock-conversation-selector')).toBeInTheDocument()
    expect(screen.getByTestId('mock-code-editor')).toBeInTheDocument()
    expect(screen.getByTestId('mock-conversation-view')).toBeInTheDocument()
  })

  it('should render the run button', () => {
    // Arrange & Act
    render(<App />)

    // Assert
    expect(screen.getByTestId('run-code-button')).toBeInTheDocument()
  })

  it('should render the OutputDisplay component', () => {
    // Arrange & Act
    render(<App />)

    // Assert
    expect(screen.getByTestId('output-display')).toBeInTheDocument()
  })

  it('should execute code when the run button is clicked', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<App />)
    const runButton = screen.getByTestId('run-code-button')

    // Act
    await user.click(runButton)

    // Assert
    expect(mockExecuteCode).toHaveBeenCalledTimes(1)
    expect(mockExecuteCode).toHaveBeenCalledWith(
      "# Write your Python code here\nprint('Hello, Playdo!')"
    )
  })

  it('should initialize Pyodide on component mount', async () => {
    // Arrange
    const mockInitialize = vi.fn().mockResolvedValue(undefined)
    vi.mocked(usePythonExecution).mockReturnValue({
      executeCode: mockExecuteCode,
      initialize: mockInitialize,
      result: null,
      isLoading: false,
      status: PyodideStatus.UNINITIALIZED,
      error: null
    })

    // Act
    render(<App />)

    // Assert
    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle Python execution errors gracefully', async () => {
    // Arrange
    const mockExecuteWithError = vi
      .fn()
      .mockRejectedValue(new Error('Execution failed'))
    vi.mocked(usePythonExecution).mockReturnValue({
      executeCode: mockExecuteWithError,
      initialize: vi.fn().mockResolvedValue(undefined),
      result: null,
      isLoading: false,
      status: PyodideStatus.READY,
      error: new Error('Execution failed')
    })

    // Spy on console.error
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const user = userEvent.setup()
    render(<App />)
    const runButton = screen.getByTestId('run-code-button')

    // Act
    await user.click(runButton)

    // Assert
    expect(mockExecuteWithError).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to execute code:',
      expect.any(Error)
    )

    // Cleanup
    consoleErrorSpy.mockRestore()
  })
})
